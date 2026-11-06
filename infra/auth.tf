# ─────────────────────────────────────────────────────────────
# ACCESO — Cognito. Nadie se registra solo: el único usuario
# lo crea Terraform y debe usar doble factor (app TOTP).
# ─────────────────────────────────────────────────────────────

resource "aws_cognito_user_pool" "usuarios" {
  name                     = "${local.nombre}-usuarios"
  deletion_protection      = "ACTIVE"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  mfa_configuration        = "ON"

  software_token_mfa_configuration {
    enabled = true
  }

  admin_create_user_config {
    allow_admin_create_user_only = true

    invite_message_template {
      email_subject = "Acceso al seguimiento clínico"
      email_message = "Te dieron acceso al seguimiento clínico.<br><br>Usuario: {username}<br>Clave temporal: {####}<br><br>Al entrar te pedirá una clave nueva y configurar una app de autenticación (Google Authenticator, Microsoft Authenticator o similar). La clave temporal vence en 3 días."
      sms_message   = "Seguimiento clínico. Usuario {username}, clave temporal {####}"
    }
  }

  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 3
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }
}

resource "aws_cognito_user_pool_domain" "login" {
  domain       = "${local.nombre}-${local.sufijo}"
  user_pool_id = aws_cognito_user_pool.usuarios.id
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "${local.nombre}-web"
  user_pool_id = aws_cognito_user_pool.usuarios.id

  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = ["COGNITO"]
  callback_urls                        = [for o in local.origenes : "${o}/"]
  logout_urls                          = [for o in local.origenes : "${o}/"]

  explicit_auth_flows           = ["ALLOW_REFRESH_TOKEN_AUTH"]
  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 7
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

# El backend exige este grupo además del token válido
resource "aws_cognito_user_group" "familia" {
  name         = "familia"
  user_pool_id = aws_cognito_user_pool.usuarios.id
  description  = "Personas con acceso al historial"
}

resource "aws_cognito_user" "titular" {
  user_pool_id             = aws_cognito_user_pool.usuarios.id
  username                 = var.correo_usuario
  desired_delivery_mediums = ["EMAIL"]

  attributes = {
    email          = var.correo_usuario
    email_verified = true
  }

  lifecycle {
    ignore_changes = [attributes]
  }
}

resource "aws_cognito_user_in_group" "titular" {
  user_pool_id = aws_cognito_user_pool.usuarios.id
  group_name   = aws_cognito_user_group.familia.name
  username     = aws_cognito_user.titular.username
}

# Puede crear y quitar cuentas desde la app. Solo se asigna aquí.
resource "aws_cognito_user_group" "admin" {
  name         = "admin"
  user_pool_id = aws_cognito_user_pool.usuarios.id
  description  = "Administra las cuentas desde la app"
}

# Solo ve el seguimiento (paciente, médico). Se asigna desde la app.
resource "aws_cognito_user_group" "lector" {
  name         = "lector"
  user_pool_id = aws_cognito_user_pool.usuarios.id
  description  = "Solo lectura"
}

resource "aws_cognito_user_in_group" "titular_admin" {
  user_pool_id = aws_cognito_user_pool.usuarios.id
  group_name   = aws_cognito_user_group.admin.name
  username     = aws_cognito_user.titular.username
}
