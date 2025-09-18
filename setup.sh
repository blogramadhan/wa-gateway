#!/bin/bash

# WhatsApp Gateway Setup Script
# This script helps setup the Docker environment

echo "🚀 WhatsApp Gateway Docker Setup"
echo "================================="
echo ""
echo "🔧 Current Configuration:"
echo "   PORT: ${PORT:-5000} (default)"
echo "   NODE_ENV: ${NODE_ENV:-production} (default)"
echo "   DEBUG: ${DEBUG:-false} (default)"
echo ""
echo "💡 To use custom port: PORT=8080 $0"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if Docker Compose is installed
check_docker_compose() {
    print_status "Checking Docker Compose installation..."
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose is installed"
}

# Check if port is available
check_port() {
    local port=${PORT:-5000}
    print_status "Checking if port $port is available..."
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        print_warning "Port $port is already in use. You may need to change the PORT environment variable"
        echo "Current process using port $port:"
        lsof -Pi :$port -sTCP:LISTEN
        echo ""
        echo "To use a different port, run:"
        echo "PORT=8080 $0"
    else
        print_success "Port $port is available"
    fi
}

# Create environment file if it doesn't exist
setup_env() {
    print_status "Setting up environment file..."
    if [ ! -f "docker.env" ]; then
        cp docker.env.example docker.env
        print_success "Created docker.env from docker.env.example"
        print_warning "Please review and modify docker.env if needed"
    else
        print_warning "docker.env already exists, skipping..."
    fi
}

# Create logs directory
setup_directories() {
    print_status "Creating necessary directories..."
    mkdir -p logs
    print_success "Created logs directory"
}

# Build Docker image
build_image() {
    print_status "Building Docker image..."
    if docker-compose build; then
        print_success "Docker image built successfully"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
}

# Start the application
start_app() {
    print_status "Starting WhatsApp Gateway..."
    if docker-compose up -d; then
        print_success "WhatsApp Gateway started successfully!"
        echo ""
        echo "🎉 Setup Complete!"
        echo "=================="
        echo ""
        local port=${PORT:-5000}
        echo "📱 Next Steps:"
        echo "1. Open: http://localhost:$port/qr"
        echo "2. Scan QR code with your WhatsApp"
        echo "3. Start sending messages!"
        echo ""
        echo "📋 Useful Commands:"
        echo "   docker-compose logs -f    # View logs"
        echo "   docker-compose stop       # Stop application"
        echo "   docker-compose restart    # Restart application"
        echo ""
        echo "🔗 API Documentation: http://localhost:$port/health"
    else
        print_error "Failed to start WhatsApp Gateway"
        exit 1
    fi
}

# Main setup process
main() {
    echo ""
    check_docker
    check_docker_compose
    check_port
    setup_env
    setup_directories
    
    echo ""
    read -p "Do you want to build and start the application now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_image
        start_app
    else
        print_status "Setup completed. You can start the application later with:"
        echo "docker-compose up -d"
    fi
}

# Run main function
main
