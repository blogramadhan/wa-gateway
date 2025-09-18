import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import qrcode from 'qrcode-terminal';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || `http://localhost:${PORT}/webhook`;
const SESSION_NAME = process.env.SESSION_NAME || 'wa-gateway-session';
const DEBUG = process.env.DEBUG === 'true';
const SHOW_QR_TERMINAL = process.env.SHOW_QR_TERMINAL !== 'false'; // Default true
const QR_SAVE_PATH = process.env.QR_SAVE_PATH || './qr-code.txt';

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
  private app: Hono;
  private isReady: boolean = false;
  private qrCode: string = '';
  private port: number;

  constructor(port?: number) {
    this.port = port || PORT;
    this.app = new Hono();
    this.setupHono();
    this.initializeWhatsAppClient();
  }

  private setupHono(): void {
    // Middleware
    this.app.use('*', cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    }));
    
    if (DEBUG) {
      this.app.use('*', logger());
    }

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
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
      }
    });

    this.setupWhatsAppEvents();
  }

  private setupWhatsAppEvents(): void {
    this.client.on('qr', (qr) => {
      console.log('📱 QR Code diterima, scan dengan WhatsApp Anda:');
      console.log('');
      
      // Always show QR in terminal unless explicitly disabled
      if (SHOW_QR_TERMINAL) {
        console.log('🔳 QR Code (scan dengan WhatsApp di ponsel Anda):');
        console.log('');
        qrcode.generate(qr, { small: true });
        console.log('');
      }

      // Save QR code to file for SSH access
      try {
        const qrFilePath = join(process.cwd(), QR_SAVE_PATH);
        const qrContent = `WhatsApp Gateway QR Code
Generated: ${new Date().toISOString()}
Server: http://localhost:${this.port}

QR Code String:
${qr}

Instructions:
1. Open WhatsApp di ponsel Anda
2. Pilih "Linked Devices" atau "WhatsApp Web"
3. Scan QR code di atas
4. Gateway akan terhubung secara otomatis

API Endpoints setelah terhubung:
- Status: http://localhost:${this.port}/status
- Send Message: http://localhost:${this.port}/send-message
- Health: http://localhost:${this.port}/health
`;
        
        writeFileSync(qrFilePath, qrContent);
        console.log(`💾 QR Code disimpan ke: ${qrFilePath}`);
        console.log(`📋 Untuk SSH: cat ${QR_SAVE_PATH}`);
        console.log('');
      } catch (error) {
        console.error('❌ Error menyimpan QR code ke file:', error);
      }

      // Store QR for API endpoint
      this.qrCode = qr;
      
      console.log('🌐 Alternatif: Akses QR code via API:');
      console.log(`   GET http://localhost:${this.port}/qr`);
      console.log(`   GET http://localhost:${this.port}/qr/terminal`);
      console.log('');
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
    this.app.get('/health', (c) => {
      return c.json({
        status: 'ok',
        whatsapp_ready: this.isReady,
        timestamp: new Date().toISOString()
      });
    });

    // Get QR Code
    this.app.get('/qr', (c) => {
      if (this.isReady) {
        return c.json({
          success: false,
          message: 'WhatsApp sudah terhubung'
        });
      }

      if (!this.qrCode) {
        return c.json({
          success: false,
          message: 'QR Code belum tersedia, tunggu sebentar...'
        });
      }

      return c.json({
        success: true,
        qr_code: this.qrCode,
        instructions: {
          web: `Akses http://localhost:${this.port}/qr/terminal untuk QR terminal`,
          file: `Jalankan: cat ${QR_SAVE_PATH}`,
          ssh: 'Untuk SSH, gunakan endpoint /qr/terminal'
        }
      });
    });

    // Get QR Code as terminal display
    this.app.get('/qr/terminal', (c) => {
      if (this.isReady) {
        return c.text(`WhatsApp Gateway - Already Connected

✅ Status: Connected
🕒 Connected at: ${new Date().toISOString()}
🔗 Base URL: http://localhost:${this.port}

API Endpoints:
- GET  /status              - Connection status
- GET  /chats               - Get chat list  
- POST /send-message        - Send message
- POST /send-group-message  - Send group message
- POST /logout              - Logout WhatsApp
`);
      }

      if (!this.qrCode) {
        return c.text(`WhatsApp Gateway - QR Code Loading

⏳ Status: Generating QR Code...
🕒 Time: ${new Date().toISOString()}

Please wait a moment for QR code to be generated.
Refresh this page in a few seconds.
`);
      }

      // Generate QR code as ASCII art for terminal
      let qrTerminal = '';
      try {
        // Capture qrcode-terminal output
        const originalLog = console.log;
        const logs: string[] = [];
        console.log = (...args) => {
          logs.push(args.join(' '));
        };
        
        qrcode.generate(this.qrCode, { small: true });
        console.log = originalLog;
        qrTerminal = logs.join('\n');
      } catch (error) {
        qrTerminal = 'Error generating terminal QR code';
      }

      const response = `WhatsApp Gateway - QR Code

📱 Scan dengan WhatsApp di ponsel Anda
🕒 Generated: ${new Date().toISOString()}
🔗 Server: http://localhost:${this.port}

${qrTerminal}

📋 Instructions:
1. Open WhatsApp di ponsel Anda
2. Pilih "Linked Devices" atau "WhatsApp Web"  
3. Scan QR code di atas
4. Gateway akan terhubung secara otomatis

🌐 API Endpoints setelah terhubung:
- GET  http://localhost:${this.port}/status
- POST http://localhost:${this.port}/send-message
- GET  http://localhost:${this.port}/chats

💡 Tips untuk SSH:
curl http://localhost:${this.port}/qr/terminal
`;

      return c.text(response);
    });

    // Check connection status
    this.app.get('/status', (c) => {
      return c.json({
        connected: this.isReady,
        status: this.isReady ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
    });

    // Send message
    this.app.post('/send-message', async (c) => {
      try {
        if (!this.isReady) {
          return c.json({
            success: false,
            message: 'WhatsApp belum terhubung'
          }, 400);
        }

        const body: SendMessageRequest = await c.req.json();
        const { number, message, media } = body;

        if (!number || !message) {
          return c.json({
            success: false,
            message: 'Parameter number dan message harus diisi'
          }, 400);
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

        return c.json({
          success: true,
          message: 'Pesan berhasil dikirim',
          message_id: result.id.id,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Error mengirim pesan:', error);
        return c.json({
          success: false,
          message: 'Gagal mengirim pesan',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }
    });

    // Send message to group
    this.app.post('/send-group-message', async (c) => {
      try {
        if (!this.isReady) {
          return c.json({
            success: false,
            message: 'WhatsApp belum terhubung'
          }, 400);
        }

        const { group_id, message } = await c.req.json();

        if (!group_id || !message) {
          return c.json({
            success: false,
            message: 'Parameter group_id dan message harus diisi'
          }, 400);
        }

        const result = await this.client.sendMessage(group_id, message);

        console.log('✅ Pesan grup terkirim ke:', group_id);

        return c.json({
          success: true,
          message: 'Pesan grup berhasil dikirim',
          message_id: result.id.id,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Error mengirim pesan grup:', error);
        return c.json({
          success: false,
          message: 'Gagal mengirim pesan grup',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }
    });

    // Get chats
    this.app.get('/chats', async (c) => {
      try {
        if (!this.isReady) {
          return c.json({
            success: false,
            message: 'WhatsApp belum terhubung'
          }, 400);
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

        return c.json({
          success: true,
          chats: chatList,
          total: chatList.length
        });

      } catch (error) {
        console.error('❌ Error mendapatkan daftar chat:', error);
        return c.json({
          success: false,
          message: 'Gagal mendapatkan daftar chat',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }
    });

    // Logout/Disconnect
    this.app.post('/logout', async (c) => {
      try {
        await this.client.logout();
        this.isReady = false;
        
        return c.json({
          success: true,
          message: 'Berhasil logout dari WhatsApp'
        });

      } catch (error) {
        console.error('❌ Error logout:', error);
        return c.json({
          success: false,
          message: 'Gagal logout',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }
    });

    // Webhook endpoint untuk menerima pesan masuk
    this.app.post('/webhook', async (c) => {
      const body = await c.req.json();
      console.log('🔔 Webhook dipanggil:', body);
      return c.json({ received: true });
    });
  }

  public start(): void {
    console.log(`🚀 WhatsApp Gateway berjalan di port ${this.port}`);
    console.log(`📖 API Documentation:`);
    console.log(`   GET  /health              - Health check`);
    console.log(`   GET  /status              - Connection status`);
    console.log(`   GET  /qr                  - Get QR code`);
    console.log(`   GET  /qr/terminal         - Get QR code (terminal)`);
    console.log(`   GET  /chats               - Get chat list`);
    console.log(`   POST /send-message        - Send message`);
    console.log(`   POST /send-group-message  - Send group message`);
    console.log(`   POST /logout              - Logout WhatsApp`);
    console.log(`   POST /webhook             - Webhook endpoint`);
    console.log(`\n🔗 Base URL: http://localhost:${this.port}`);

    // Start Bun server
    Bun.serve({
      port: this.port,
      fetch: this.app.fetch,
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
console.log(`   SHOW_QR_TERMINAL: ${SHOW_QR_TERMINAL}`);
console.log(`   QR_SAVE_PATH: ${QR_SAVE_PATH}`);
console.log('');
console.log('📱 QR Code Access Methods:');
console.log(`   📺 Terminal: QR akan ditampilkan di console ini`);
console.log(`   📄 File: cat ${QR_SAVE_PATH}`);
console.log(`   🌐 API: curl http://localhost:${PORT}/qr/terminal`);
console.log(`   🔗 Web: http://localhost:${PORT}/qr`);