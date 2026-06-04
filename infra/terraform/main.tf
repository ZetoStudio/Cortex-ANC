# Cortex AWS EKS skeleton — apply when ready for production
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "region" {
  type    = string
  default = "us-east-1"
}

provider "aws" {
  region = var.region
}

# module "vpc" { ... }
# module "eks" { ... }
# module "rds_postgres" { ... }
# module "msk_kafka" { ... }
# module "elasticache_redis" { ... }

output "environment" {
  value = var.environment
}

output "next_steps" {
  value = "Wire VPC, EKS cluster, RDS (pgvector), MSK, ElastiCache, and IRSA for Cortex services."
}
