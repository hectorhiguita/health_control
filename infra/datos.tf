# ─────────────────────────────────────────────────────────────
# DATOS — tabla única en DynamoDB y bucket privado para PDF.
#
# Tabla:   PK = PAC#<paciente>   SK = <TIPO>#<id>
#          TIPO = PERFIL | HEMO | SIGNO | LAB | EVENTO | DOC
# ─────────────────────────────────────────────────────────────

resource "aws_dynamodb_table" "registros" {
  name                        = "${local.nombre}-registros"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "pk"
  range_key                   = "sk"
  deletion_protection_enabled = true

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_s3_bucket" "documentos" {
  bucket = "${local.nombre}-documentos-${local.sufijo}"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_public_access_block" "documentos" {
  bucket                  = aws_s3_bucket.documentos.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "documentos" {
  bucket = aws_s3_bucket.documentos.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documentos" {
  bucket = aws_s3_bucket.documentos.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "documentos" {
  bucket = aws_s3_bucket.documentos.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "documentos" {
  bucket = aws_s3_bucket.documentos.id
  rule {
    id     = "borrados-30-dias"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

# Solo HTTPS
resource "aws_s3_bucket_policy" "documentos" {
  bucket = aws_s3_bucket.documentos.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "SoloTLS"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = [aws_s3_bucket.documentos.arn, "${aws_s3_bucket.documentos.arn}/*"]
      Condition = { Bool = { "aws:SecureTransport" = "false" } }
    }]
  })
  depends_on = [aws_s3_bucket_public_access_block.documentos]
}

# El navegador sube y abre los PDF con URL firmadas
resource "aws_s3_bucket_cors_configuration" "documentos" {
  bucket = aws_s3_bucket.documentos.id
  cors_rule {
    allowed_methods = ["GET", "POST"]
    allowed_origins = local.origenes
    allowed_headers = ["*"]
    max_age_seconds = 3000
  }
}
