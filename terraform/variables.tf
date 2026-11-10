variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "cinevault"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "vpc_cidr" {
  description = "CIDR block for CineVault VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for the VPC"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "s3_bucket_name" {
  description = "Globally unique S3 bucket name for CineVault"
  type        = string
  default     = "cinevault-project-artifacts-pv2026"
}

variable "ecr_repositories" {
  description = "ECR repositories for CineVault"
  type        = list(string)

  default = [
    "cinevault-backend",
    "cinevault-frontend"
  ]
}
variable "eks_public_access_cidrs" {
  description = "Public IP addresses allowed to access the EKS Kubernetes API"
  type        = list(string)
  default     = ["117.251.86.142/32"]
}
variable "enable_eks_cluster" {
  description = "Whether to create the CineVault EKS cluster"
  type        = bool
  default     = true
}