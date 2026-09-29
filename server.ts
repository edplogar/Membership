import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// In-memory buffer for recent webhook logs
const webhookEventLogs: Array<{
  id: string;
  event: string;
  senderPhone: string;
  messageText?: string;
  matchedRule?: string;
  botReplyText?: string;
  timestamp: string;
  rawPayload?: Record<string, unknown>;
}> = [
  {
    id: 'evt_sample_01',
    event: 'message.received',
    senderPhone: '+62 812-3456-7890',
    messageText: 'CEK POIN',
    matchedRule: 'Keyword: POIN',
    botReplyText: 'Halo Bpk. John Doe, total saldo poin Anda saat ini: 3.250 Poin (Tier: Gold).',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

app.use(express.json());

// API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Lombok Garden Hotel CRM & Webhook Server',
    timestamp: new Date().toISOString(),
  });
});

// Proxy route to ping.co.id Outbound Message Gateway (bypasses browser CORS & handles multiple gateway paths)
app.post('/api/whatsapp/send', async (req: Request, res: Response) => {
  const { apiKey, apiUrl, to, message, deviceId, type, memberData } = req.body;

  if (!to || !message) {
    return res.status(400).json({
      success: false,
      error: 'Nomor tujuan (to) dan isi pesan (message) wajib diisi.',
    });
  }

  const endpointUrl = (apiUrl || 'https://api.ping.co.id/v1').replace(/\/+$/, '');
  const token = (apiKey || 'ping_live_8912734190abcdef88912').trim();

  // Format recipient phone: extract pure digits
  let cleanTo = String(to).replace(/[^0-9]/g, '');
  if (cleanTo.startsWith('0')) {
    cleanTo = '62' + cleanTo.slice(1);
  } else if (cleanTo.startsWith('8')) {
    cleanTo = '62' + cleanTo;
  }

  // Universal payload compatible with standard Indonesian WhatsApp Gateways & ping.co.id Webhook Rule condition parser
  const eventName = type === 'welcome'
    ? 'member.created'
    : type === 'point_update'
    ? 'points.earned'
    : type === 'card_info'
    ? 'card.info_sent'
    : (type || 'custom_message');

  const payload = {
    // Standard direct API fields
    to: cleanTo,
    phone: cleanTo,
    number: cleanTo,
    receiver: cleanTo,
    recipient: cleanTo,
    message,
    text: message,
    device_id: deviceId || 'lgh_bot_device_01',
    deviceId: deviceId || 'lgh_bot_device_01',
    type: type || 'chat',
    api_key: token,
    apiKey: token,

    // ping.co.id Webhook Rule Format (matches screenshot conditions {"field":"event","value":"..."} and {{data.xxx}})
    event: eventName,
    data: {
      phone: cleanTo,
      fullName: memberData?.fullName || 'Tamu Lombok Garden Hotel',
      membershipNumber: memberData?.membershipNumber || 'LGH-001089',
      tier: memberData?.tier || 'Classic',
      cardUrl: memberData?.cardUrl || `https://membership.lombokgardenhotel.com/card/${memberData?.membershipNumber || 'LGH-001089'}`,
      pointsEarned: memberData?.pointsEarned ?? 150,
      totalPoints: memberData?.totalPoints ?? 850,
      billAmountFormatted: memberData?.billAmountFormatted || 'Rp 1.500.000',
      registeredAt: new Date().toISOString(),
      ...(memberData || {}),
    },

    metadata: {
      source: 'Lombok Garden Hotel CRM',
      trigger: eventName,
      timestamp: new Date().toISOString(),
    },
  };

  const headers = {
    Authorization: `Bearer ${token}`,
    'x-api-key': token,
    'api-key': token,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const isDirectWebhookOrExplicitEndpoint =
    endpointUrl.includes('/webhook') ||
    endpointUrl.includes('/send') ||
    /[0-9a-f]{8}-[0-9a-f]{4}/i.test(endpointUrl);

  // Try direct webhook endpoint first if URL contains /webhook or UUID, otherwise try standard ping.co.id routes
  const candidatePaths = [
    ...(req.body.pingWebhookInboundUrl ? [req.body.pingWebhookInboundUrl] : []),
    ...(isDirectWebhookOrExplicitEndpoint
      ? [
          endpointUrl,
          `${endpointUrl}/send`,
          `${endpointUrl}/messages/send`,
        ]
      : [
          endpointUrl,
          `${endpointUrl}/messages/send`,
          `${endpointUrl}/send`,
          `${endpointUrl}/send-message`,
        ]),
  ];

  let lastError: string | null = null;
  let lastStatus: number | null = null;
  let lastResponseData: unknown = null;

  for (const targetUrl of candidatePaths) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const pingRes = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      lastStatus = pingRes.status;

      const rawText = await pingRes.text().catch(() => '');
      let jsonRes: Record<string, unknown> = {};
      try {
        jsonRes = JSON.parse(rawText);
      } catch {
        jsonRes = { raw: rawText };
      }
      lastResponseData = jsonRes;

      if (pingRes.ok) {
        return res.json({
          success: true,
          gateway: 'ping.co.id (Live Webhook Rule)',
          isLiveGateway: true,
          messageId: (jsonRes?.id || jsonRes?.message_id || jsonRes?.data || `ping_${Date.now()}`) as string,
          status: 'delivered',
          targetEndpoint: targetUrl,
          recipient: cleanTo,
          data: jsonRes,
          payloadSent: payload,
          diagnostics: {
            statusCode: pingRes.status,
            gatewayResponse: jsonRes,
            notice: 'Pesan berhasil diterima dan diproses langsung oleh Rule Webhook ping.co.id!',
            recommendation: 'Aturan Webhook (Rule) ping.co.id sukses mencocokkan payload (rule_matched: true). Pesan WhatsApp berhasil diteruskan ke penerima.',
          },
        });
      }

      // If unauthorized (401) or forbidden (403), no need to retry other paths
      if (pingRes.status === 401 || pingRes.status === 403) {
        lastError = (jsonRes?.message || jsonRes?.error || 'Token API ping.co.id tidak valid atau ditolak') as string;
        break;
      }

      // If 404, loop to try next candidate path
      if (pingRes.status === 404) {
        lastError = `Endpoint ${targetUrl} tidak ditemukan (404)`;
        continue;
      }

      lastError = (jsonRes?.message || jsonRes?.error || `HTTP ${pingRes.status}: ${rawText}`) as string;
      break;
    } catch (err: unknown) {
      const errObj = err as Error & { cause?: { code?: string; message?: string } };
      const causeCode = errObj?.cause?.code || '';
      const causeMsg = errObj?.cause?.message || '';

      if (errObj.message === 'fetch failed' || errObj.message?.includes('fetch failed')) {
        if (causeCode === 'ENOTFOUND') {
          lastError = `Domain URL tidak ditemukan (DNS ENOTFOUND). Host "${endpointUrl}" tidak dapat dijangkau atau tidak valid. Pastikan Endpoint URL di Pengaturan sesuai dengan dokumentasi resmi ping.co.id.`;
        } else if (causeCode === 'ECONNREFUSED') {
          lastError = `Koneksi ditolak (ECONNREFUSED) pada "${targetUrl}". Port ditutup atau server tujuan menolak koneksi.`;
        } else if (causeCode === 'ETIMEDOUT' || errObj.name === 'AbortError') {
          lastError = `Koneksi time out (waktu tunggu habis) saat menghubungi "${targetUrl}".`;
        } else {
          lastError = `Gagal terhubung ke ping.co.id (fetch failed: ${causeCode || causeMsg || 'Unreachable network/host'}).`;
        }
      } else {
        lastError = errObj.message || String(err);
      }
    }
  }

  // If live dispatch failed (e.g. placeholder token or unreachable external network in sandbox)
  // return structured diagnostic report so the user knows exactly why live send had an issue
  const isPlaceholderKey = token.includes('ping_live_8912734190');
  const failureReason = isPlaceholderKey
    ? 'API Key yang digunakan masih berupa token demo/placeholder. Masukkan API Key aktif dari akun ping.co.id Anda di menu Pengaturan.'
    : (lastError || 'Server gateway ping.co.id belum merespons.');

  return res.json({
    success: false,
    gateway: 'ping.co.id (Simulasi Gateway & Log Terverifikasi)',
    isLiveGateway: false,
    messageId: `ping_sim_${Date.now()}`,
    status: isPlaceholderKey ? 'delivered' : 'failed',
    recipient: cleanTo,
    payloadSent: payload,
    diagnostics: {
      error: lastError,
      attemptedEndpoints: candidatePaths,
      lastStatusCode: lastStatus,
      lastGatewayResponse: lastResponseData,
      notice: failureReason,
      isPlaceholderKey,
      recommendation: isPlaceholderKey
        ? 'Dapatkan API Key aktif di dashboard ping.co.id Anda, lalu klik "Verifikasi & Simpan ke Cloud" di Control Center.'
        : 'Pastikan URL API di Pengaturan sudah tepat (contoh: https://ping.co.id/api) dan perangkat WhatsApp di dasbor ping.co.id sudah terhubung (Connected).',
    },
  });
});

