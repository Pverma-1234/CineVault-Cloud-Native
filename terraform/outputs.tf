output "vpc_id" {
  description = "ID of the CineVault VPC"
  value       = aws_vpc.cinevault_vpc.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the CineVault VPC"
  value       = aws_vpc.cinevault_vpc.cidr_block
}

output "vpc_arn" {
  description = "ARN of the CineVault VPC"
  value       = aws_vpc.cinevault_vpc.arn
}

output "s3_bucket_name" {
  description = "Name of the CineVault S3 bucket"
  value       = aws_s3_bucket.cinevault_artifacts.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the CineVault S3 bucket"
  value       = aws_s3_bucket.cinevault_artifacts.arn
}

output "ecr_repository_urls" {
  description = "URLs of CineVault ECR repositories"

  value = {
    for name, repository in aws_ecr_repository.cinevault_repositories :
    name => repository.repository_url
  }
}