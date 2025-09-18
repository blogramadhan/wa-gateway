# WhatsApp Gateway Makefile
# Memudahkan penggunaan Docker commands

.PHONY: help build run stop logs clean dev dev-logs dev-stop

# Default target
help:
	@echo "🚀 WhatsApp Gateway Docker Commands"
	@echo ""
	@echo "Production:"
	@echo "  make build     - Build Docker image"
	@echo "  make run       - Run container in production mode"
	@echo "  make stop      - Stop and remove container"
	@echo "  make logs      - View container logs"
	@echo "  make restart   - Restart container"
	@echo ""
	@echo "Development:"
	@echo "  make dev       - Run in development mode (with hot reload)"
	@echo "  make dev-logs  - View development logs"
	@echo "  make dev-stop  - Stop development container"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean     - Remove all containers and images"
	@echo "  make status    - Show container status"
	@echo ""

# Production commands
build:
	@echo "🔨 Building WhatsApp Gateway image..."
	docker-compose build --no-cache

run:
	@echo "🚀 Starting WhatsApp Gateway (Production)..."
	docker-compose up -d
	@echo "✅ Gateway running at http://localhost:5000"
	@echo "📱 Get QR code: http://localhost:5000/qr"

stop:
	@echo "🛑 Stopping WhatsApp Gateway..."
	docker-compose down

logs:
	@echo "📋 Viewing logs (Press Ctrl+C to exit)..."
	docker-compose logs -f

restart:
	@echo "🔄 Restarting WhatsApp Gateway..."
	docker-compose restart

# Development commands
dev:
	@echo "🚀 Starting WhatsApp Gateway (Development)..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Development server running at http://localhost:5000"
	@echo "🔥 Hot reload enabled"

dev-logs:
	@echo "📋 Viewing development logs (Press Ctrl+C to exit)..."
	docker-compose -f docker-compose.dev.yml logs -f

dev-stop:
	@echo "🛑 Stopping development server..."
	docker-compose -f docker-compose.dev.yml down

# Maintenance commands
clean:
	@echo "🧹 Cleaning up containers and images..."
	docker-compose down -v --rmi all --remove-orphans
	docker-compose -f docker-compose.dev.yml down -v --rmi all --remove-orphans
	docker system prune -f

status:
	@echo "📊 Container Status:"
	@docker ps --filter "name=whatsapp-gateway" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "💾 Volumes:"
	@docker volume ls --filter "name=wa-gateway"

# Quick start
quick-start: build run
	@echo ""
	@echo "🎉 WhatsApp Gateway started successfully!"
	@echo "👉 Next steps:"
	@echo "   1. Open: http://localhost:5000/qr"
	@echo "   2. Scan QR code with WhatsApp"
	@echo "   3. Start sending messages!"
	@echo ""
	@echo "📋 View logs: make logs"
	@echo "🛑 Stop: make stop"