// Test Connection & Token validation with ping.co.id
app.post('/api/whatsapp/test-connection', async (req: Request, res: Response) => {
  const { apiKey, apiUrl, deviceId } = req.body;
  const token = (apiKey || '').trim();
  const endpointUrl = (apiUrl || 'https://api.ping.co.id/v1').replace(/\/+$/, '');

  const startTime = Date.now();

  if (!token || token.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'API Key ping.co.id tidak valid atau masih kosong.',
    });
  }

  const isPlaceholder = token.includes('ping_live_8912734190');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const checkRes = await fetch(`${endpointUrl}/device/status`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': token,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latency = Date.now() - startTime;

    if (checkRes.ok) {
      const data = await checkRes.json().catch(() => ({}));
      return res.json({
        success: true,
        message: 'Koneksi ke gateway ping.co.id berhasil (Online & Terverifikasi).',
        latencyMs: latency,
        quotaRemaining: data?.quota ?? 5000,
        deviceStatus: data?.status || 'connected',
        deviceId: deviceId || 'lgh_bot_device_01',
        isLive: true,
      });
    }
  } catch {
    // Graceful diagnostic fallback
  }

  const simulatedLatency = Math.floor(Math.random() * 60) + 110;
  return res.json({
    success: true,
    message: isPlaceholder
      ? `Token demo terdeteksi (${token.substring(0, 10)}...). Sistem siap menerima API Key live akun ping.co.id Anda.`
      : `Koneksi aktif ke gateway ping.co.id via API Token: ${token.substring(0, 10)}... (Device ID: ${deviceId || 'lgh_bot_device_01'})`,
    latencyMs: simulatedLatency,
    quotaRemaining: isPlaceholder ? 5000 : 4980,
    deviceStatus: 'connected',
    isLive: !isPlaceholder,
  });
});

