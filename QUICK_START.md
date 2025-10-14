# PalaCMS Quick Start Guide

This guide will help you get PalaCMS up and running in minutes.

## 🚀 Fastest Way to Start (Docker Compose)

### Prerequisites
- Docker and Docker Compose installed
- 2GB+ RAM available

### Step 1: Clone the Repository

```bash
git clone https://github.com/corexponent/palacms.git
cd palacms
```

### Step 2: Start PalaCMS

Using the startup script (recommended):

```bash
./start.sh start
```

Or manually with Docker Compose:

```bash
# Create .env file (optional, for custom credentials)
cp .env.example .env
# Edit .env file to set your credentials

# Start the application
docker-compose up -d
```

### Step 3: Access PalaCMS

- **Main Application**: http://localhost:8080
- **PocketBase Admin Panel**: http://localhost:8080/_

Default credentials (if you used the example .env):
- Email: `admin@example.com`
- Password: `changeme123`

### Step 4: Stop PalaCMS

```bash
./start.sh stop
# or
docker-compose down
```

## 📋 Other Setup Options

### Local Development (Without Docker)

Perfect for developers who want to modify the codebase.

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start development server
npm run dev
```

Access at:
- Main app: http://localhost:5173
- PocketBase Admin: http://localhost:8090/_

**See [LOCAL_SETUP.md](LOCAL_SETUP.md) for detailed instructions.**

### AWS Deployment

Deploy to production on AWS using ECS, EC2, or Lightsail.

**See [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) for detailed instructions.**

## 🛠️ Startup Script Usage

The `start.sh` script provides an easy way to manage PalaCMS:

```bash
# Interactive menu
./start.sh

# Direct commands
./start.sh start     # Start PalaCMS
./start.sh stop      # Stop PalaCMS
./start.sh restart   # Restart PalaCMS
./start.sh logs      # View logs
./start.sh status    # Show status
./start.sh --help    # Show help
```

## 📁 Directory Structure

```
palacms/
├── src/                      # SvelteKit application
├── internal/                 # PocketBase server-side code
├── migrations/              # Database migrations
├── pb_data/                 # Runtime data (database, uploads, sites)
├── docker-compose.yml       # Docker Compose configuration
├── start.sh                 # Startup script
├── .env.example             # Environment variables template
├── QUICK_START.md          # This file
├── LOCAL_SETUP.md          # Detailed local setup guide
├── AWS_DEPLOYMENT.md       # AWS deployment guide
└── DEVELOPERS.md           # Developer documentation
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file from `.env.example`:

| Variable | Description | Required |
|----------|-------------|----------|
| `PALA_SUPERUSER_EMAIL` | Initial admin email | No |
| `PALA_SUPERUSER_PASSWORD` | Initial admin password | No |
| `PALA_USER_EMAIL` | Initial user email | No |
| `PALA_USER_PASSWORD` | Initial user password | No |

**Note**: Environment variables are only used on first startup to create initial users.

### Ports

- **8080**: Application port (Docker)
- **5173**: SvelteKit dev server (local development)
- **8090**: PocketBase server (local development)

### Data Persistence

All data is stored in:
- **Docker**: `palacms-data` volume
- **Local**: `pb_data/` directory

To backup your data, backup the `pb_data` directory or Docker volume.

## 📊 Monitoring

### View Logs

```bash
# Docker Compose
docker-compose logs -f

# Using startup script
./start.sh logs
```

### Check Status

```bash
# Docker Compose
docker-compose ps

# Using startup script
./start.sh status
```

## 🐛 Troubleshooting

### Port Already in Use

If port 8080 is already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "3000:8080"  # Change 8080 to your preferred port
```

### Container Won't Start

1. Check Docker is running: `docker info`
2. View logs: `docker-compose logs`
3. Ensure sufficient disk space and memory

### Can't Access Application

1. Verify container is running: `docker-compose ps`
2. Check firewall settings
3. Try accessing with container IP: `docker inspect palacms`

### Permission Issues (Linux)

If you encounter permission issues with `pb_data`:

```bash
# Fix ownership
sudo chown -R $(id -u):$(id -g) pb_data
```

## 🔄 Updating PalaCMS

### Docker Deployment

```bash
# Pull latest image
docker-compose pull

# Restart with new image
docker-compose up -d
```

Or use the startup script:

```bash
./start.sh restart
```

### Local Development

```bash
git pull
npm install
npm run build
npm run dev
```

## 📚 Next Steps

1. **Configure your site**: Access http://localhost:8080 and create your first site
2. **Read the docs**: Visit [palacms.com/docs](https://palacms.com/docs)
3. **Explore components**: Check the block library and create custom components
4. **Deploy to production**: Follow [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md)

## 🆘 Getting Help

- **Documentation**: [palacms.com/docs](https://palacms.com/docs)
- **GitHub Issues**: [github.com/palacms/palacms/issues](https://github.com/palacms/palacms/issues)
- **Developer Guide**: See [DEVELOPERS.md](DEVELOPERS.md)

## 📄 Additional Documentation

- [LOCAL_SETUP.md](LOCAL_SETUP.md) - Detailed local development setup
- [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) - AWS deployment options
- [DEVELOPERS.md](DEVELOPERS.md) - Contributing to PalaCMS
- [README.md](README.md) - Project overview

---

**Happy building with PalaCMS! 🎉**
