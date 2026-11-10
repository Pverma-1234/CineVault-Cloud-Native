# EKS CLUSTER IAM ROLE

resource "aws_iam_role" "eks_cluster_role" {
  name = "${var.project_name}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Effect = "Allow"

      Principal = {
        Service = "eks.amazonaws.com"
      }

      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name    = "${var.project_name}-eks-cluster-role"
    Project = var.project_name
  }
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role = aws_iam_role.eks_cluster_role.name

  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}


# ==========================================
# EKS WORKER NODE IAM ROLE
# ==========================================

resource "aws_iam_role" "eks_node_role" {
  name = "${var.project_name}-eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Effect = "Allow"

      Principal = {
        Service = "ec2.amazonaws.com"
      }

      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name    = "${var.project_name}-eks-node-role"
    Project = var.project_name
  }
}


# Worker Node Permissions

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  role = aws_iam_role.eks_node_role.name

  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  role = aws_iam_role.eks_node_role.name

  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "eks_ecr_policy" {
  role = aws_iam_role.eks_node_role.name

  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPullOnly"
}



# AMAZON EKS CLUSTER


resource "aws_eks_cluster" "cinevault" {
  count    = var.enable_eks_cluster ? 1 : 0
  name     = "${var.project_name}-eks-cluster"
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = "1.36"

  vpc_config {
    subnet_ids = aws_subnet.private_subnets[*].id

    endpoint_private_access = true
    endpoint_public_access  = true

    public_access_cidrs = var.eks_public_access_cidrs
  }

  access_config {
    authentication_mode                         = "API_AND_CONFIG_MAP"
    bootstrap_cluster_creator_admin_permissions = true
  }

  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  tags = {
    Name        = "${var.project_name}-eks-cluster"
    Project     = var.project_name
    Environment = "development"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]
}

# ==========================================
# EKS MANAGED NODE GROUP
# ==========================================

resource "aws_eks_node_group" "cinevault_nodes" {
  count = var.enable_eks_cluster ? 1 : 0

  cluster_name    = aws_eks_cluster.cinevault[0].name
  node_group_name = "${var.project_name}-node-group"
  node_role_arn   = aws_iam_role.eks_node_role.arn

  # Use public subnets to avoid NAT Gateway costs
  subnet_ids = aws_subnet.public_subnets[*].id

  capacity_type  = "ON_DEMAND"
  instance_types = ["t3.small"]

  scaling_config {
    desired_size = 1
    min_size     = 1
    max_size     = 2
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    environment = "development"
    project     = var.project_name
  }

  tags = {
    Name        = "${var.project_name}-node-group"
    Project     = var.project_name
    Environment = "development"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_ecr_policy
  ]
}