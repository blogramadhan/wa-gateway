# WhatsApp Gateway

WhatsApp Gateway yang dibangun dengan Bun.js dan whatsapp-web.js untuk mengirim dan menerima pesan WhatsApp melalui REST API.

## 🚀 Fitur

- ✅ Kirim pesan teks ke nomor individu
- ✅ Kirim pesan ke grup WhatsApp
- ✅ Kirim media (gambar, dokumen, dll)
- ✅ Menerima pesan masuk (webhook)
- ✅ QR Code untuk autentikasi
- ✅ Status koneksi real-time
- ✅ Daftar chat/konversasi
- ✅ Logout/disconnect

## 📋 Prasyarat

### Untuk Manual Installation:
- Node.js (atau Bun.js)
- Google Chrome/Chromium (untuk Puppeteer)

### Untuk Docker (Recommended):
- Docker & Docker Compose
- Minimal 1GB RAM available
- Port 5000 tersedia (atau custom port)

## 🛠️ Instalasi

### Metode 1: Manual Installation

1. Clone atau download project ini
2. Install dependencies:
```bash
bun install
```

3. Jalankan aplikasi:
```bash
bun start
```

### Metode 2: Docker (Recommended)

#### Menggunakan Setup Script (Paling Mudah)
```bash
# Clone project
git clone <repository-url>
cd wa-gateway

# Optional: Set custom port
export PORT=8080

# Jalankan setup script (akan setup semua yang diperlukan)
chmod +x setup.sh
./setup.sh
```

#### Menggunakan Docker Compose Manual
```bash
# Clone project
git clone <repository-url>
cd wa-gateway

# Copy environment file (optional)
cp docker.env.example docker.env
# Edit docker.env untuk custom konfigurasi

# Jalankan dengan Docker Compose
docker-compose up -d

# Atau dengan custom port
PORT=8080 docker-compose up -d

# Lihat logs
docker-compose logs -f

# Stop aplikasi
docker-compose down
```

#### Menggunakan Docker Manual
```bash
# Build image
docker build -t wa-gateway .

# Jalankan container
docker run -d -p 3000:3000 --name wa-gateway-container wa-gateway

# Lihat logs
docker logs -f wa-gateway-container
```

### Setelah Instalasi
4. Buka browser dan akses `http://localhost:5000/qr` untuk mendapatkan QR code
5. Scan QR code dengan WhatsApp Anda

## 📚 API Endpoints

### Health Check
```http
GET /health
```
Cek status aplikasi dan koneksi WhatsApp.

### Status Koneksi
```http
GET /status
```
Cek status koneksi WhatsApp.

### QR Code
```http
GET /qr
```
Mendapatkan QR code untuk autentikasi WhatsApp.

### Kirim Pesan
```http
POST /send-message
Content-Type: application/json

{
  "number": "6281234567890",
  "message": "Halo, ini pesan dari WhatsApp Gateway!"
}
```

### Kirim Pesan dengan Media
```http
POST /send-message
Content-Type: application/json

{
  "number": "6281234567890",
  "message": "Ini gambar untuk Anda",
  "media": {
    "data": "base64_encoded_data",
    "mimetype": "image/jpeg",
    "filename": "gambar.jpg"
  }
}
```

### Kirim Pesan Grup
```http
POST /send-group-message
Content-Type: application/json

{
  "group_id": "1234567890-1234567890@g.us",
  "message": "Halo grup!"
}
```

### Daftar Chat
```http
GET /chats
```
Mendapatkan daftar semua chat/konversasi.

### Logout
```http
POST /logout
```
Logout dari WhatsApp dan hapus sesi.

### Webhook
```http
POST /webhook
```
Endpoint untuk menerima pesan masuk (dapat dikustomisasi).

## 💡 Contoh Penggunaan

### Menggunakan cURL

1. **Cek status:**
```bash
curl http://localhost:5000/status
```

2. **Kirim pesan:**
```bash
curl -X POST http://localhost:5000/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "number": "6281234567890",
    "message": "Halo dari WhatsApp Gateway!"
  }'
```

3. **Dapatkan QR code:**
```bash
curl http://localhost:5000/qr
```

### Menggunakan JavaScript/Fetch

```javascript
// Kirim pesan
const response = await fetch('http://localhost:5000/send-message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    number: '6281234567890',
    message: 'Halo dari JavaScript!'
  })
});

const result = await response.json();
console.log(result);
```

## 🔧 Konfigurasi

### Environment Variables

WhatsApp Gateway menggunakan environment variables untuk konfigurasi. Anda dapat mengatur konfigurasi dengan beberapa cara:

#### 1. File Environment (.env)
```bash
# Copy template dan edit
cp docker.env.example .env
```

Edit file `.env`:
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# WhatsApp Configuration
SESSION_NAME=wa-gateway-session
WEBHOOK_URL=http://localhost:5000/webhook

# Debug Configuration
DEBUG=true
```

#### 2. Docker Environment
```bash
# Copy template untuk Docker
cp docker.env.example docker.env
```

#### 3. System Environment Variables
```bash
# Set environment variables
export PORT=6000
export DEBUG=true
export SESSION_NAME=my-wa-session

# Jalankan aplikasi
bun start
```

#### 4. Docker Compose dengan Custom Port
```bash
# Set port via environment variable
PORT=8080 docker-compose up -d
```

### Available Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `production` | Environment mode |
| `SESSION_NAME` | `wa-gateway-session` | WhatsApp session name |
| `WEBHOOK_URL` | `http://localhost:PORT/webhook` | Webhook URL |
| `DEBUG` | `false` | Enable debug logging and console QR |

## 📝 Format Nomor

Format nomor yang didukung:
- `6281234567890` (akan otomatis ditambahkan @c.us)
- `6281234567890@c.us` (format lengkap)

Untuk grup WhatsApp, gunakan format:
- `1234567890-1234567890@g.us`

## 🐳 Docker Commands

### NPM Scripts untuk Docker
```bash
# Docker manual commands
npm run docker:build      # Build Docker image
npm run docker:run        # Run container
npm run docker:stop       # Stop container
npm run docker:remove     # Remove container
npm run docker:logs       # View logs

# Docker Compose commands
npm run compose:up         # Start dengan docker-compose
npm run compose:down       # Stop docker-compose
npm run compose:logs       # View compose logs
npm run compose:restart    # Restart services
npm run compose:build      # Rebuild images
```

### Docker Compose Features
- ✅ Persistent session data (volume mounting)
- ✅ Auto-restart policy
- ✅ Health checks
- ✅ Resource limits
- ✅ Network isolation
- ✅ Security optimizations

### Quick Start dengan Makefile
```bash
# Lihat semua commands
make help

# Quick start (build + run)
make quick-start

# Development mode dengan hot reload
make dev

# View logs
make logs

# Stop aplikasi
make stop
```

### Custom Port Examples
```bash
# Jalankan di port 8080
PORT=8080 docker-compose up -d

# Jalankan development di port 3000
PORT=3000 DEBUG=true docker-compose -f docker-compose.dev.yml up -d

# Jalankan manual dengan custom port
PORT=9000 bun start
```

## ⚠️ Catatan Penting

1. **Autentikasi**: Setelah pertama kali scan QR code, sesi akan tersimpan dan tidak perlu scan ulang
2. **Rate Limiting**: WhatsApp memiliki batasan pengiriman pesan, jangan spam
3. **Media**: File media harus di-encode dalam base64
4. **Grup**: Untuk mendapatkan ID grup, gunakan endpoint `/chats`

## 🐛 Troubleshooting

### WhatsApp tidak terhubung
- Pastikan Google Chrome/Chromium terinstall
- Coba restart aplikasi
- Hapus folder `.wwebjs_auth` dan scan QR code ulang

### Error saat kirim pesan
- Pastikan nomor dalam format yang benar
- Cek apakah WhatsApp masih terhubung dengan `/status`
- Pastikan nomor tujuan terdaftar di WhatsApp

### QR Code tidak muncul
- Tunggu beberapa detik setelah aplikasi start
- Refresh endpoint `/qr`
- Cek log aplikasi untuk error

### Docker Issues

**Container tidak bisa start:**
```bash
# Cek logs container
docker logs wa-gateway-container
# atau
docker-compose logs

# Rebuild image jika ada perubahan
docker-compose build --no-cache
```

**Permission errors di Docker:**
```bash
# Pastikan user memiliki akses ke Docker
sudo usermod -aG docker $USER
# Logout dan login ulang

# Atau jalankan dengan sudo
sudo docker-compose up -d
```

**WhatsApp session hilang setelah restart:**
- Session data sudah di-mount ke volume Docker
- Data akan persist di volume `wa_session_data`
- Cek volume: `docker volume ls`

**Port sudah digunakan:**
```bash
# Cek port yang digunakan
sudo netstat -tulpn | grep :5000

# Atau ubah port di docker-compose.yml
ports:
  - "6000:5000"  # Host port 6000, container port 5000
```

## 🤝 Kontribusi

Silakan buat issue atau pull request untuk perbaikan dan fitur baru.

## 📄 Lisensi

MIT License - bebas digunakan untuk project pribadi dan komersial.