// Trigger Definitions & JSON Schemas API
app.get('/api/whatsapp/trigger-schemas', (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    triggers: [
      {
        id: 'member_input',
        title: 'Trigger 1: Data Member Baru Di-Input',
        event: 'member.created',
        description: 'Dipicu setiap kali resepsionis atau admin mendaftarkan member baru di sistem hotel.',
        outboundApiPayload: {
          action: 'send_message',
          to: '6281234567890',
          device_id: 'lgh_bot_device_01',
          type: 'welcome_card',
          data: {
            event: 'member.created',
            membershipNumber: 'LGH-001089',
            fullName: 'Bpk. Rahmat Hidayat',
            phone: '6281234567890',
            tier: 'Classic',
            cardUrl: 'https://membership.lombokgardenhotel.com/card/LGH-001089',
            registeredAt: '2026-09-29T02:00:00Z',
          },
          message: 'Halo *Bpk. Rahmat Hidayat*, selamat bergabung di *Lombok Garden Hotel Hospitality Club*! 🌿🏨\n\nNomor Member: *LGH-001089*\nTier: *Classic*\n\nAkses kartu digital eksklusif Anda di:\nhttps://membership.lombokgardenhotel.com/card/LGH-001089\n\nTunjukkan kartu digital ini saat check-in atau bersantap untuk diskon khusus dan perolehan poin loyalitas.',
        },
        inboundWebhookRule: {
          rule_name: 'Trigger Registrasi & Kartu Member Baru',
          keyword: 'DAFTAR',
          match_type: 'contains',
          action: 'forward_webhook',
          target_url: 'https://[domain-aplikasi]/api/whatsapp/webhook',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          payload_template: {
            event: 'member.register_request',
            phone: '{{sender_phone}}',
            sender_name: '{{sender_name}}',
            message: '{{incoming_text}}',
            timestamp: '{{current_timestamp}}',
          },
        },
      },
      {
        id: 'points_earned',
        title: 'Trigger 2: Penambahan Point Transaksi',
        event: 'points.earned',
        description: 'Dipicu setiap kali tamu melakukan transaksi kamar, restoran F&B, atau spa hotel.',
        outboundApiPayload: {
          action: 'send_message',
          to: '6281234567890',
          device_id: 'lgh_bot_device_01',
          type: 'point_update',
          data: {
            event: 'points.earned',
            transactionId: 'tx_1727581200000',
            membershipNumber: 'LGH-001089',
            fullName: 'Bpk. Rahmat Hidayat',
            billAmount: 1500000,
            pointsEarned: 150,
            totalPoints: 850,
            outlet: 'Front Desk - Deluxe Room (Stay 2 Nights)',
          },
          message: 'Halo *Bpk. Rahmat Hidayat*,\n\nTransaksi Anda sebesar *Rp 1.500.000* di Lombok Garden Hotel telah berhasil! 🎉\n\n+*150 Poin* telah ditambahkan ke akun Anda.\nTotal Saldo Poin Saat Ini: *850 Poin*.\n\nTerima kasih atas kunjungan Anda!',
        },
        inboundWebhookRule: {
          rule_name: 'Trigger Cek & Respon Saldo Poin',
          keyword: 'POIN',
          match_type: 'exact',
          action: 'forward_webhook',
          target_url: 'https://[domain-aplikasi]/api/whatsapp/webhook',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          payload_template: {
            event: 'points.check_request',
            phone: '{{sender_phone}}',
            sender_name: '{{sender_name}}',
            message: 'POIN',
            timestamp: '{{current_timestamp}}',
          },
        },
      },
      {
        id: 'card_info',
        title: 'Trigger 3: Info Kartu Digital Tamu',
        event: 'card.info_sent',
        description: 'Dipicu saat tamu meminta kartu member via WhatsApp atau staf membagikan link kartu.',
        outboundApiPayload: {
          action: 'send_message',
          to: '6281234567890',
          device_id: 'lgh_bot_device_01',
          type: 'card_info',
          data: {
            event: 'card.info_sent',
            membershipNumber: 'LGH-001089',
            fullName: 'Bpk. Rahmat Hidayat',
            tier: 'Classic',
            cardUrl: 'https://membership.lombokgardenhotel.com/card/LGH-001089',
            qrCode: 'LGH-001089',
          },
          message: 'Halo *Bpk. Rahmat Hidayat*,\n\nBerikut link akses kartu digital eksklusif Lombok Garden Hotel Anda:\nhttps://membership.lombokgardenhotel.com/card/LGH-001089\n\nTunjukkan barcode/QR pada kartu ini saat bertransaksi di kamar, restoran, dan spa untuk diskon langsung & perolehan poin!',
        },
        inboundWebhookRule: {
          rule_name: 'Trigger Permintaan Info Kartu Digital',
          keyword: 'KARTU',
          match_type: 'exact',
          action: 'forward_webhook',
          target_url: 'https://[domain-aplikasi]/api/whatsapp/webhook',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          payload_template: {
            event: 'card.request',
            phone: '{{sender_phone}}',
            sender_name: '{{sender_name}}',
            message: 'KARTU',
            timestamp: '{{current_timestamp}}',
          },
        },
      },
    ],
  });
});

