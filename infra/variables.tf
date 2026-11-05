variable "region" {
  description = "Región de AWS"
  type        = string
  default     = "us-east-1"
}

variable "correo_usuario" {
  description = "Correo de la única persona con acceso. Cognito le envía una clave temporal."
  type        = string
}

variable "correo_alertas" {
  description = "Correo que recibe las alertas de presupuesto"
  type        = string
}

variable "presupuesto_mensual_usd" {
  description = "Tope mensual. Avisa al 80 % real y al 100 % proyectado."
  type        = number
  default     = 5
}

variable "paciente_id" {
  description = "Identificador del paciente en la tabla"
  type        = string
  default     = "ludibia-soto-orozco"
}

variable "modelo_claude" {
  description = "Modelo de Claude para el asistente"
  type        = string
  default     = "claude-opus-5-5"
}

variable "AWS_REGION" {
  description = "Region de AWS default"
  type        = string
  default     = "us-east-1"
}

variable "origenes_locales" {
  description = "Orígenes extra permitidos para desarrollo local"
  type        = list(string)
  default     = ["http://localhost:5173"]
}
