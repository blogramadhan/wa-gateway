# 📱 WhatsApp Gateway

**WhatsApp Gateway yang mudah digunakan** - Kirim dan terima pesan WhatsApp melalui REST API menggunakan Bun.js, Hono, dan whatsapp-web.js.

[![Bun](https://img.shields.io/badge/Bun-1.2.21-black?logo=bun)](https://bun.sh)
[![Hono](https://img.shields.io/badge/Hono-4.9.7-orange?logo=hono)](https://hono.dev)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://docker.com)

## 🚀 Quick Start (5 Menit)

### 1️⃣ Clone & Setup
```bash
git clone <repository-url>
cd wa-gateway

# Setup sekali saja
chmod +x *.sh
./setup.sh
```

### 2️⃣ Lihat QR Code & Scan
```bash
# Lihat QR code di terminal
./wa-gateway.sh qr

# Atau lihat di browser
# http://localhost:5000/qr
```

### 3️⃣ Kirim Pesan Pertama
```bash
curl -X POST http://localhost:5000/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "number": "6281234567890",
    "message": "Halo dari WhatsApp Gateway!"
  }'
```

**Selesai!** 🎉 Gateway Anda sudah siap digunakan.

---

## 📋 Daftar Isi

- [🎯 Fitur](#-fitur)
- [⚡ Instalasi](#-instalasi)
- [🛠️ Penggunaan Sehari-hari](#️-penggunaan-sehari-hari)
- [📚 API Documentation](#-api-documentation)
- [🔐 SSH & Server Remote](#-ssh--server-remote)
- [🔧 Konfigurasi](#-konfigurasi)
- [🐛 Troubleshooting](#-troubleshooting)

---

## 🎯 Fitur

- ✅ **Kirim pesan** ke nomor individu
- ✅ **Kirim pesan ke grup** WhatsApp
- ✅ **Kirim media** (gambar, dokumen, dll)
- ✅ **Terima pesan** via webhook
- ✅ **QR Code** untuk autentikasi
- ✅ **SSH-friendly** - QR code di terminal
- ✅ **Docker ready** - mudah deploy
- ✅ **Environment variables** - fleksibel
- ✅ **Session persistent** - tidak perlu scan ulang
- ✅ **High performance** - Bun.js + Hono

---

## ⚡ Instalasi

### Prasyarat
- **Docker & Docker Compose** (Recommended)
- **Atau Bun.js** untuk development

### Pilihan Instalasi

#### 🐳 Docker (Recommended)
```bash
# 1. Clone repository
git clone <repository-url>
cd wa-gateway

# 2. Setup sekali saja (otomatis)
chmod +x setup.sh
./setup.sh

# ✅ Selesai! Gateway sudah berjalan
```

#### 🔧 Manual (Development)
```bash
# 1. Clone repository
git clone <repository-url>
cd wa-gateway

# 2. Install dependencies
bun install

# 3. Jalankan
bun start

# 4. Lihat QR code di terminal dan scan
```

---

## 🛠️ Penggunaan Sehari-hari

Setelah setup, gunakan script `wa-gateway.sh` untuk semua operasi:

### Commands Dasar
```bash
# Lihat status
./wa-gateway.sh status

# Lihat QR code (untuk scan ulang)
./wa-gateway.sh qr

# Lihat logs real-time
./wa-gateway.sh logs

# Start/stop/restart
./wa-gateway.sh start
./wa-gateway.sh stop
./wa-gateway.sh restart

# Bantuan lengkap
./wa-gateway.sh help
```

### Custom Port
```bash
# Jalankan di port lain
./wa-gateway.sh start 8080

# Lihat QR di port custom
./wa-gateway.sh qr 8080
```

### Backup & Restore
```bash
# Backup session WhatsApp
./wa-gateway.sh backup-session

# Restore session
./wa-gateway.sh restore-session backup-file.tar.gz
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000
```

### Endpoints Utama

#### 1. Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "whatsapp_ready": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 2. Kirim Pesan
```http
POST /send-message
Content-Type: application/json

{
  "number": "6281234567890",
  "message": "Halo dari WhatsApp Gateway!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pesan berhasil dikirim",
  "message_id": "...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 3. Kirim Pesan dengan Media
```http
POST /send-message
Content-Type: application/json

{
  "number": "6281234567890",
  "message": "Lihat gambar ini!",
  "media": {
    "data": "base64_encoded_data",
    "mimetype": "image/jpeg",
    "filename": "gambar.jpg"
  }
}
```

#### 4. Kirim Pesan Grup
```http
POST /send-group-message
Content-Type: application/json

{
  "group_id": "1234567890-1234567890@g.us",
  "message": "Halo grup!"
}
```

#### 5. Get QR Code
```http
GET /qr                 # JSON format
GET /qr/terminal        # Terminal format (untuk SSH)
```

#### 6. Daftar Chat
```http
GET /chats
```

#### 7. Status Koneksi
```http
GET /status
```

### Contoh Penggunaan

#### cURL
```bash
# Cek status
curl http://localhost:5000/status

# Kirim pesan
curl -X POST http://localhost:5000/send-message \
  -H "Content-Type: application/json" \
  -d '{"number": "6281234567890", "message": "Test"}'

# Get QR (SSH)
curl http://localhost:5000/qr/terminal
```

#### JavaScript/Fetch
```javascript
// Kirim pesan
const response = await fetch('http://localhost:5000/send-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    number: '6281234567890',
    message: 'Halo dari JavaScript!'
  })
});

const result = await response.json();
console.log(result);
```

#### Python
```python
import requests

# Kirim pesan
response = requests.post('http://localhost:5000/send-message', json={
    'number': '6281234567890',
    'message': 'Halo dari Python!'
})

print(response.json())
```

---

## 🔐 SSH & Server Remote

Untuk deployment di server remote, WhatsApp Gateway menyediakan beberapa cara untuk mendapatkan QR code:

### 1. Terminal SSH (Recommended)
```bash
# SSH ke server
ssh user@your-server.com

# Lihat QR code
./wa-gateway.sh qr

# Atau lihat logs (QR akan muncul)
./wa-gateway.sh logs
```

### 2. API Endpoint
```bash
# Via curl
curl http://localhost:5000/qr/terminal

# Via wget
wget -qO- http://localhost:5000/qr/terminal
```

### 3. File QR Code
```bash
# QR otomatis disimpan ke file
cat qr-code.txt
```

### 4. Port Forwarding
```bash
# Forward port dari server ke local
ssh -L 5000:localhost:5000 user@server.com

# Akses dari browser lokal
http://localhost:5000/qr
```

### Tips Production Server
1. **Firewall**: Buka port yang digunakan
2. **SSL/HTTPS**: Gunakan reverse proxy (Nginx/Caddy)
3. **Process Manager**: Gateway sudah auto-restart dengan Docker
4. **Monitoring**: Health check di `/health`
5. **Backup**: Backup session dengan `./wa-gateway.sh backup-session`

---

## 🔧 Konfigurasi

### Environment Variables

Buat file `docker.env` dari template:
```bash
cp docker.env.example docker.env
```

Edit file `docker.env`:
```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# WhatsApp Configuration
SESSION_NAME=wa-gateway-session
WEBHOOK_URL=http://localhost:5000/webhook

# QR Code Configuration
SHOW_QR_TERMINAL=true
QR_SAVE_PATH=./qr-code.txt

# Debug Configuration
DEBUG=false
```

### Available Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `production` | Environment mode |
| `SESSION_NAME` | `wa-gateway-session` | WhatsApp session name |
| `WEBHOOK_URL` | `http://localhost:PORT/webhook` | Webhook URL |
| `SHOW_QR_TERMINAL` | `true` | Show QR in terminal |
| `QR_SAVE_PATH` | `./qr-code.txt` | QR code file path |
| `DEBUG` | `false` | Enable debug logging |

### Custom Port
```bash
# Via environment variable
PORT=8080 ./wa-gateway.sh start

# Via script parameter
./wa-gateway.sh start 8080
```

### Format Nomor
- **Individu**: `6281234567890` atau `6281234567890@c.us`
- **Grup**: `1234567890-1234567890@g.us` (dapatkan dari `/chats`)

---

## 🐛 Troubleshooting

### Gateway Tidak Bisa Start

#### 1. Cek Docker
```bash
# Pastikan Docker berjalan
docker info

# Cek container
./wa-gateway.sh status
```

#### 2. Port Sudah Digunakan
```bash
# Cek port yang digunakan
sudo netstat -tulpn | grep :5000

# Gunakan port lain
./wa-gateway.sh start 8080
```

#### 3. Permission Error
```bash
# Fix permission
sudo chmod +x wa-gateway.sh setup.sh

# Atau jalankan dengan sudo
sudo ./wa-gateway.sh start
```

### QR Code Tidak Muncul

#### 1. Tunggu Sebentar
```bash
# QR perlu waktu untuk generate
./wa-gateway.sh logs

# Atau coba lagi
./wa-gateway.sh qr
```

#### 2. Cek File QR
```bash
# QR otomatis disimpan ke file
cat qr-code.txt
```

#### 3. Browser Access
```bash
# Akses via browser
http://localhost:5000/qr
```

### Pesan Tidak Terkirim

#### 1. Cek Status Koneksi
```bash
curl http://localhost:5000/status
```

#### 2. Cek Format Nomor
```bash
# Pastikan format benar
# ✅ Benar: "6281234567890"
# ❌ Salah: "+62 812-3456-7890"
```

#### 3. Cek Logs
```bash
./wa-gateway.sh logs
```

### Session Hilang

#### 1. Restore Backup
```bash
# Jika ada backup
./wa-gateway.sh restore-session backup-file.tar.gz
```

#### 2. Scan Ulang
```bash
# Reset dan scan ulang
./wa-gateway.sh restart
./wa-gateway.sh qr
```

### Performance Issues

#### 1. Restart Gateway
```bash
./wa-gateway.sh restart
```

#### 2. Clean Restart
```bash
./wa-gateway.sh stop
./wa-gateway.sh start
```

#### 3. Update Gateway
```bash
./wa-gateway.sh update
```

### Bantuan Lebih Lanjut

```bash
# Lihat semua commands
./wa-gateway.sh help

# Lihat logs detail
./wa-gateway.sh logs

# Cek status lengkap
./wa-gateway.sh status
```

---

## 📞 Support

- **Issues**: Buat issue di repository ini
- **Documentation**: Lihat file `examples.http` untuk contoh API
- **Script Help**: Jalankan `./wa-gateway.sh help`

---

## 📄 License

MIT License - Bebas digunakan untuk project pribadi dan komersial.

---

## 🎉 Selamat!

WhatsApp Gateway Anda sudah siap digunakan! 

**Quick Commands:**
- `./wa-gateway.sh qr` - Lihat QR code
- `./wa-gateway.sh logs` - Lihat logs
- `./wa-gateway.sh help` - Bantuan lengkap

**Happy messaging!** 📱✨