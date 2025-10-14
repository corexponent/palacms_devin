# PalaCMS AWS Hybrid Mode Guide

This guide explains how to use PalaCMS with AWS services while maintaining PocketBase compatibility. The hybrid approach allows you to optionally use AWS S3 for file storage, AWS SES for emails, and RDS for the database, while keeping the familiar PalaCMS experience.

## 🎯 Overview

PalaCMS now supports optional AWS integrations:

- **AWS S3** - Store uploaded files in S3 instead of local storage
- **AWS SES** - Send emails via SES instead of SMTP
- **AWS RDS** - Use PostgreSQL or MySQL instead of SQLite
- **CloudFront** - (Coming soon) CDN for static site delivery

All AWS features are **optional** and can be enabled independently. PalaCMS works perfectly fine without any AWS services.

## 🚀 Quick Start with AWS

### Basic Setup with S3 Storage

```bash
# 1. Set environment variables
export AWS_S3_ENABLED=true
export AWS_S3_BUCKET=my-palacms-uploads
export AWS_S3_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key

# 2. Start PalaCMS
docker-compose up -d
```

Files uploaded to PalaCMS will now be stored in S3 instead of locally.

## 📋 Configuration Options

### AWS S3 Storage

Store uploaded files, images, and media in AWS S3 for scalability and durability.

**Environment Variables:**

```bash
# Enable S3 storage
AWS_S3_ENABLED=true

# S3 bucket name (required)
AWS_S3_BUCKET=palacms-uploads

# AWS region (default: us-east-1)
AWS_S3_REGION=us-east-1

# AWS credentials (optional if using IAM roles)
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Optional: S3-compatible endpoint (for MinIO, DigitalOcean Spaces, etc.)
AWS_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Optional: Custom public URL for files
AWS_S3_PUBLIC_URL=https://cdn.example.com
```

**Benefits:**
- Unlimited scalable storage
- Built-in redundancy and durability
- Can use CloudFront CDN
- Works with S3-compatible services (MinIO, DigitalOcean Spaces)

### AWS SES Email

Send transactional emails via AWS SES for better deliverability.

**Environment Variables:**

```bash
# Enable SES mailer
AWS_SES_ENABLED=true

# SES region
AWS_SES_REGION=us-east-1

# From address (must be verified in SES)
AWS_SES_FROM_ADDRESS=noreply@example.com

# AWS credentials (defaults to AWS_ACCESS_KEY_ID/SECRET_ACCESS_KEY if not set)
AWS_SES_ACCESS_KEY_ID=your-ses-access-key
AWS_SES_SECRET_ACCESS_KEY=your-ses-secret-key
```

**Benefits:**
- High deliverability rates
- Built-in bounce and complaint handling
- Cost-effective for transactional emails
- Production-grade email infrastructure

**Prerequisites:**
- Verify your domain or email address in AWS SES
- Move out of SES sandbox for production use

### AWS RDS Database

Use managed PostgreSQL or MySQL database instead of SQLite.

**Environment Variables:**

```bash
# Database type: postgres or mysql
DATABASE_TYPE=postgres

# Database connection URL
DATABASE_URL=postgres://username:password@your-db.rds.amazonaws.com:5432/palacms?sslmode=require
```

**Benefits:**
- Managed database service
- Automatic backups
- Multi-AZ deployment for high availability
- Better performance for high-traffic sites

**Setup Steps:**
1. Create RDS instance (PostgreSQL 13+ or MySQL 8+)
2. Create database: `CREATE DATABASE palacms;`
3. Set DATABASE_URL with connection string
4. PocketBase will automatically handle schema migrations

## 🏗️ Deployment Architectures

### Architecture 1: S3 + Local Database (Recommended for Startups)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
┌──────▼──────────┐
│   PalaCMS       │
│   (ECS/EC2)     │
└─────┬───┬───────┘
      │   │
      │   └──────────┐
┌─────▼────┐    ┌───▼────┐
│  SQLite  │    │  S3    │
│  (EBS)   │    │ Files  │
└──────────┘    └────────┘
```

**Configuration:**
```bash
AWS_S3_ENABLED=true
AWS_S3_BUCKET=palacms-files
DATABASE_TYPE=sqlite  # Default
```

**Pros:** Simple, cost-effective, good for most use cases  
**Cons:** SQLite on EBS may have limitations for very high traffic

### Architecture 2: S3 + RDS (Production Grade)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
┌──────▼──────────┐
│   PalaCMS       │
│ (ECS Fargate)   │
└─────┬───┬───────┘
      │   │
      │   └──────────────┐
┌─────▼────────┐    ┌────▼────┐
│   RDS        │    │   S3    │
│ PostgreSQL   │    │  Files  │
└──────────────┘    └─────────┘
```

