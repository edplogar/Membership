import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Lock,
  Sparkles,
  Settings,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  Sliders,
  Send,
  Smartphone,
  Save,
  QrCode,
  Key,
  RefreshCw,
  Activity,
  Globe,
  ExternalLink,
  Copy,
} from 'lucide-react';
import {
  sendWhatsAppMessageViaPing,
  testPingConnection,
  normalizeIndonesianPhone,
} from '../../services/pingWhatsAppService';
import { QRCodeView } from '../common/QRCodeView';

interface SuperAdminControlCenterProps {
  onNavigate: (tab: string) => void;
}

export const SuperAdminControlCenter: React.FC<SuperAdminControlCenterProps> = ({
  onNavigate,
}) => {
  const {
    members,
    rules,
    whatsappConfig,
    updateWhatsAppConfig,
    addWhatsAppLog,
  } = useApp();
  const { showToast } = useToast();

  // Local state for ping.co.id settings in Control Center
  const [apiKey, setApiKey] = useState(whatsappConfig.apiKey || 'ping_live_8912734190abcdef88912');
  const [apiUrl, setApiUrl] = useState(whatsappConfig.apiUrl || 'https://api.ping.co.id/v1');
  const [senderPhone, setSenderPhone] = useState(whatsappConfig.senderPhone || '+62 812-370-112');
  const [deviceId, setDeviceId] = useState(whatsappConfig.deviceId || 'lgh_bot_device_01');
  const [deviceName, setDeviceName] = useState(whatsappConfig.deviceName || 'Lombok Garden Hotel CRM Bot');
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);

  // Diagnostic state
  const [isVerifyingPing, setIsVerifyingPing] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  // Direct quick message test state
  const [quickTestPhone, setQuickTestPhone] = useState('+62 812-3456-7890');
  const [quickTestTrigger, setQuickTestTrigger] = useState<'standard' | 'member_input' | 'points_earned' | 'card_info'>('standard');
  const [quickTestFeedback, setQuickTestFeedback] = useState<{
    status: string;
    isLive?: boolean;
    notice?: string;
    recommendation?: string;
  } | null>(null);
  const [isSendingQuickTest, setIsSendingQuickTest] = useState(false);

  const normalizedTestPhone = normalizeIndonesianPhone(quickTestPhone);

  const handleVerifyAndSavePingConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingPing(true);
    setVerifyMessage(null);

    const updatedConfig = {
      ...whatsappConfig,
      apiKey,
      apiUrl,
      senderPhone,
      deviceId,
      deviceName,
    };

    const diag = await testPingConnection(updatedConfig);
    setIsVerifyingPing(false);

    if (diag.success) {
      updateWhatsAppConfig({
        apiKey,
        apiUrl,
        senderPhone,
        deviceId,
        deviceName,
        deviceStatus: 'connected',
        messageQuota: diag.quotaRemaining,
      });
      setVerifyMessage(diag.message);
      showToast('Pengaturan ping.co.id terverifikasi dan disimpan ke Cloud Firestore!', 'success');
      setTimeout(() => setShowQuickSettings(false), 1200);
    } else {
      showToast(diag.message, 'error');
      setVerifyMessage(diag.message);
    }
  };

  const handleToggleAuto = (key: 'autoSendWelcomeCard' | 'autoSendPointUpdate' | 'autoSendTierUpgrade' | 'autoSendVouchers') => {
    const newVal = !whatsappConfig[key];
    updateWhatsAppConfig({ [key]: newVal });
    showToast(`Otomatisasi ${key.replace('autoSend', '')} ${newVal ? 'diaktifkan' : 'dinonaktifkan'}.`, 'info');
  };

  const handleSendQuickTest = async () => {
    if (!quickTestPhone.trim()) {
      showToast('Nomor WhatsApp tujuan wajib diisi', 'error');
      return;
    }

    setIsSendingQuickTest(true);
    setQuickTestFeedback(null);

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://membership.lombokgardenhotel.com';
    let message = '🌿 *Tes Gateway ping.co.id Berhasil!*\n\nSistem CRM WhatsApp Lombok Garden Hotel telah terhubung ke cloud database Firestore secara real-time.';
    let type: 'welcome' | 'point_update' | 'tier_upgrade' | 'voucher' | 'broadcast' | 'chat' = 'chat';

    if (quickTestTrigger === 'member_input') {
      type = 'welcome';
      message = `Halo *Bpk. Rahmat Hidayat*, selamat bergabung di *Lombok Garden Hotel Hospitality Club*! 🌿🏨\n\nNomor Member: *LGH-001089*\nTier: *Classic*\n\nAkses kartu digital eksklusif Anda di:\n${origin}/card/LGH-001089\n\nTunjukkan kartu digital ini saat check-in atau bersantap untuk diskon khusus dan perolehan poin loyalitas.`;
    } else if (quickTestTrigger === 'points_earned') {
      type = 'point_update';
      message = `Halo *Bpk. Rahmat Hidayat*,\n\nTransaksi Anda sebesar *Rp 1.500.000* di Lombok Garden Hotel telah berhasil! 🎉\n\n+*150 Poin* telah ditambahkan ke akun Anda.\nTotal Saldo Poin Saat Ini: *850 Poin*.\n\nTerima kasih atas kunjungan Anda!`;
    } else if (quickTestTrigger === 'card_info') {
      type = 'chat';
      message = `Halo *Bpk. Rahmat Hidayat*,\n\nBerikut link akses kartu digital eksklusif Lombok Garden Hotel Anda:\n${origin}/card/LGH-001089\n\nTunjukkan barcode/QR pada kartu ini saat bertransaksi di kamar, restoran, dan spa untuk diskon langsung & perolehan poin!`;
    }

    try {
      const log = await sendWhatsAppMessageViaPing(
        quickTestPhone,
        'Tamu VIP Lombok Garden Hotel',
        message,
        type,
        whatsappConfig
      );
      addWhatsAppLog(log);
      setQuickTestFeedback({
        status: log.status,
        isLive: log.isLiveGateway,
        notice: log.diagnostics?.notice as string,
        recommendation: log.diagnostics?.recommendation as string,
      });
      showToast(`Pesan uji berhasil dikirim ke ${log.recipientPhone} via ping.co.id`, 'success');
    } catch {
      showToast('Gagal mengirim pesan uji', 'error');
    } finally {
      setIsSendingQuickTest(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xs uppercase tracking-widest text-amber-400 font-bold">
                Lombok Garden Hotel
              </span>
              <span className="text-stone-500">·</span>
              <span className="text-xs text-stone-300 font-medium">Control Center</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
              Pusat Kendali Sistem Membership
            </h1>
            <p className="text-stone-300 text-sm max-w-xl leading-relaxed">
              Kelola membership tamu hotel, otomatisasi tier loyalty, integrasi WhatsApp CRM ping.co.id, dan hak akses staf dalam satu dasbor terpadu.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 bg-stone-800/80 backdrop-blur-md rounded-2xl border border-stone-700/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-stone-400 font-medium">Cloud Database</div>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Firestore Real-Time Sync</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Section: Pengaturan WhatsApp CRM ping.co.id di Control Center */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-stone-900 rounded-3xl p-6 sm:p-7 text-white shadow-md border border-emerald-800/50 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight">
                  Integrasi Akun WhatsApp ping.co.id
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Ready & Connected
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Konfigurasi API gateway, nomor bot hotel, dan sakelar otomatisasi pesan WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickSettings(!showQuickSettings)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-emerald-300" />
              <span>{showQuickSettings ? 'Tutup Pengaturan' : 'Kredensial Akun ping.co.id'}</span>
            </button>

            <button
              onClick={() => onNavigate('super_whatsapp')}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span>Buka Dasbor CRM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Quick Settings Form */}
        {showQuickSettings ? (
          <form onSubmit={handleVerifyAndSavePingConfig} className="bg-stone-900/90 backdrop-blur-md rounded-2xl p-5 border border-emerald-600/30 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                <Key className="w-4 h-4" />
                <span>Pengaturan Kredensial ping.co.id</span>
              </div>
              <a
                href="https://ping.co.id"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Buka Portal ping.co.id</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  ping.co.id API Secret Token
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="ping_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Nomor WhatsApp Pengirim
                </label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="+62 812-xxxx-xxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Device Session / Instance ID
                </label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="lgh_bot_device_01"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Webhook Callback Info Row */}
            <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Globe className="w-4 h-4" />
                  <span>Webhook Callback URL (Untuk Menu "Rule / Aturan Webhook" di ping.co.id):</span>
                </div>
                <div className="font-mono text-[11px] text-stone-300 break-all select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : 'https://membership.lombokgardenhotel.com/api/whatsapp/webhook'}
                </div>
                <p className="text-[10px] text-stone-400">
                  💡 Notifikasi otomatis hotel (Welcome Card, Saldo Poin, Naik Tier) <strong>sudah 100% aktif via API</strong> tanpa wajib webhook.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const url = typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : 'https://membership.lombokgardenhotel.com/api/whatsapp/webhook';
                    navigator.clipboard.writeText(url);
                    showToast('URL Webhook berhasil disalin!', 'success');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Salin URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('super_whatsapp')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Panduan Lengkap Webhook</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {verifyMessage && (
              <div className="p-3 bg-stone-950/80 rounded-xl border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{verifyMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowQuickSettings(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-300 hover:text-white transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isVerifyingPing}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                {isVerifyingPing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Token...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Verifikasi & Simpan ke Cloud</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : null}

        {/* 4 Key Feature Automations & Quick Live Tester */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left 7 Cols: Quick Automations Switchers */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Auto 1: Welcome Card */}
            <div
              onClick={() => handleToggleAuto('autoSendWelcomeCard')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                whatsappConfig.autoSendWelcomeCard
                  ? 'bg-emerald-800/40 border-emerald-500/50 hover:bg-emerald-800/60'
                  : 'bg-stone-900/60 border-stone-700/50 hover:bg-stone-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white">1. Kartu Member Baru</div>
                  <div className="text-[11px] text-emerald-200/70 mt-0.5 leading-snug">
                    Kirim otomatis kartu digital saat member baru terdaftar
                  </div>
                </div>
                <div className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${whatsappConfig.autoSendWelcomeCard ? 'bg-emerald-500' : 'bg-stone-600'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${whatsappConfig.autoSendWelcomeCard ? 'translate-x-3.5' : 'translate-x-0'}`} />
                </div>
              </div>
              <div className="mt-3 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{whatsappConfig.autoSendWelcomeCard ? 'Aktif (Auto Trigger)' : 'Nonaktif'}</span>
              </div>
            </div>

            {/* Auto 2: Point Updates */}
            <div
              onClick={() => handleToggleAuto('autoSendPointUpdate')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                whatsappConfig.autoSendPointUpdate
                  ? 'bg-emerald-800/40 border-emerald-500/50 hover:bg-emerald-800/60'
                  : 'bg-stone-900/60 border-stone-700/50 hover:bg-stone-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white">2. Info Tambah Poin</div>
                  <div className="text-[11px] text-emerald-200/70 mt-0.5 leading-snug">
                    Notifikasi saldo poin instan setiap transaksi billing hotel
                  </div>
                </div>
                <div className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${whatsappConfig.autoSendPointUpdate ? 'bg-emerald-500' : 'bg-stone-600'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${whatsappConfig.autoSendPointUpdate ? 'translate-x-3.5' : 'translate-x-0'}`} />
                </div>
              </div>
              <div className="mt-3 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{whatsappConfig.autoSendPointUpdate ? 'Aktif (Auto Trigger)' : 'Nonaktif'}</span>
              </div>
            </div>

            {/* Auto 3: Tier Upgrades */}
            <div
              onClick={() => handleToggleAuto('autoSendTierUpgrade')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                whatsappConfig.autoSendTierUpgrade
                  ? 'bg-emerald-800/40 border-emerald-500/50 hover:bg-emerald-800/60'
                  : 'bg-stone-900/60 border-stone-700/50 hover:bg-stone-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white">3. Ucapan Naik Tier</div>
                  <div className="text-[11px] text-emerald-200/70 mt-0.5 leading-snug">
                    Kirim rincian keuntungan baru saat tamu naik level tier
                  </div>
                </div>
                <div className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${whatsappConfig.autoSendTierUpgrade ? 'bg-emerald-500' : 'bg-stone-600'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${whatsappConfig.autoSendTierUpgrade ? 'translate-x-3.5' : 'translate-x-0'}`} />
                </div>
              </div>
              <div className="mt-3 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{whatsappConfig.autoSendTierUpgrade ? 'Aktif (Auto Trigger)' : 'Nonaktif'}</span>
              </div>
            </div>

            {/* Auto 4: Vouchers & Rewards */}
            <div
              onClick={() => handleToggleAuto('autoSendVouchers')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                whatsappConfig.autoSendVouchers
                  ? 'bg-emerald-800/40 border-emerald-500/50 hover:bg-emerald-800/60'
                  : 'bg-stone-900/60 border-stone-700/50 hover:bg-stone-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white">4. Kode Voucher & Hadiah</div>
                  <div className="text-[11px] text-emerald-200/70 mt-0.5 leading-snug">
                    Kirim voucher promo & bukti reward yang ditukar tamu
                  </div>
                </div>
                <div className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${whatsappConfig.autoSendVouchers ? 'bg-emerald-500' : 'bg-stone-600'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${whatsappConfig.autoSendVouchers ? 'translate-x-3.5' : 'translate-x-0'}`} />
                </div>
              </div>
              <div className="mt-3 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{whatsappConfig.autoSendVouchers ? 'Aktif (Auto Trigger)' : 'Nonaktif'}</span>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Quick Live Ping Tester */}
          <div className="lg:col-span-5 bg-stone-900/90 rounded-2xl p-4.5 border border-white/10 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs text-white">Uji Langsung Gateway ping.co.id</span>
              </div>
              <button
                onClick={() => setShowPairingModal(!showPairingModal)}
                className="text-[11px] text-emerald-300 hover:text-emerald-200 underline font-medium cursor-pointer"
              >
                QR Linked Device
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="block text-[10px] text-stone-400 font-medium">
                  Pilih Format Pesan / Trigger yang Diuji:
                </label>
                <select
                  value={quickTestTrigger}
                  onChange={(e) => setQuickTestTrigger(e.target.value as 'standard' | 'member_input' | 'points_earned' | 'card_info')}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-700 text-xs text-stone-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="standard">Pesan Uji Standar (Koneksi Gateway)</option>
                  <option value="member_input">Trigger 1: Member Baru (Welcome Card & Link)</option>
                  <option value="points_earned">Trigger 2: Penambahan Point Transaksi (+150 Pts)</option>
                  <option value="card_info">Trigger 3: Info Kartu Digital Tamu</option>
                </select>
              </div>

              <label className="block text-[11px] text-stone-300 font-medium">
                Nomor WhatsApp Tujuan (08xx atau +62xx):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickTestPhone}
                  onChange={(e) => setQuickTestPhone(e.target.value)}
                  placeholder="0812xxxx atau +62812xxxx"
                  className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleSendQuickTest}
                  disabled={isSendingQuickTest}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isSendingQuickTest ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Test Kirim</span>
                </button>
              </div>
              {normalizedTestPhone.formatted && (
                <div className="text-[10px] text-emerald-400 font-mono">
                  Tujuan: {normalizedTestPhone.formatted}
                </div>
              )}

              {quickTestFeedback && (
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-[11px] font-mono space-y-1 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>Status: {quickTestFeedback.status}</span>
                    <span className="text-stone-400 text-[10px]">{quickTestFeedback.isLive ? 'Live ping.co.id' : 'Log Tercatat'}</span>
                  </div>
                  {quickTestFeedback.notice && (
                    <div className="text-amber-300 text-[10px] leading-tight">
                      {quickTestFeedback.notice}
                    </div>
                  )}
                  {quickTestFeedback.recommendation && (
                    <div className="text-emerald-300 text-[10px] leading-tight">
                      💡 {quickTestFeedback.recommendation}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-[11px] text-stone-400 flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pengirim: <strong>{whatsappConfig.senderPhone}</strong> ({whatsappConfig.deviceName})</span>
            </div>

            {showPairingModal && (
              <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 flex flex-col items-center text-center space-y-2 animate-in fade-in duration-150">
                <div className="p-2 bg-white rounded-lg">
                  <QRCodeView value={`PING-DEVICE-PAIR:${senderPhone}:${deviceId}:${Date.now()}`} size={120} />
                </div>
                <div className="text-[10px] text-stone-400">
                  Scan QR via WhatsApp di HP hotel: Perangkat Tertaut (Linked Devices)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Action Grid */}
      <div className="space-y-4 pt-2">
        <h2 className="font-serif font-bold text-base text-stone-900">
          Modul & Pengaturan Sistem Lainnya
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. WhatsApp CRM ping.co.id Tab Direct Link */}
          <div
            onClick={() => onNavigate('super_whatsapp')}
            className="p-5 bg-white rounded-2xl border-2 border-emerald-700/30 hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 group-hover:text-emerald-900 transition-colors flex items-center justify-between">
                <span>WhatsApp CRM & Broadcast</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Broadcast promo massal member, edit template pesan, dan lihat riwayat log pengiriman.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-emerald-800 font-semibold">
              <span>Integrasi ping.co.id Aktif</span>
              <span>Buka Dasbor Lengkap →</span>
            </div>
          </div>

          {/* 2. Tier & Dynamic Rule Engine */}
          <div
            onClick={() => onNavigate('admin_tiers')}
            className="p-5 bg-white rounded-2xl border border-stone-200 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 group-hover:text-amber-900 transition-colors flex items-center justify-between">
                <span>Tier & Dynamic Rule Engine</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Atur level membership (Member, Silver, Gold, Platinum) dan formula otomatis upgrade berdasarkan spending & stay.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-medium">
              <span>{rules.length} Aturan Evaluasi</span>
              <span className="text-amber-700 font-semibold">Konfigurasi →</span>
            </div>
          </div>

          {/* 3. Staf & Akun Administrator */}
          <div
            onClick={() => onNavigate('super_admins')}
            className="p-5 bg-white rounded-2xl border border-stone-200 hover:border-stone-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 group-hover:text-stone-950 transition-colors flex items-center justify-between">
                <span>Kelola Staf & Admin</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Tambah atau edit akun staf hotel, Front Office, dan manajemen dengan peran yang terisolasi.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-medium">
              <span>Multi-User Access</span>
              <span className="text-stone-800 font-semibold">Kelola Staf →</span>
            </div>
          </div>

          {/* 4. Matriks Hak Akses (RBAC) */}
          <div
            onClick={() => onNavigate('super_roles')}
            className="p-5 bg-white rounded-2xl border border-stone-200 hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 group-hover:text-emerald-900 transition-colors flex items-center justify-between">
                <span>Hak Akses & Izin (RBAC)</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Atur wewenang operasional untuk setiap peran staf secara granular.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-medium">
              <span>Keamanan Terisolasi</span>
              <span className="text-emerald-800 font-semibold">Matriks Izin →</span>
            </div>
          </div>

          {/* 5. Kelola Member & Kartu Tamu */}
          <div
            onClick={() => onNavigate('admin_members')}
            className="p-5 bg-white rounded-2xl border border-stone-200 hover:border-stone-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 group-hover:text-blue-900 transition-colors flex items-center justify-between">
                <span>Database Member Tamu</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Lihat direktori tamu terdaftar, riwayat reservasi kamar, transaksi F&B/Spa, dan saldo poin.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-medium">
              <span>{members.length} Member Terdaftar</span>
              <span className="text-blue-700 font-semibold">Buka Direktori →</span>
            </div>
          </div>

          {/* 6. Pengaturan Global Hotel */}
          <div
            onClick={() => onNavigate('super_settings')}
            className="p-5 bg-white rounded-2xl border border-stone-200 hover:border-purple-600 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 group-hover:text-purple-900 transition-colors flex items-center justify-between">
                <span>Pengaturan Global Properti</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Informasi hotel, masa berlaku kartu member, kontak bantuan, dan preferensi umum.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-medium">
              <span>Lombok Garden Hotel</span>
              <span className="text-purple-700 font-semibold">Buka Pengaturan →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
