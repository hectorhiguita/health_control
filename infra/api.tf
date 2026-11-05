# ─────────────────────────────────────────────────────────────
# API — HTTP API con autorizador JWT de Cognito → una Lambda.
# ─────────────────────────────────────────────────────────────

# La llave de Claude NO pasa por Terraform: se crea con un valor
# de relleno y se cambia a mano (ver README). Así no queda en el estado.
resource "aws_ssm_parameter" "llave_claude" {
  name        = "/${local.nombre}/anthropic-api-key"
  description = "Llave de la API de Anthropic para el asistente"
  type        = "SecureString"
  value       = "CAMBIAR"

  lifecycle {
    ignore_changes = [value]
  }
}

data "archive_file" "api" {
  type        = "zip"
  source_dir  = "${path.module}/../backend"
  output_path = "${path.module}/.build/api.zip"
  excludes    = ["package-lock.json", ".gitignore"]
}

resource "aws_iam_role" "api" {
  name = "${local.nombre}-api"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
      Condition = { StringEquals = { "aws:SourceAccount" = local.cuenta } }
    }]
  })
}

resource "aws_iam_role_policy" "api" {
  name = "acceso-minimo"
  role = aws_iam_role.api.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "Tabla"
        Effect   = "Allow"
        Action   = ["dynamodb:Query", "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:BatchWriteItem"]
        Resource = aws_dynamodb_table.registros.arn
      },
      {
        Sid      = "Documentos"
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.documentos.arn}/docs/*"
      },
      {
        Sid      = "LlaveClaude"
        Effect   = "Allow"
        Action   = "ssm:GetParameter"
        Resource = aws_ssm_parameter.llave_claude.arn
      },
      {
        Sid       = "DescifrarLlave"
        Effect    = "Allow"
        Action    = "kms:Decrypt"
        Resource  = "*"
        Condition = { StringEquals = { "kms:ViaService" = "ssm.${var.region}.amazonaws.com" } }
      },
      {
        Sid      = "Logs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.api.arn}:*"
      },
    ]
  })
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${local.nombre}-api"
  retention_in_days = 30
}

resource "aws_lambda_function" "api" {
  function_name    = "${local.nombre}-api"
  role             = aws_iam_role.api.arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "src/index.handler"
  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256
  memory_size      = 512
  timeout          = 29

  # Una sola persona: tope bajo para frenar abusos y gasto
  reserved_concurrent_executions = 5

  environment {
    variables = {
      TABLA         = aws_dynamodb_table.registros.name
      BUCKET        = aws_s3_bucket.documentos.bucket
      PACIENTE_ID   = var.paciente_id
      GRUPO         = aws_cognito_user_group.familia.name
      PARAM_CLAUDE  = aws_ssm_parameter.llave_claude.name
      MODELO_CLAUDE = var.modelo_claude
      NODE_OPTIONS  = "--enable-source-maps"
    }
  }

  depends_on = [aws_cloudwatch_log_group.api, aws_iam_role_policy.api]
}

resource "aws_apigatewayv2_api" "http" {
  name          = "${local.nombre}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = local.origenes
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["authorization", "content-type"]
    max_age       = 3600
  }
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.http.id
  name             = "cognito"
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.usuarios.id}"
    audience = [aws_cognito_user_pool_client.web.id]
  }
}

resource "aws_apigatewayv2_integration" "api" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 29000
}

resource "aws_apigatewayv2_route" "api" {
  for_each = toset(["GET", "POST", "PUT", "DELETE"])

  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "${each.key} /{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.api.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_cloudwatch_log_group" "api_acceso" {
  name              = "/aws/apigateway/${local.nombre}"
  retention_in_days = 30
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 20
    throttling_rate_limit  = 10
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_acceso.arn
    format = jsonencode({
      id      = "$context.requestId"
      ruta    = "$context.routeKey"
      estado  = "$context.status"
      ms      = "$context.responseLatency"
      usuario = "$context.authorizer.claims.sub"
      error   = "$context.authorizer.error"
    })
  }
}

resource "aws_lambda_permission" "api" {
  statement_id  = "PermitirApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
