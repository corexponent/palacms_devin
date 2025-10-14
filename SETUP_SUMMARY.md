# PalaCMS Setup Summary

This document summarizes all setup and deployment options for PalaCMS.

## 📚 Documentation Files Created

| File | Description |
|------|-------------|
| [QUICK_START.md](QUICK_START.md) | Fastest way to get started (Docker) |
| [LOCAL_SETUP.md](LOCAL_SETUP.md) | Detailed local development setup |
| [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) | AWS deployment guide (ECS, EC2, Lightsail) |
| [docker-compose.yml](docker-compose.yml) | Docker Compose configuration |
| [start.sh](start.sh) | Interactive startup script |
| [.env.example](.env.example) | Environment variables template |

## 🚀 Quick Start (3 Steps)

### 1. Clone Repository
```bash
git clone https://github.com/corexponent/palacms.git
cd palacms
```

### 2. Start with Docker
```bash
./start.sh start
```

### 3. Access Application
- Main App: http://localhost:8080
- Admin Panel: http://localhost:8080/_

## 📖 Full Documentation Index

### Getting Started
- **Quick Start**: [QUICK_START.md](QUICK_START.md) - Get running in 5 minutes
- **Main README**: [README.md](README.md) - Project overview and features

### Development
- **Local Setup**: [LOCAL_SETUP.md](LOCAL_SETUP.md) - Options:
  - Without Docker (for development)
  - With Docker Compose (production-like)
  - Manual setup without devenv
  - Build and deployment instructions

### Production Deployment
- **AWS Guide**: [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) - Options:
  - ECS with Fargate (recommended)
  - EC2 instances
  - AWS Lightsail
  - AWS App Runner
  - Cost estimates and best practices

### Contributing
- **Developer Guide**: [DEVELOPERS.md](DEVELOPERS.md) - Architecture, code patterns, and contribution guide

## 🛠️ Startup Script Commands

```bash
# Interactive menu
./start.sh

# Direct commands
./start.sh start     # Start PalaCMS
./start.sh stop      # Stop PalaCMS  
./start.sh restart   # Restart PalaCMS
./start.sh logs      # View logs
./start.sh status    # Show container status
./start.sh --help    # Show help
```

## 🐳 Docker Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Rebuild
docker-compose up -d --build

# Remove all data
docker-compose down -v
```

## 💻 Local Development Commands

```bash
# Install dependencies
npm install

# Initial build (required)
npm run build

# Start dev server
npm run dev

# Type checking
npm run check

# Linting
npm run lint

# Format code
npm run format
```

## 🌐 Access Points

### Docker Deployment
- Application: http://localhost:8080
- PocketBase Admin: http://localhost:8080/_

### Local Development
- SvelteKit Dev: http://localhost:5173
- PocketBase Backend: http://localhost:8090
- PocketBase Admin: http://localhost:8090/_
- Built Application: http://localhost:8090

## 🔐 Default Credentials

When using `.env.example`:
- Email: `admin@example.com`
- Password: `changeme123`

**⚠️ Change these in production!**

## 📊 System Requirements

### Minimum
- 2GB RAM
- 10GB disk space
- Docker or Node.js 22+

### Recommended for Production
- 4GB RAM
- 20GB disk space
- Load balancer (for scaling)
- Regular backups

## 🗂️ Data Storage

### Docker
Data stored in named volume: `palacms-data`

```bash
# Backup
docker run --rm -v palacms-data:/data -v $(pwd):/backup alpine tar czf /backup/palacms-backup.tar.gz -C /data .

# Restore
docker run --rm -v palacms-data:/data -v $(pwd):/backup alpine tar xzf /backup/palacms-backup.tar.gz -C /data
```

### Local Development
Data stored in: `pb_data/` directory

```bash
# Backup
tar czf palacms-backup.tar.gz pb_data/

# Restore
tar xzf palacms-backup.tar.gz
```

## 🔄 Update Procedures

### Docker
```bash
docker-compose pull
docker-compose up -d
```

### Local
```bash
git pull
npm install
npm run build
```

## 🐛 Common Issues & Solutions

### Port 8080 Already in Use
Edit `docker-compose.yml`:
```yaml
ports:
  - "3000:8080"  # Use different port
```

### Permission Errors (Linux)
```bash
sudo chown -R $(id -u):$(id -g) pb_data
```

### Memory Issues During Build
```bash
NODE_OPTIONS=--max_old_space_size=16384 npm run build
```

### Docker Daemon Not Running
```bash
sudo systemctl start docker
```

## 📈 Deployment Comparison

| Option | Complexity | Cost/Month | Best For |
|--------|-----------|------------|----------|
| Docker Compose (Local) | Low | Free | Development |
| AWS Lightsail | Low | $5+ | Small projects |
| AWS EC2 | Medium | $15+ | Custom setups |
| AWS ECS Fargate | Medium | $35+ | Production |
| Railway/Fly.io | Low | Varies | Quick deploys |

## 🔗 Useful Links

- **Official Site**: [palacms.com](https://palacms.com)
- **Documentation**: [palacms.com/docs](https://palacms.com/docs)
- **GitHub**: [github.com/palacms/palacms](https://github.com/palacms/palacms)
- **Docker Image**: [ghcr.io/palacms/palacms](https://ghcr.io/palacms/palacms)
- **PocketBase Docs**: [pocketbase.io/docs](https://pocketbase.io/docs)

## 📝 Next Steps After Setup

1. **Create your first site** at the main application URL
2. **Explore the block library** and create custom components
3. **Configure page types** for your content structure
4. **Set up custom domain** (for production)
5. **Configure backups** (for production)
6. **Enable SSL/HTTPS** (for production)

## 🆘 Getting Help

1. Check the relevant documentation file above
2. Search [GitHub Issues](https://github.com/palacms/palacms/issues)
3. Review [DEVELOPERS.md](DEVELOPERS.md) for technical details
4. Visit the community forums

---

**Choose your path:**
- 🏃 **Want to start fast?** → [QUICK_START.md](QUICK_START.md)
- 💻 **Want to develop locally?** → [LOCAL_SETUP.md](LOCAL_SETUP.md)
- ☁️ **Want to deploy to AWS?** → [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md)
- 🔧 **Want to contribute?** → [DEVELOPERS.md](DEVELOPERS.md)
