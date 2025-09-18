# 📱 WhatsApp Gateway - Quick Reference

## 🚀 Setup (Sekali Saja)
```bash
git clone <repo>
cd wa-gateway
chmod +x *.sh
./setup.sh
```

## 🛠️ Daily Commands
```bash
./wa-gateway.sh status    # Cek status
./wa-gateway.sh qr        # Lihat QR code
./wa-gateway.sh logs      # Lihat logs
./wa-gateway.sh start     # Start gateway
./wa-gateway.sh stop      # Stop gateway
./wa-gateway.sh restart   # Restart gateway
./wa-gateway.sh help      # Bantuan lengkap
```

## 📱 QR Code Access
```bash
./wa-gateway.sh qr                           # Terminal
curl http://localhost:5000/qr/terminal       # SSH
cat qr-code.txt                              # File
http://localhost:5000/qr                     # Browser
```

## 📡 API Endpoints
```bash
# Health check
curl http://localhost:5000/health

# Send message
curl -X POST http://localhost:5000/send-message \
  -H "Content-Type: application/json" \
  -d '{"number": "6281234567890", "message": "Hello!"}'

# Get QR
curl http://localhost:5000/qr/terminal

# Status
curl http://localhost:5000/status

# Get chats
curl http://localhost:5000/chats
```

## 🔧 Custom Port
```bash
./wa-gateway.sh start 8080    # Start di port 8080
./wa-gateway.sh qr 8080       # QR di port 8080
PORT=8080 ./setup.sh          # Setup dengan port custom
```

## 💾 Backup & Restore
```bash
./wa-gateway.sh backup-session                    # Backup
./wa-gateway.sh restore-session backup-file.tar.gz # Restore
```

## 🐛 Troubleshooting
```bash
# Gateway tidak jalan
./wa-gateway.sh status
docker info

# QR tidak muncul
./wa-gateway.sh logs
cat qr-code.txt

# Port conflict
sudo netstat -tulpn | grep :5000
./wa-gateway.sh start 8080

# Reset everything
./wa-gateway.sh cleanup
```

## 📞 Format Nomor
- Individual: `6281234567890`
- Group: `1234567890-1234567890@g.us`

## 🌐 URLs (Default Port 5000)
- Health: `http://localhost:5000/health`
- QR Web: `http://localhost:5000/qr`
- Status: `http://localhost:5000/status`
- API Docs: Lihat `examples.http`

## 🔑 Environment Variables
Edit file `docker.env`:
```bash
PORT=5000                           # Server port
DEBUG=false                         # Debug mode
SHOW_QR_TERMINAL=true              # QR di terminal
SESSION_NAME=wa-gateway-session     # Session name
```

---
**Need help?** Run `./wa-gateway.sh help`
