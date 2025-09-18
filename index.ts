import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import express from 'express';
import cors from 'cors';
import qrcode from 'qrcode-terminal';

// Load environment variables
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || `http://localhost:${PORT}/webhook`;
const SESSION_NAME = process.env.SESSION_NAME || 'wa-gateway-session';
const DEBUG = process.env.DEBUG === 'true';

// Interfaces
interface SendMessageRequest {
  number: string;
  message: string;
  media?: {
    data: string;
    mimetype: string;
    filename?: string;
  };
}

interface WebhookMessage {
  from: string;
  to: string;
  body: string;
  timestamp: number;
  type: string;
  hasMedia: boolean;
}

// WhatsApp Gateway Class
class WhatsAppGateway {
  private client!: Client;
  private app: express.Application;
  private isReady: boolean = false;
  private qrCode: string = '';
  private port: number;

  constructor(port?: number) {
    this.port = port || PORT;
    this.app = express();
    this.setupExpress();
    this.initializeWhatsAppClient();
  }

  private setupExpress(): void {
    this.app.use(cors());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Routes
    this.setupRoutes();
  }

  private initializeWhatsAppClient(): void {
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: SESSION_NAME
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    this.setupWhatsAppEvents();
  }

  private setupWhatsAppEvents(): void {
    this.client.on('qr', (qr) => {
      console.log('📱 QR Code diterima, scan dengan WhatsApp Anda:');
      if (DEBUG) {
        qrcode.generate(qr, { small: true });
      }
      this.qrCode = qr;
    });

    this.client.on('ready', () => {
      console.log('✅ WhatsApp Client siap!');
      this.isReady = true;
      this.qrCode = '';
    });

    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp berhasil diautentikasi!');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('❌ Autentikasi gagal:', msg);
    });

    this.client.on('disconnected', (reason) => {
      console.log('🔌 WhatsApp terputus:', reason);
      this.isReady = false;
    });

    this.client.on('message', async (message) => {
      await this.handleIncomingMessage(message);
    });

    this.client.initialize();
  }

  private async handleIncomingMessage(message: any): Promise<void> {
    try {
      const webhookData: WebhookMessage = {
        from: message.from,
        to: message.to,
        body: message.body,
        timestamp: message.timestamp,
        type: message.type,
        hasMedia: message.hasMedia
      };

      if (DEBUG) {
        console.log('📨 Pesan masuk:', {
          from: message.from,
          body: message.body.substring(0, 50) + (message.body.length > 50 ? '...' : ''),
          type: message.type
        });
      }

      // Di sini Anda bisa menambahkan logika untuk mengirim ke webhook eksternal
      // await this.sendToWebhook(webhookData);
    } catch (error) {
      console.error('❌ Error handling pesan masuk:', error);
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        whatsapp_ready: this.isReady,
        timestamp: new Date().toISOString()
      });
    });

    // Get QR Code
    this.app.get('/qr', (req, res) => {
      if (this.isReady) {
        return res.json({
          success: false,
          message: 'WhatsApp sudah terhubung'
        });
      }

      if (!this.qrCode) {
        return res.json({
          success: false,
          message: 'QR Code belum tersedia, tunggu sebentar...'
        });
      }

      res.json({
        success: true,
        qr_code: this.qrCode
      });
    });

    // Check connection status
    this.app.get('/status', (req, res) => {
      res.json({
        connected: this.isReady,
        status: this.isReady ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
    });

    // Send message
    this.app.post('/send-message', async (req, res) => {
      try {
        if (!this.isReady) {
          return res.status(400).json({
            success: false,
            message: 'WhatsApp belum terhubung'
          });
        }

        const { number, message, media }: SendMessageRequest = req.body;

        if (!number || !message) {
          return res.status(400).json({
            success: false,
            message: 'Parameter number dan message harus diisi'
          });
        }

        // Format nomor (tambahkan @c.us jika belum ada)
        const formattedNumber = number.includes('@') ? number : `${number}@c.us`;

        let result;
        if (media) {
          // Kirim pesan dengan media
          const mediaObj = new MessageMedia(media.mimetype, media.data, media.filename);
          result = await this.client.sendMessage(formattedNumber, mediaObj, { caption: message });
        } else {
          // Kirim pesan teks biasa
          result = await this.client.sendMessage(formattedNumber, message);
        }

        console.log('✅ Pesan terkirim ke:', number);

        res.json({
          success: true,
          message: 'Pesan berhasil dikirim',
          message_id: result.id.id,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Error mengirim pesan:', error);
        res.status(500).json({
          success: false,
          message: 'Gagal mengirim pesan',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Send message to group
    this.app.post('/send-group-message', async (req, res) => {
      try {
        if (!this.isReady) {
          return res.status(400).json({
            success: false,
            message: 'WhatsApp belum terhubung'
          });
        }

        const { group_id, message } = req.body;

        if (!group_id || !message) {
          return res.status(400).json({
            success: false,
            message: 'Parameter group_id dan message harus diisi'
          });
        }

        const result = await this.client.sendMessage(group_id, message);

        console.log('✅ Pesan grup terkirim ke:', group_id);

        res.json({
          success: true,
          message: 'Pesan grup berhasil dikirim',
          message_id: result.id.id,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Error mengirim pesan grup:', error);
        res.status(500).json({
          success: false,
          message: 'Gagal mengirim pesan grup',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get chats
    this.app.get('/chats', async (req, res) => {
      try {
        if (!this.isReady) {
          return res.status(400).json({
            success: false,
            message: 'WhatsApp belum terhubung'
          });
        }

        const chats = await this.client.getChats();
        const chatList = chats.map(chat => ({
          id: chat.id._serialized,
          name: chat.name,
          isGroup: chat.isGroup,
          unreadCount: chat.unreadCount,
          lastMessage: chat.lastMessage ? {
            body: chat.lastMessage.body,
            timestamp: chat.lastMessage.timestamp,
            from: chat.lastMessage.from
          } : null
        }));

        res.json({
          success: true,
          chats: chatList,
          total: chatList.length
        });

      } catch (error) {
        console.error('❌ Error mendapatkan daftar chat:', error);
        res.status(500).json({
          success: false,
          message: 'Gagal mendapatkan daftar chat',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Logout/Disconnect
    this.app.post('/logout', async (req, res) => {
      try {
        await this.client.logout();
        this.isReady = false;
        
        res.json({
          success: true,
          message: 'Berhasil logout dari WhatsApp'
        });

      } catch (error) {
        console.error('❌ Error logout:', error);
        res.status(500).json({
          success: false,
          message: 'Gagal logout',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Webhook endpoint untuk menerima pesan masuk
    this.app.post('/webhook', (req, res) => {
      console.log('🔔 Webhook dipanggil:', req.body);
      res.json({ received: true });
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 WhatsApp Gateway berjalan di port ${this.port}`);
      console.log(`📖 API Documentation:`);
      console.log(`   GET  /health              - Health check`);
      console.log(`   GET  /status              - Connection status`);
      console.log(`   GET  /qr                  - Get QR code`);
      console.log(`   GET  /chats               - Get chat list`);
      console.log(`   POST /send-message        - Send message`);
      console.log(`   POST /send-group-message  - Send group message`);
      console.log(`   POST /logout              - Logout WhatsApp`);
      console.log(`   POST /webhook             - Webhook endpoint`);
      console.log(`\n🔗 Base URL: http://localhost:${this.port}`);
    });
  }
}

// Jalankan aplikasi
const gateway = new WhatsAppGateway();
gateway.start();

// Log konfigurasi saat startup
console.log('🔧 Configuration:');
console.log(`   PORT: ${PORT}`);
console.log(`   WEBHOOK_URL: ${WEBHOOK_URL}`);
console.log(`   SESSION_NAME: ${SESSION_NAME}`);
console.log(`   DEBUG: ${DEBUG}`);