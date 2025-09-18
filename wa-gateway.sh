#!/bin/bash

# WhatsApp Gateway Docker Manager
# Script untuk mempermudah pengelolaan WhatsApp Gateway dengan Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
DEFAULT_PORT=5000
DEFAULT_ENV_FILE="docker.env"

# Function to print colored output
print_header() {
    echo -e "${PURPLE}======================================${NC}"
    echo -e "${PURPLE}    WhatsApp Gateway Docker Manager   ${NC}"
    echo -e "${PURPLE}======================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${CYAN}🔄 $1${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker tidak berjalan atau tidak terinstall!"
        echo "Pastikan Docker sudah terinstall dan berjalan."
        exit 1
    fi
}

# Function to check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose tidak ditemukan!"
        echo "Pastikan docker-compose sudah terinstall."
        exit 1
    fi
}

# Function to setup environment file
setup_env() {
    local port=${1:-$DEFAULT_PORT}
    
    if [ ! -f "$DEFAULT_ENV_FILE" ]; then
        print_step "Membuat file environment..."
        cp docker.env.example "$DEFAULT_ENV_FILE"
        
        # Update port in env file
        if [ "$port" != "$DEFAULT_PORT" ]; then
            sed -i "s/PORT=5000/PORT=$port/g" "$DEFAULT_ENV_FILE"
            sed -i "s/:5000/:$port/g" "$DEFAULT_ENV_FILE"
        fi
        
        print_success "File environment dibuat: $DEFAULT_ENV_FILE"
        print_info "Anda bisa edit file ini untuk kustomisasi lebih lanjut"
    else
        print_info "File environment sudah ada: $DEFAULT_ENV_FILE"
    fi
}

# Function to show status
show_status() {
    print_header
    echo -e "${BLUE}📊 Status Container:${NC}"
    
    if docker ps --filter "name=whatsapp-gateway" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q whatsapp-gateway; then
        docker ps --filter "name=whatsapp-gateway" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        
        # Get port from running container
        local port=$(docker port whatsapp-gateway-container 2>/dev/null | grep -o "0.0.0.0:[0-9]*" | cut -d: -f2 || echo "5000")
        
        print_success "WhatsApp Gateway sedang berjalan!"
        echo ""
        echo -e "${CYAN}🔗 Akses URLs:${NC}"
        echo "   Health Check: http://localhost:$port/health"
        echo "   QR Code:      http://localhost:$port/qr"
        echo "   QR Terminal:  curl http://localhost:$port/qr/terminal"
        echo "   Status:       http://localhost:$port/status"
        
    else
        print_warning "WhatsApp Gateway tidak berjalan"
    fi
    
    echo ""
    echo -e "${BLUE}💾 Docker Volumes:${NC}"
    docker volume ls --filter "name=wa-gateway" 2>/dev/null || echo "   Tidak ada volume ditemukan"
}

# Function to start the gateway
start_gateway() {
    local port=${1:-$DEFAULT_PORT}
    
    print_header
    print_step "Memulai WhatsApp Gateway..."
    
    check_docker
    check_docker_compose
    setup_env "$port"
    
    # Set environment variable for port
    export PORT=$port
    
    # Start with docker-compose
    if docker-compose up -d; then
        print_success "WhatsApp Gateway berhasil dimulai!"
        
        # Wait a moment for container to be ready
        sleep 3
        
        echo ""
        print_info "Menunggu QR Code..."
        echo "QR Code akan muncul dalam beberapa detik. Pilih salah satu cara:"
        echo ""
        echo "1️⃣  Lihat logs (QR akan muncul di sini):"
        echo "   docker-compose logs -f"
        echo ""
        echo "2️⃣  Akses via terminal:"
        echo "   curl http://localhost:$port/qr/terminal"
        echo ""
        echo "3️⃣  Akses via file:"
        echo "   cat qr-code.txt"
        echo ""
        echo "4️⃣  Akses via browser:"
        echo "   http://localhost:$port/qr"
        echo ""
        
    else
        print_error "Gagal memulai WhatsApp Gateway!"
        exit 1
    fi
}

# Function to stop the gateway
stop_gateway() {
    print_header
    print_step "Menghentikan WhatsApp Gateway..."
    
    if docker-compose down; then
        print_success "WhatsApp Gateway berhasil dihentikan!"
    else
        print_error "Gagal menghentikan WhatsApp Gateway!"
        exit 1
    fi
}

# Function to restart the gateway
restart_gateway() {
    print_header
    print_step "Merestart WhatsApp Gateway..."
    
    docker-compose restart
    print_success "WhatsApp Gateway berhasil direstart!"
}

# Function to show logs
show_logs() {
    print_header
    print_info "Menampilkan logs WhatsApp Gateway..."
    print_info "Tekan Ctrl+C untuk keluar"
    echo ""
    
    docker-compose logs -f
}