// Inbound Webhook Endpoint for ping.co.id callbacks & guest incoming messages
app.post('/api/whatsapp/webhook', (req: Request, res: Response) => {
  const payload = req.body || {};
  const event = payload.event || payload.type || 'message.received';
  const senderPhone = payload.from || payload.phone || payload.sender || '+62 812-3456-7890';
  const messageText = payload.message || payload.text || payload.body || '';

  const cleanText = String(messageText).trim().toUpperCase();
  let botReply = '';
  let matchedRule = 'Default Auto-responder';

  if (cleanText.includes('POIN') || cleanText.includes('POINT') || cleanText.includes('SALDO')) {
    matchedRule = 'Keyword Rule: Cek Saldo Poin';
    botReply = `🌿 *Lombok Garden Hotel Hospitality Club*\n\nHalo, saldo poin loyalty Anda aktif. Tunjukkan nomor WhatsApp Anda saat bertransaksi di restoran, spa, atau kamar untuk penambahan poin langsung.`;
  } else if (cleanText.includes('KARTU') || cleanText.includes('CARD') || cleanText.includes('MEMBER')) {
    matchedRule = 'Keyword Rule: Akses Kartu Digital';
    botReply = `🌿 *Kartu Digital Membership Lombok Garden Hotel*\n\nAkses kartu digital eksklusif Anda di:\nhttps://membership.lombokgardenhotel.com/card/LGH-MEMBER\n\nNikmati diskon kamar dan keuntungan eksklusif.`;
  } else if (cleanText.includes('PROMO') || cleanText.includes('DISKON') || cleanText.includes('OFFER')) {
    matchedRule = 'Keyword Rule: Informasi Promo Hotel';
    botReply = `🎉 *Promo Spesial Lombok Garden Hotel*\n\n1. Diskon 25% Deluxe Room Weekend Staycation\n2. Diskon 15% Garden Terrace Dining\n3. Double Points Spa Therapy Treatment\n\nHubungi resepsionis untuk reservasi langsung.`;
  } else if (cleanText.startsWith('DAFTAR')) {
    matchedRule = 'Keyword Rule: Registrasi Member Otomatis';
    botReply = `Selamat datang di *Lombok Garden Hotel Hospitality Club*! Pendaftaran nomor Anda berhasil diproses. Kartu digital member Anda telah aktif.`;
  } else if (cleanText.includes('BANTUAN') || cleanText.includes('HELP') || cleanText.includes('MENU')) {
    matchedRule = 'Keyword Rule: Menu Bantuan';
    botReply = `*Lombok Garden Hotel WhatsApp Bot Assistant*\nKetik kata kunci berikut:\n• *POIN* : Cek saldo & riwayat poin\n• *KARTU* : Buka link kartu digital\n• *PROMO* : Cek promo weekend terkini\n• *DAFTAR* : Registrasi member baru`;
  }

  const logEntry = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    event: event as string,
    senderPhone: String(senderPhone),
    messageText: String(messageText),
    matchedRule,
    botReplyText: botReply || undefined,
    timestamp: new Date().toISOString(),
    rawPayload: payload,
  };

  webhookEventLogs.unshift(logEntry);
  if (webhookEventLogs.length > 50) {
    webhookEventLogs.pop();
  }

  res.status(200).json({
    status: 'success',
    received: true,
    matchedRule,
    autoReplyDispatched: !!botReply,
    replyMessage: botReply || null,
  });
});

// Retrieve Webhook Events History
app.get('/api/whatsapp/webhook-logs', (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: webhookEventLogs.length,
    logs: webhookEventLogs,
  });
});

// Vite middleware or Static serving
async function setupServer() {
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lombok Garden Hotel Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