**Configuration:**
```bash
AWS_S3_ENABLED=true
AWS_S3_BUCKET=palacms-files
DATABASE_TYPE=postgres
DATABASE_URL=postgres://user:pass@db.region.rds.amazonaws.com:5432/palacms
AWS_SES_ENABLED=true
AWS_SES_FROM_ADDRESS=noreply@example.com
```

**Pros:** Highly scalable, fully managed, production-ready  
**Cons:** Higher cost

### Architecture 3: Full AWS Stack with CDN

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
┌──────▼────────────┐
│   CloudFront      │
│   (CDN)           │
└──────┬────────────┘
       │
┌──────▼──────────┐
│     ALB         │
└──────┬──────────┘
       │
┌──────▼──────────┐
│   PalaCMS       │
│  (ECS/Fargate)  │
└─────┬───┬───┬───┘
      │   │   │
┌─────▼┐ ┌▼──┐└─▼────┐
│ RDS  │ │S3 ││ SES  │
└──────┘ └───┘└──────┘
```

**Configuration:**
```bash
AWS_S3_ENABLED=true
AWS_S3_BUCKET=palacms-files
AWS_S3_PUBLIC_URL=https://dxxxxx.cloudfront.net
DATABASE_TYPE=postgres
DATABASE_URL=postgres://...
AWS_SES_ENABLED=true
AWS_CLOUDFRONT_ENABLED=true
AWS_CLOUDFRONT_DOMAIN=dxxxxx.cloudfront.net
```

**Pros:** Maximum performance and scalability  
**Cons:** Most complex, highest cost

## 🔐 IAM Permissions

### S3 Storage Permissions

Create an IAM policy for S3 access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::palacms-uploads",
        "arn:aws:s3:::palacms-uploads/*"
      ]
    }
  ]
}
```

### SES Permissions

Create an IAM policy for SES:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

### Using IAM Roles (Recommended for ECS/EC2)

Instead of access keys, use IAM roles:

1. **For ECS**: Attach task role to ECS task definition
2. **For EC2**: Attach instance profile to EC2 instance

No need to set `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` when using IAM roles.

## 📦 Docker Deployment with AWS

### Using docker-compose with AWS

```yaml
# docker-compose.yml
services:
  palacms:
    image: ghcr.io/palacms/palacms:latest
    environment:
      # AWS S3
      - AWS_S3_ENABLED=true
      - AWS_S3_BUCKET=palacms-uploads
      - AWS_S3_REGION=us-east-1
      
      # AWS SES
      - AWS_SES_ENABLED=true
      - AWS_SES_FROM_ADDRESS=noreply@example.com
      
      # RDS Database
      - DATABASE_TYPE=postgres
      - DATABASE_URL=postgres://user:pass@db:5432/palacms
    volumes:
      - ./pb_data:/app/pb_data  # Still needed for SQLite or local metadata
```

### ECS Task Definition with AWS Integration

```json
{
  "family": "palacms-aws",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "taskRoleArn": "arn:aws:iam::123456789012:role/PalaCMSTaskRole",
  "containerDefinitions": [
    {
      "name": "palacms",
      "image": "ghcr.io/palacms/palacms:latest",
      "environment": [
        {
          "name": "AWS_S3_ENABLED",
          "value": "true"
        },
        {
          "name": "AWS_S3_BUCKET",
          "value": "palacms-uploads"
        },
        {
          "name": "DATABASE_TYPE",
          "value": "postgres"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgres://..."
        }
      ]
    }
  ]
}
```

## 🧪 Testing AWS Integration

### Test S3 Storage

```bash
# Check if S3 is enabled
docker-compose logs palacms | grep "AWS S3"

# Should see:
# AWS S3 storage enabled: bucket=palacms-uploads, region=us-east-1

# Upload a file through PalaCMS admin and verify it appears in S3
aws s3 ls s3://palacms-uploads/
```

### Test SES Email

```bash
# Check if SES is enabled
docker-compose logs palacms | grep "AWS SES"

# Should see:
# AWS SES mailer enabled: region=us-east-1, from=noreply@example.com

# Trigger a password reset email and check SES console
```

### Test RDS Connection

```bash
# Check database connection
docker-compose logs palacms | grep "Database"

# Should see:
# Database type: postgres
```

## 💰 Cost Optimization

### S3 Storage

- Use S3 Intelligent-Tiering for automatic cost optimization
- Set lifecycle policies to move old files to Glacier
- Enable S3 Transfer Acceleration only if needed

