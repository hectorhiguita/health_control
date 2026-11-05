terraform {
  required_version = ">= 1.10"

  required_providers {
    aws     = { source = "hashicorp/aws", version = "~> 6.0" }
    archive = { source = "hashicorp/archive", version = "~> 2.6" }
    random  = { source = "hashicorp/random", version = "~> 3.6" }
  }

  backend "s3" {
    bucket       = "itm-lab-hahiguit-tfstates"
    key          = "health-control/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Proyecto = "health-control"
      Gestion  = "terraform"
      Datos    = "clinicos"
    }
  }
}

data "aws_caller_identity" "actual" {}

resource "random_id" "sufijo" {
  byte_length = 4
}

locals {
  nombre     = "health-control"
  sufijo     = random_id.sufijo.hex
  cuenta     = data.aws_caller_identity.actual.account_id
  origen_web = "https://${aws_cloudfront_distribution.sitio.domain_name}"
  origenes   = concat([local.origen_web], var.origenes_locales)
}
