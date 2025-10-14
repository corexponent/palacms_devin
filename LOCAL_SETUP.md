# PalaCMS Local Development Setup Guide

This guide provides comprehensive instructions for setting up and running PalaCMS locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 22 or higher
- **npm** (comes with Node.js)
- **Go** 1.24.5 or higher
- **Docker** and **Docker Compose** (optional, for containerized development)
- **Git**

## Option 1: Local Development (Without Docker)

### Step 1: Clone the Repository

```bash
git clone https://github.com/corexponent/palacms.git
cd palacms
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build the Application

The initial build is required before starting the dev server:

```bash
npm run build
```

This command uses increased Node.js memory allocation (16GB) for the build process.

### Step 4: Start Development Server

```bash
npm run dev
```

This command starts both the SvelteKit development server and PocketBase backend using devenv.

**Note**: The `npm run dev` command requires [devenv](https://devenv.sh/) to be installed. If you don't have devenv installed, see Alternative Development Setup below.

### Step 5: Access the Application

Once the development server is running, you can access:

- **Main Application**: http://localhost:5173
- **PocketBase Admin Panel**: http://localhost:8090/_
- **Production Build Preview**: http://localhost:8090

## Option 2: Docker Compose Development

For a containerized development environment that closely mirrors production, use the provided `docker-compose.yml` file.

### Step 1: Create Environment File

Create a `.env` file in the project root with the following variables:

```bash
# Optional: Initial superuser credentials
PALA_SUPERUSER_EMAIL=admin@example.com
PALA_SUPERUSER_PASSWORD=changeme123

# Optional: Initial PalaCMS user credentials
PALA_USER_EMAIL=user@example.com
PALA_USER_PASSWORD=changeme123
```

### Step 2: Start with Docker Compose

```bash
docker-compose up -d
```

Or use the provided startup script:

```bash
chmod +x start.sh
./start.sh
```

### Step 3: Access the Application

- **Application**: http://localhost:8080
- **PocketBase Admin**: http://localhost:8080/_

### Step 4: Stop the Application

```bash
docker-compose down
```

To remove all data:

```bash
docker-compose down -v
```

## Alternative Development Setup (Without devenv)

If you don't have devenv installed, you can manually start the services:

### Terminal 1: Start PocketBase Backend

```bash
# Build the Go backend
go build -o palacms

# Run PocketBase server
./palacms serve --http=0.0.0.0:8090
```

### Terminal 2: Start SvelteKit Dev Server

```bash
# In a new terminal
npm run build
npx vite --config app.config.js dev
```

## Building for Production

### Build the Frontend and Backend

```bash
# Build the SvelteKit application
npm run build

# Build the Go executable
go build -o palacms
```

### Run Production Build

```bash
./palacms serve --http=0.0.0.0:8090
```

Access the production build at http://localhost:8090

## Building Docker Image

To build the Docker image locally:

```bash
docker build -t palacms:local .
```

To run the locally built image:

```bash
docker run -d \
  -p 8080:8080 \
  -v palacms-data:/app/pb_data \
  -e PALA_SUPERUSER_EMAIL=admin@example.com \
  -e PALA_SUPERUSER_PASSWORD=changeme123 \
  palacms:local
```

## Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with devenv |
| `npm run build` | Build for production (with increased memory limit) |
| `npm run preview` | Preview production build |
| `npm run check` | Run TypeScript type checking |
| `npm run check:watch` | Run type checking in watch mode |
| `npm run lint` | Check code formatting with Prettier |
| `npm run format` | Format code with Prettier |

## Environment Variables

The application supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PALA_SUPERUSER_EMAIL` | Email for initial superuser account | - |
| `PALA_SUPERUSER_PASSWORD` | Password for initial superuser account | - |
| `PALA_USER_EMAIL` | Email for initial PalaCMS user account | - |
| `PALA_USER_PASSWORD` | Password for initial PalaCMS user account | - |
| `PALA_VERSION` | Version tag for the application | - |

**Note**: These environment variables are only used during the initial application startup to create the initial users.

## Data Persistence

All application data is stored in the `pb_data` directory, which contains:

- SQLite database
- Uploaded files
- Generated static sites (in `pb_data/storage/sites`)

To reset the application, delete the `pb_data` directory and restart.

## Troubleshooting

### Build Errors

If you encounter memory issues during build:

```bash
# Increase Node.js memory allocation
NODE_OPTIONS=--max_old_space_size=16384 npm run build
```

### PocketBase Issues

1. Check that port 8090 is not already in use
2. Verify `pb_data` directory permissions
3. Check PocketBase logs in the terminal
4. Access PocketBase admin UI at http://localhost:8090/_ to inspect data

### Type Errors

```bash
# Get detailed TypeScript diagnostics
npm run check

# Watch mode for continuous checking
npm run check:watch
```

### Port Conflicts

If ports 5173 or 8090 are already in use, you can modify:

- SvelteKit dev server port in `svelte.config.js`
- PocketBase port by using `--http` flag when running the backend

## Next Steps

- Read the [Developer Guide](DEVELOPERS.md) for contributing to PalaCMS
- Check out the [official documentation](https://palacms.com/docs) for building with PalaCMS
- Join the community for support and discussions

## Support

If you encounter issues:

- Check existing [GitHub Issues](https://github.com/palacms/palacms/issues)
- Review the [DEVELOPERS.md](DEVELOPERS.md) guide
- Visit [palacms.com](https://palacms.com) for more resources
