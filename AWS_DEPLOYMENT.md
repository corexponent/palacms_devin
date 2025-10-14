# PalaCMS AWS Deployment Guide

This guide provides comprehensive instructions for deploying PalaCMS on AWS using various services.

## Deployment Options Overview

PalaCMS can be deployed on AWS using several approaches:

1. **AWS ECS (Elastic Container Service)** - Recommended for production
2. **AWS EC2** - Direct deployment on virtual machines
3. **AWS Lightsail** - Simple, cost-effective option
4. **AWS ECS with Fargate** - Serverless container deployment
5. **AWS App Runner** - Fully managed container service

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Docker installed locally (for building images)
- Domain name (optional, for custom domains)

## Option 1: AWS ECS with Fargate (Recommended)

AWS Fargate provides serverless container orchestration, ideal for production workloads.

### Step 1: Build and Push Docker Image to ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name palacms --region us-east-1

# Get ECR login credentials
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build Docker image
docker build -t palacms:latest .

# Tag image for ECR
docker tag palacms:latest <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/palacms:latest

# Push to ECR
docker push <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/palacms:latest
```

### Step 2: Create EFS File System for Data Persistence

PalaCMS requires persistent storage for the `pb_data` directory.

```bash
# Create EFS file system
aws efs create-file-system \
  --region us-east-1 \
  --performance-mode generalPurpose \
  --throughput-mode bursting \
  --encrypted \
  --tags Key=Name,Value=palacms-data

# Create mount target (replace with your VPC subnet and security group)
aws efs create-mount-target \
  --file-system-id fs-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --security-groups sg-xxxxxxxxx
```

### Step 3: Create ECS Task Definition

Create a file named `task-definition.json`:

```json
{
  "family": "palacms",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "palacms",
      "image": "<your-account-id>.dkr.ecr.us-east-1.amazonaws.com/palacms:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "PALA_SUPERUSER_EMAIL",
          "value": "admin@example.com"
        },
        {
          "name": "PALA_SUPERUSER_PASSWORD",
          "value": "changeme123"
        }
      ],
      "mountPoints": [
        {
          "sourceVolume": "palacms-data",
          "containerPath": "/app/pb_data"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/palacms",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "volumes": [
    {
      "name": "palacms-data",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-xxxxxxxxx",
        "transitEncryption": "ENABLED"
      }
    }
  ]
}
```

Register the task definition:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### Step 4: Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name palacms-cluster --region us-east-1
```

### Step 5: Create Application Load Balancer (Optional but Recommended)

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name palacms-alb \
  --subnets subnet-xxxxxxxxx subnet-yyyyyyyyy \
  --security-groups sg-xxxxxxxxx \
  --scheme internet-facing \
  --type application