```bash
# S3 Intelligent-Tiering configuration
aws s3api put-bucket-intelligent-tiering-configuration \
  --bucket palacms-uploads \
  --id EntireBucket \
  --intelligent-tiering-configuration '{
    "Id": "EntireBucket",
    "Status": "Enabled",
    "Tierings": [
      {
        "Days": 90,
        "AccessTier": "ARCHIVE_ACCESS"
      }
    ]
  }'
```

### RDS Database

- Use Aurora Serverless v2 for variable workloads
- Choose appropriate instance size (start with db.t3.micro)
- Enable automated backups with appropriate retention

### SES Pricing

- First 62,000 emails/month: Free (when sending from EC2)
- Beyond that: $0.10 per 1,000 emails
- Very cost-effective for transactional emails

## 🔍 Troubleshooting

### S3 Upload Failures

```bash
# Check IAM permissions
aws sts get-caller-identity

# Test S3 access
aws s3 cp test.txt s3://palacms-uploads/test.txt

# Check logs
docker-compose logs palacms | grep -i s3
```

### SES Email Not Sending

1. Verify email/domain in SES console
2. Check if still in SES sandbox
3. Request production access if needed
4. Verify IAM permissions

### RDS Connection Issues

1. Check security groups allow traffic from ECS/EC2
2. Verify connection string format
3. Ensure database exists
4. Check RDS instance is publicly accessible (if needed)

## 📚 Migration Guide

### Migrating from Local Storage to S3

```bash
# 1. Backup existing files
tar -czf pb_data_backup.tar.gz pb_data/

# 2. Sync files to S3
aws s3 sync pb_data/storage s3://palacms-uploads/storage/

# 3. Enable S3 in environment
export AWS_S3_ENABLED=true
export AWS_S3_BUCKET=palacms-uploads

# 4. Restart PalaCMS
docker-compose restart
```

### Migrating from SQLite to RDS

```bash
# 1. Backup SQLite database
cp pb_data/data.db pb_data/data.db.backup

# 2. Export data (if needed for manual migration)
# Use PocketBase export features or database tools

# 3. Create RDS instance and database
# 4. Update environment variables
# 5. Restart - PocketBase will run migrations automatically
```

## 🎛️ Advanced Configuration

### Using S3-Compatible Services

PalaCMS works with any S3-compatible service:

```bash
# DigitalOcean Spaces
AWS_S3_ENABLED=true
AWS_S3_BUCKET=my-space
AWS_S3_REGION=nyc3
AWS_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
AWS_ACCESS_KEY_ID=your-spaces-key
AWS_SECRET_ACCESS_KEY=your-spaces-secret

# MinIO
AWS_S3_ENABLED=true
AWS_S3_BUCKET=palacms
AWS_S3_ENDPOINT=http://minio:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
```

### Multi-Region Setup

For global deployments:

```bash
# US Region deployment
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=palacms-us
AWS_SES_REGION=us-east-1

# EU Region deployment
AWS_S3_REGION=eu-west-1
AWS_S3_BUCKET=palacms-eu
AWS_SES_REGION=eu-west-1
```

## 📊 Monitoring

### CloudWatch Metrics

Monitor your AWS resources:

```bash
# S3 metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name NumberOfObjects \
  --dimensions Name=BucketName,Value=palacms-uploads

# RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=palacms-db
```

### Application Logs

```bash
# View AWS integration logs
docker-compose logs palacms | grep -i aws

# Monitor S3 operations
docker-compose logs palacms | grep -i "s3\|upload\|download"
```

## 🆘 Support

For AWS hybrid mode support:

- Check [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) for deployment guides
- Review [.env.example](.env.example) for all configuration options
- See [GitHub Issues](https://github.com/palacms/palacms/issues) for known issues
- Visit [palacms.com/docs](https://palacms.com/docs) for documentation

## 🔄 Comparison: Default vs AWS Hybrid

| Feature | Default PalaCMS | AWS Hybrid |
|---------|----------------|------------|
| **File Storage** | Local disk | AWS S3 |
| **Database** | SQLite | SQLite, PostgreSQL, or MySQL (RDS) |
| **Email** | SMTP | AWS SES |
| **Scalability** | Single server | Highly scalable |
| **Cost** | Infrastructure only | Pay for AWS services |
| **Setup Complexity** | Simple | Moderate |
| **Best For** | Small to medium sites | Large, scalable applications |

---

**Start hybrid today:** Copy `.env.example` to `.env`, enable AWS services you need, and restart PalaCMS!