# Function to clean up
cleanup() {
    print_header
    print_step "Membersihkan semua data WhatsApp Gateway..."
    
    echo -e "${YELLOW}⚠️  PERINGATAN: Ini akan menghapus semua data termasuk session WhatsApp!${NC}"
    read -p "Apakah Anda yakin? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v --rmi local --remove-orphans
        docker volume prune -f
        
        # Remove QR code file if exists
        [ -f "qr-code.txt" ] && rm qr-code.txt
        
        print_success "Cleanup berhasil!"
    else
        print_info "Cleanup dibatalkan"
    fi
}

# Function to backup session
backup_session() {
    print_header
    print_step "Backup session WhatsApp..."
    
    local backup_name="wa-session-backup-$(date +%Y%m%d_%H%M%S).tar.gz"
    
    if docker volume ls | grep -q "wa_session_data"; then
        docker run --rm -v wa_session_data:/data -v $(pwd):/backup alpine tar czf /backup/$backup_name -C /data .
        print_success "Session berhasil dibackup ke: $backup_name"
    else
        print_warning "Tidak ada session data untuk dibackup"
    fi
}

# Function to restore session
restore_session() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        print_error "Nama file backup harus disediakan"
        echo "Usage: $0 restore-session <backup-file.tar.gz>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        print_error "File backup tidak ditemukan: $backup_file"
        exit 1
    fi
    
    print_header
    print_step "Restore session WhatsApp dari: $backup_file"
    
    # Stop gateway first
    docker-compose down
    
    # Create volume if not exists
    docker volume create wa_session_data
    
    # Restore backup
    docker run --rm -v wa_session_data:/data -v $(pwd):/backup alpine tar xzf /backup/$backup_file -C /data
    
    print_success "Session berhasil direstore!"
    print_info "Jalankan 'start' untuk memulai gateway"
}

# Function to update gateway
update_gateway() {
    print_header
    print_step "Update WhatsApp Gateway..."
    
    # Pull latest images
    docker-compose pull
    
    # Rebuild and restart
    docker-compose up -d --build
    
    print_success "WhatsApp Gateway berhasil diupdate!"
}

# Function to show QR code
show_qr() {
    local port=${1:-$DEFAULT_PORT}
    
    print_header
    print_info "Mengambil QR Code..."
    
    # Check if gateway is running
    if ! docker ps --filter "name=whatsapp-gateway" --format "{{.Names}}" | grep -q whatsapp-gateway; then
        print_error "WhatsApp Gateway tidak berjalan!"
        print_info "Jalankan: $0 start"
        exit 1
    fi
    
    echo ""
    curl -s http://localhost:$port/qr/terminal || {
        print_warning "QR Code belum tersedia atau gateway belum siap"
        print_info "Coba lagi dalam beberapa detik atau lihat logs: $0 logs"
    }
}

# Function to show help
show_help() {
    print_header
    echo -e "${CYAN}📖 Cara Penggunaan:${NC}"
    echo ""
    echo "  $0 <command> [options]"
    echo ""
    echo -e "${CYAN}📋 Commands:${NC}"
    echo "  start [port]     - Mulai WhatsApp Gateway (default port: 5000)"
    echo "  stop             - Hentikan WhatsApp Gateway"
    echo "  restart          - Restart WhatsApp Gateway"
    echo "  status           - Lihat status container"
    echo "  logs             - Lihat logs real-time"
    echo "  qr [port]        - Tampilkan QR Code di terminal"
    echo "  cleanup          - Bersihkan semua data (HATI-HATI!)"
    echo "  backup-session   - Backup session WhatsApp"
    echo "  restore-session  - Restore session WhatsApp"
    echo "  update           - Update ke versi terbaru"
    echo "  help             - Tampilkan bantuan ini"
    echo ""
    echo -e "${CYAN}💡 Contoh:${NC}"
    echo "  $0 start         # Mulai di port 5000"
    echo "  $0 start 8080    # Mulai di port 8080"
    echo "  $0 qr            # Lihat QR code"
    echo "  $0 logs          # Lihat logs"
    echo ""
    echo -e "${CYAN}🔗 Setelah start, akses:${NC}"
    echo "  http://localhost:5000/health  - Health check"
    echo "  http://localhost:5000/qr      - QR Code (web)"
    echo ""
}

# Main script logic
case "${1:-help}" in
    start)
        start_gateway "$2"
        ;;
    stop)
        stop_gateway
        ;;
    restart)
        restart_gateway
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    qr)
        show_qr "$2"
        ;;
    cleanup)
        cleanup
        ;;
    backup-session)
        backup_session
        ;;
    restore-session)
        restore_session "$2"
        ;;
    update)
        update_gateway
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Command tidak dikenal: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
