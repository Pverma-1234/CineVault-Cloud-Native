resource "aws_dynamodb_table" "cinevault_users" {
  name         = "CineVaultUsers"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "email"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = false
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Project     = "cinevault"
    Environment = "development"
  }
}

resource "aws_dynamodb_table" "cinevault_watchlist" {
  name         = "CineVaultWatchlist"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "movieId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "movieId"
    type = "N"
  }

  point_in_time_recovery {
    enabled = false
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Project     = "cinevault"
    Environment = "development"
  }
}