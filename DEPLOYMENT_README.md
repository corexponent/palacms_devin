# PalaCMS Deployment & Setup Guide

Complete guide for running PalaCMS locally and on AWS.

## 📋 Table of Contents

1. [Quick Start](#-quick-start)
2. [Running Locally](#-running-locally)
3. [Running on AWS](#-running-on-aws)
4. [Docker Compose](#-docker-compose)
5. [Startup Script](#-startup-script)
6. [Documentation Index](#-documentation-index)

---

## 🚀 Quick Start

Get PalaCMS running in under 5 minutes:

```bash
# Clone the repository
git clone https://github.com/corexponent/palacms.git
cd palacms

# Start with Docker Compose using the startup script
./start.sh start

# Access the application
# Main App: http://localhost:8080
# Admin Panel: http://localhost:8080/_
```

**Default credentials** (from .env.example):
- Email: `admin@example.com`
- Password: `changeme123`

---

## 💻 Running Locally

### Option 1: Docker Compose (Recommended for Quick Testing)

**Prerequisites**: Docker and Docker Compose

```bash
# Clone repository
git clone https://github.com/corexponent/palacms.git
cd palacms

# Option A: Using the startup script
./start.sh start

# Option B: Using Docker Compose directly
cp .env.example .env
docker-compose up -d
```

**Access Points**:
- Application: http://localhost:8080
- PocketBase Admin: http://localhost:8080/_

**Management**:
```bash
# View logs
docker-compose logs -f

# Stop
docker-compose down

# Restart
docker-compose restart
```

### Option 2: Local Development Without Docker

**Prerequisites**: Node.js 22+, Go 1.24.5+

```bash
# Clone and install
git clone https://github.com/corexponent/palacms.git
cd palacms
npm install

# Build the application (required before first run)
npm run build

# Start development server
npm run dev
```

**Access Points**:
- SvelteKit Dev Server: http://localhost:5173
- PocketBase Backend: http://localhost:8090
- PocketBase Admin: http://localhost:8090/_

**Alternative Manual Setup** (without devenv):

Terminal 1 - Backend:
```bash
go build -o palacms
./palacms serve --http=0.0.0.0:8090
```

Terminal 2 - Frontend:
```bash
npm run build
npx vite --config app.config.js dev
```

---

## ☁️ Running on AWS

### Option 1: AWS ECS with Fargate (Production-Ready)

**Best for**: Scalable production deployments

#### Quick Setup

1. **Build and push to ECR**:
```bash
aws ecr create-repository --repository-name palacms
aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker build -t palacms:latest .
docker tag palacms:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/palacms:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/palacms:latest
```

2. **Create EFS for persistent storage**:
```bash
aws efs create-file-system --region us-east-1 --performance-mode generalPurpose --encrypted
```

3. **Deploy ECS service** (see AWS_DEPLOYMENT.md for complete task definition)

**Estimated Cost**: ~$40-50/month (Fargate + EFS + ALB)

### Option 2: AWS EC2 (Simple VM Deployment)

**Best for**: Simple deployments with full control

#### Quick Setup

1. **Launch EC2 instance**:
   - AMI: Amazon Linux 2023 or Ubuntu 22.04
   - Instance Type: t3.small (2GB RAM minimum)
   - Storage: 20GB+ EBS
   - Security Group: Allow port 8080

2. **SSH and install Docker**:
```bash
ssh -i your-key.pem ec2-user@<instance-ip>
sudo yum install -y docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user
```

3. **Deploy PalaCMS**:
```bash
mkdir -p ~/palacms-data
docker run -d \
  --name palacms \
  --restart unless-stopped \
  -p 8080:8080 \
  -v ~/palacms-data:/app/pb_data \
  -e PALA_SUPERUSER_EMAIL=admin@example.com \
  -e PALA_SUPERUSER_PASSWORD=changeme123 \
  ghcr.io/palacms/palacms:latest
```

4. **Access**: `http://<instance-public-ip>:8080`

**Estimated Cost**: ~$15-20/month (t3.small instance)

### Option 3: AWS Lightsail (Easiest & Cheapest)

**Best for**: Small projects, testing, personal use

1. Create Lightsail instance (Ubuntu 22.04, $5 plan)
2. Install Docker and run PalaCMS (same as EC2 option)
3. Configure firewall to allow port 8080

**Estimated Cost**: $5/month

### Option 4: AWS App Runner (Fully Managed)

**Best for**: Simple deployments without infrastructure management

```bash
aws apprunner create-service \
  --service-name palacms \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "ghcr.io/palacms/palacms:latest",
      "ImageRepositoryType": "ECR_PUBLIC",
      "ImageConfiguration": {
        "Port": "8080"
      }
    }
  }'
```

**Note**: Limited persistent storage support

---

## 🐳 Docker Compose

The included `docker-compose.yml` provides a complete containerized setup.

### Features

- Uses official PalaCMS image from GitHub Container Registry
- Automatic restart on failure
- Persistent data storage
- Health checks
- Configurable via environment variables

### Configuration

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```env
PALA_SUPERUSER_EMAIL=admin@yourdomain.com
PALA_SUPERUSER_PASSWORD=your-secure-password
PALA_USER_EMAIL=user@yourdomain.com
PALA_USER_PASSWORD=another-secure-password
```

### Commands

```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove data
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build
```

### Customization

To use a local build instead of the prebuilt image, edit `docker-compose.yml`:

```yaml
services:
  palacms:
    # Comment out the image line
    # image: ghcr.io/palacms/palacms:latest
    
    # Uncomment the build section
    build:
      context: .
      dockerfile: Dockerfile
```

---

## 🎯 Startup Script

The `start.sh` script provides an easy interface for managing PalaCMS.

### Usage

**Interactive Menu**:
```bash
./start.sh
```

**Direct Commands**:
```bash
./start.sh start      # Start PalaCMS
./start.sh stop       # Stop PalaCMS
./start.sh restart    # Restart PalaCMS
./start.sh logs       # View logs (Ctrl+C to exit)
./start.sh status     # Show container status
./start.sh --help     # Show help
```

### Features

- ✅ Checks Docker installation
- ✅ Creates `.env` file if missing
- ✅ Pulls latest image
- ✅ Provides clear status messages
- ✅ Color-coded output
- ✅ Interactive or command-line mode

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| **QUICK_START.md** | Fastest way to get started (5 minutes) |
| **LOCAL_SETUP.md** | Comprehensive local development guide |
| **AWS_DEPLOYMENT.md** | Detailed AWS deployment instructions |
| **SETUP_SUMMARY.md** | Summary of all setup options |
| **DEVELOPERS.md** | Contributing and architecture guide |
| **README.md** | Project overview and features |

### When to Use Each Guide

- 🏃 **Need to start NOW?** → QUICK_START.md
- 💻 **Developing locally?** → LOCAL_SETUP.md  
- ☁️ **Deploying to AWS?** → AWS_DEPLOYMENT.md
- 🗺️ **Want an overview?** → SETUP_SUMMARY.md
- 🔧 **Contributing code?** → DEVELOPERS.md

---

## 🔧 Configuration Reference

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PALA_SUPERUSER_EMAIL` | Initial admin email | - | No |
| `PALA_SUPERUSER_PASSWORD` | Initial admin password | - | No |
| `PALA_USER_EMAIL` | Initial user email | - | No |
| `PALA_USER_PASSWORD` | Initial user password | - | No |
| `PALA_VERSION` | Version tag | - | No |

**Note**: These variables are only used on first startup to create initial users.

### Ports

| Port | Service | Environment |
|------|---------|-------------|
| 8080 | PalaCMS Application | Docker |
| 5173 | SvelteKit Dev Server | Local Dev |
| 8090 | PocketBase Backend | Local Dev |

### Data Persistence

**Docker**: 
- Volume: `palacms-data`
- Mount point: `/app/pb_data`

**Local**:
- Directory: `pb_data/`

---

## 🐛 Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Change port in docker-compose.yml
ports:
  - "3000:8080"  # Use port 3000 instead
```

**Container won't start**:
```bash
# Check logs
docker-compose logs palacms

# Verify Docker is running
docker info
```

**Permission errors (Linux)**:
```bash
sudo chown -R $(id -u):$(id -g) pb_data
```

**Memory errors during build**:
```bash
NODE_OPTIONS=--max_old_space_size=16384 npm run build
```

### Getting Help

1. Check the relevant documentation file
2. Search [GitHub Issues](https://github.com/palacms/palacms/issues)
3. Review logs: `docker-compose logs` or check terminal output
4. Visit [palacms.com](https://palacms.com)

---

## 📊 Deployment Comparison

| Method | Complexity | Cost | Scalability | Best For |
|--------|-----------|------|-------------|----------|
| Docker Compose (Local) | ⭐ | Free | ⭐ | Development |
| AWS Lightsail | ⭐ | $5/mo | ⭐⭐ | Small projects |
| AWS EC2 | ⭐⭐ | $15/mo | ⭐⭐⭐ | Custom setups |
| AWS ECS Fargate | ⭐⭐⭐ | $40/mo | ⭐⭐⭐⭐⭐ | Production |
| Railway/Fly.io | ⭐ | Varies | ⭐⭐⭐ | Quick deploys |

---

## ✅ Production Checklist

Before deploying to production:

- [ ] Change default passwords in `.env`
- [ ] Set up SSL/HTTPS (use Let's Encrypt or AWS ACM)
- [ ] Configure custom domain
- [ ] Set up automated backups
- [ ] Enable monitoring and logging
- [ ] Configure firewall rules
- [ ] Review security settings
- [ ] Test backup restoration
- [ ] Set up auto-scaling (if using ECS)
- [ ] Configure CDN (optional, for static assets)

---

## 🔄 Updating PalaCMS

### Docker Deployment

```bash
# Pull latest image
docker-compose pull

# Restart with new image
docker-compose up -d

# Using startup script
./start.sh restart
```

### Local Development

```bash
git pull
npm install
npm run build
npm run dev
```

---

## 📈 Next Steps

After getting PalaCMS running:

1. **Access the application** at the appropriate URL
2. **Log in** with your configured credentials
3. **Create your first site**
4. **Explore the block library**
5. **Read the user documentation** at [palacms.com/docs](https://palacms.com/docs)
6. **Configure production settings** if deploying to production

---

## 🆘 Support & Resources

- **Website**: [palacms.com](https://palacms.com)
- **Documentation**: [palacms.com/docs](https://palacms.com/docs)
- **GitHub**: [github.com/palacms/palacms](https://github.com/palacms/palacms)
- **Issues**: [github.com/palacms/palacms/issues](https://github.com/palacms/palacms/issues)
- **Docker Image**: [ghcr.io/palacms/palacms](https://ghcr.io/palacms/palacms)

---

**Happy building with PalaCMS! 🎉**
