resource "aws_vpc" "cinevault_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = "development"
    Project     = var.project_name
  }
}

# Public Subnets
resource "aws_subnet" "public_subnets" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.cinevault_vpc.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet-${count.index + 1}"
    Tier        = "Public"
    Environment = "development"
    Project     = var.project_name

    "kubernetes.io/role/elb" = "1"
  }
}

# Private Subnets
resource "aws_subnet" "private_subnets" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.cinevault_vpc.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.project_name}-private-subnet-${count.index + 1}"
    Tier        = "Private"
    Environment = "development"
    Project     = var.project_name

    "kubernetes.io/role/internal-elb" = "1"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "cinevault_igw" {
  vpc_id = aws_vpc.cinevault_vpc.id

  tags = {
    Name    = "${var.project_name}-igw"
    Project = var.project_name
  }
}


# Public Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.cinevault_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.cinevault_igw.id
  }

  tags = {
    Name = "${var.project_name}-public-route-table"
  }
}

# Associate Public Subnets with Public Route Table
resource "aws_route_table_association" "public_association" {
  count = length(aws_subnet.public_subnets)

  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

# Private Route Table
resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.cinevault_vpc.id

  tags = {
    Name = "${var.project_name}-private-route-table"
  }
}

# Associate Private Subnets with Private Route Table
resource "aws_route_table_association" "private_association" {
  count = length(aws_subnet.private_subnets)

  subnet_id      = aws_subnet.private_subnets[count.index].id
  route_table_id = aws_route_table.private_rt.id
}

# S3 Bucket
resource "aws_s3_bucket" "cinevault_artifacts" {
  bucket = var.s3_bucket_name

  tags = {
    Name        = "${var.project_name}-artifacts"
    Project     = var.project_name
    Environment = "development"
  }
}

# Enable S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "cinevault_versioning" {
  bucket = aws_s3_bucket.cinevault_artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "cinevault_encryption" {
  bucket = aws_s3_bucket.cinevault_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block Public Access
resource "aws_s3_bucket_public_access_block" "cinevault_public_access" {
  bucket = aws_s3_bucket.cinevault_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ECR Repositories
resource "aws_ecr_repository" "cinevault_repositories" {
  for_each = toset(var.ecr_repositories)

  name                 = each.value
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = each.value
    Project     = var.project_name
    Environment = "development"
  }
}