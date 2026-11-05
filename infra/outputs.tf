output "url_sitio" {
  value = local.origen_web
}

output "region" {
  value = var.region
}

output "api_url" {
  value = aws_apigatewayv2_api.http.api_endpoint
}

output "user_pool_id" {
  value = aws_cognito_user_pool.usuarios.id
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.web.id
}

output "dominio_login" {
  value = local.dominio_login
}

output "bucket_sitio" {
  value = aws_s3_bucket.sitio.bucket
}

output "distribucion_id" {
  value = aws_cloudfront_distribution.sitio.id
}

output "parametro_llave_claude" {
  value = aws_ssm_parameter.llave_claude.name
}
