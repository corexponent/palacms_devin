#!/bin/bash


set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_banner() {
    print_message "$BLUE" "╔══════════════════════════════════════════╗"
    print_message "$BLUE" "║         PalaCMS Startup Script          ║"
    print_message "$BLUE" "╚══════════════════════════════════════════╝"
    echo ""
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_message "$RED" "❌ Error: Docker is not installed."
        print_message "$YELLOW" "Please install Docker from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_message "$RED" "❌ Error: Docker daemon is not running."
        print_message "$YELLOW" "Please start Docker and try again."
        exit 1
    fi
}

check_docker_compose() {
    if ! docker compose version &> /dev/null; then
        print_message "$RED" "❌ Error: Docker Compose is not installed."
        print_message "$YELLOW" "Please install Docker Compose from: https://docs.docker.com/compose/install/"
        exit 1
    fi
}

create_env_file() {
    if [ ! -f .env ]; then
        print_message "$YELLOW" "⚠️  .env file not found. Creating a default one..."
        cat > .env << EOF

PALA_SUPERUSER_EMAIL=admin@example.com
PALA_SUPERUSER_PASSWORD=changeme123

PALA_USER_EMAIL=user@example.com
PALA_USER_PASSWORD=changeme123

PALA_VERSION=3.0.0-beta.1
EOF
        print_message "$GREEN" "✅ Created .env file with default values."
        print_message "$YELLOW" "⚠️  IMPORTANT: Please edit .env file and change the default passwords!"
        echo ""
        read -p "Press Enter to continue after updating the .env file, or Ctrl+C to exit..."
    fi
}

pull_image() {
    print_message "$BLUE" "📥 Pulling latest PalaCMS Docker image..."
    if docker compose pull; then
        print_message "$GREEN" "✅ Successfully pulled the latest image."
    else
        print_message "$YELLOW" "⚠️  Could not pull the latest image. Will use local image if available."
    fi
    echo ""
}

start_services() {
    print_message "$BLUE" "🚀 Starting PalaCMS..."
    
    if docker compose up -d; then
        print_message "$GREEN" "✅ PalaCMS started successfully!"
        echo ""
        print_message "$GREEN" "🌐 Access your PalaCMS instance at:"
        print_message "$GREEN" "   Main Application: http://localhost:8080"
        print_message "$GREEN" "   PocketBase Admin: http://localhost:8080/_"
        echo ""
        print_message "$BLUE" "📊 View logs with: docker compose logs -f"
        print_message "$BLUE" "🛑 Stop with: docker compose down"
    else
        print_message "$RED" "❌ Failed to start PalaCMS."
        print_message "$YELLOW" "Check the logs with: docker compose logs"
        exit 1
    fi
}

show_logs() {
    print_message "$BLUE" "📜 Showing logs (Ctrl+C to exit)..."
    echo ""
    docker compose logs -f
}

stop_services() {
    print_message "$BLUE" "🛑 Stopping PalaCMS..."
    if docker compose down; then
        print_message "$GREEN" "✅ PalaCMS stopped successfully."
    else
        print_message "$RED" "❌ Failed to stop PalaCMS."
        exit 1
    fi
}

restart_services() {
    print_message "$BLUE" "🔄 Restarting PalaCMS..."
    stop_services
    echo ""
    start_services
}

show_status() {
    print_message "$BLUE" "📊 PalaCMS Status:"
    echo ""
    docker compose ps
}

show_menu() {
    print_banner
    echo "Select an option:"
    echo "  1) Start PalaCMS"
    echo "  2) Stop PalaCMS"
    echo "  3) Restart PalaCMS"
    echo "  4) View logs"
    echo "  5) Show status"
    echo "  6) Exit"
    echo ""
    read -p "Enter your choice [1-6]: " choice
    
    case $choice in
        1)
            check_docker
            check_docker_compose
            create_env_file
            pull_image
            start_services
            ;;
        2)
            check_docker
            check_docker_compose
            stop_services
            ;;
        3)
            check_docker
            check_docker_compose
            restart_services
            ;;
        4)
            check_docker
            check_docker_compose
            show_logs
            ;;
        5)
            check_docker
            check_docker_compose
            show_status
            ;;
        6)
            print_message "$GREEN" "Goodbye! 👋"
            exit 0
            ;;
        *)
            print_message "$RED" "Invalid option. Please try again."
            exit 1
            ;;
    esac
}

if [ $# -eq 0 ]; then
    show_menu
else
    case "$1" in
        start)
            print_banner
            check_docker
            check_docker_compose
            create_env_file
            pull_image
            start_services
            ;;
        stop)
            print_banner
            check_docker
            check_docker_compose
            stop_services
            ;;
        restart)
            print_banner
            check_docker
            check_docker_compose
            restart_services
            ;;
        logs)
            check_docker
            check_docker_compose
            show_logs
            ;;
        status)
            check_docker
            check_docker_compose
            show_status
            ;;
        --help|-h)
            print_banner
            echo "Usage: $0 [COMMAND]"
            echo ""
            echo "Commands:"
            echo "  start      Start PalaCMS"
            echo "  stop       Stop PalaCMS"
            echo "  restart    Restart PalaCMS"
            echo "  logs       View logs"
            echo "  status     Show status"
            echo "  --help     Show this help message"
            echo ""
            echo "If no command is provided, an interactive menu will be shown."
            ;;
        *)
            print_message "$RED" "Unknown command: $1"
            print_message "$YELLOW" "Use --help to see available commands."
            exit 1
            ;;
    esac
fi