# Create target group
aws elbv2 create-target-group \
  --name palacms-tg \
  --protocol HTTP \
  --port 8080 \
  --vpc-id vpc-xxxxxxxxx \
  --target-type ip \
  --health-check-path /api/health

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:xxx:loadbalancer/app/palacms-alb/xxx \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:xxx:targetgroup/palacms-tg/xxx
```

### Step 6: Create ECS Service

```bash
aws ecs create-service \
  --cluster palacms-cluster \
  --service-name palacms-service \
  --task-definition palacms \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxxxxx],securityGroups=[sg-xxxxxxxxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:xxx:targetgroup/palacms-tg/xxx,containerName=palacms,containerPort=8080"
```

### Step 7: Configure DNS (Optional)

If using a custom domain, create a Route 53 record pointing to the ALB:

```bash
# Get ALB DNS name
aws elbv2 describe-load-balancers --names palacms-alb --query 'LoadBalancers[0].DNSName'

# Create Route 53 record (via console or CLI)
```

## Option 2: AWS EC2 Deployment

For direct deployment on EC2 instances.

### Step 1: Launch EC2 Instance

Launch an EC2 instance with the following specifications:

- **AMI**: Amazon Linux 2023 or Ubuntu 22.04
- **Instance Type**: t3.small or larger (minimum 2GB RAM)
- **Storage**: 20GB+ EBS volume
- **Security Group**: Allow inbound traffic on port 8080 (or 80/443)

### Step 2: Install Docker on EC2

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ec2-user@<instance-public-ip>
```

Install Docker:

```bash
# For Amazon Linux 2023
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# For Ubuntu
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu
```

Log out and log back in for group changes to take effect.

### Step 3: Deploy PalaCMS with Docker

```bash
# Create directory for persistent data
mkdir -p ~/palacms-data

# Pull and run PalaCMS
docker run -d \
  --name palacms \
  --restart unless-stopped \
  -p 8080:8080 \
  -v ~/palacms-data:/app/pb_data \
  -e PALA_SUPERUSER_EMAIL=admin@example.com \
  -e PALA_SUPERUSER_PASSWORD=changeme123 \
  ghcr.io/palacms/palacms:latest
```

### Step 4: Access Your Application

Access PalaCMS at `http://<instance-public-ip>:8080`

### Step 5: Set Up Nginx as Reverse Proxy (Optional)

Install Nginx:

```bash
sudo yum install nginx -y  # Amazon Linux
# or
sudo apt install nginx -y  # Ubuntu
```

Configure Nginx (`/etc/nginx/conf.d/palacms.conf`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Start Nginx:

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 6: Set Up SSL with Let's Encrypt (Optional)

```bash
# Install certbot
sudo yum install certbot python3-certbot-nginx -y  # Amazon Linux
# or
sudo apt install certbot python3-certbot-nginx -y  # Ubuntu

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

## Option 3: AWS Lightsail (Simple & Cost-Effective)

AWS Lightsail provides a simplified deployment option.

### Step 1: Create Lightsail Instance

1. Go to AWS Lightsail console
2. Create instance
3. Select Linux/Unix platform
4. Choose instance image: "OS Only" → Ubuntu 22.04
5. Select instance plan (at least $5/month - 1GB RAM)
6. Create instance

### Step 2: Connect and Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
```

### Step 3: Deploy PalaCMS

```bash
# Create data directory
mkdir -p ~/palacms-data

# Run PalaCMS
docker run -d \
  --name palacms \
  --restart unless-stopped \
  -p 8080:8080 \
  -v ~/palacms-data:/app/pb_data \
  -e PALA_SUPERUSER_EMAIL=admin@example.com \
  -e PALA_SUPERUSER_PASSWORD=changeme123 \
  ghcr.io/palacms/palacms:latest
```

### Step 4: Configure Networking

1. In Lightsail console, go to "Networking" tab
2. Add firewall rule to allow TCP port 8080
3. (Optional) Create static IP and attach to instance
4. (Optional) Set up custom domain in DNS zone

## Option 4: AWS App Runner

AWS App Runner provides fully managed container deployment.

### Step 1: Create App Runner Service

```bash
# Create App Runner service
aws apprunner create-service \
  --service-name palacms \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "ghcr.io/palacms/palacms:latest",
      "ImageRepositoryType": "ECR_PUBLIC",
      "ImageConfiguration": {
        "Port": "8080",
        "RuntimeEnvironmentVariables": {
          "PALA_SUPERUSER_EMAIL": "admin@example.com",
          "PALA_SUPERUSER_PASSWORD": "changeme123"
        }
      }
    },
    "AutoDeploymentsEnabled": false
  }' \
  --instance-configuration '{
    "Cpu": "1 vCPU",
    "Memory": "2 GB"
  }'
```

**Note**: App Runner has limitations with persistent storage. For production use with user uploads, consider ECS or EC2.

## Best Practices for Production

### 1. Use AWS Secrets Manager for Credentials

Instead of environment variables, use AWS Secrets Manager:

```bash
# Create secret
aws secretsmanager create-secret \
  --name palacms/admin-credentials \
  --secret-string '{"email":"admin@example.com","password":"secure-password"}'
```

Update task definition to reference secrets.

### 2. Enable HTTPS

Use AWS Certificate Manager (ACM) to provision SSL certificates:

```bash
# Request certificate
aws acm request-certificate \
  --domain-name your-domain.com \
  --validation-method DNS
```

Configure ALB listener for HTTPS (port 443).

### 3. Set Up Automated Backups

Create a Lambda function to backup EFS or take EBS snapshots regularly.

### 4. Configure CloudWatch Monitoring

```bash
# Create CloudWatch log group
aws logs create-log-group --log-group-name /ecs/palacms

# Set retention policy
aws logs put-retention-policy \
  --log-group-name /ecs/palacms \
  --retention-in-days 7
```

### 5. Use Auto Scaling

Configure ECS service auto-scaling based on CPU/memory metrics.

## Cost Estimation

Approximate monthly costs:

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| ECS Fargate | 1 task (0.5 vCPU, 1GB) | $15-20/month |
| EFS | 20GB storage | $6/month |
| ALB | Basic usage | $20/month |
| EC2 t3.small | 2GB RAM, 20GB EBS | $15-20/month |
| Lightsail | 1GB RAM plan | $5/month |

## Troubleshooting

### ECS Task Won't Start

1. Check CloudWatch logs for errors
2. Verify EFS mount target is in same VPC/subnet
3. Check security groups allow NFS traffic (port 2049)
4. Verify IAM roles have correct permissions

### Connection Timeout

1. Check security group allows inbound traffic on port 8080
2. Verify ECS task has public IP or is in private subnet with NAT
3. Check network ACLs

### Database Issues

1. Verify EFS mount is successful
2. Check EFS file system permissions
3. Ensure sufficient EFS throughput for your workload

## Updating PalaCMS

### ECS Deployment

```bash
# Build and push new image
docker build -t palacms:latest .
docker tag palacms:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/palacms:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/palacms:latest

# Update service to use new image
aws ecs update-service \
  --cluster palacms-cluster \
  --service palacms-service \
  --force-new-deployment
```

### EC2 Deployment

```bash
# Pull latest image
docker pull ghcr.io/palacms/palacms:latest

# Stop and remove old container
docker stop palacms
docker rm palacms

# Start new container
docker run -d \
  --name palacms \
  --restart unless-stopped \
  -p 8080:8080 \
  -v ~/palacms-data:/app/pb_data \
  -e PALA_SUPERUSER_EMAIL=admin@example.com \
  -e PALA_SUPERUSER_PASSWORD=changeme123 \
  ghcr.io/palacms/palacms:latest
```

## Support

For additional help:

- Review [PocketBase deployment documentation](https://pocketbase.io/docs/going-to-production/)
- Check [AWS ECS documentation](https://docs.aws.amazon.com/ecs/)
- Visit [PalaCMS GitHub Issues](https://github.com/palacms/palacms/issues)
- See [palacms.com](https://palacms.com) for more resources
