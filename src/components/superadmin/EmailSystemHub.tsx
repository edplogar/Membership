import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { EmailSystemConfig } from '../../types';
import { formatDateIndo } from '../../services/membershipEngine';
import {
  Mail,
  Send,
  Settings,
  Server,
  Key,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  FileText,
  Clock,
  ExternalLink,
  Sparkles,
  Save,
  Check,
  UserCheck,
} from 'lucide-react';

interface EmailSystemHubProps {
  onNavigate?: (tab: string) => void;
}

export const EmailSystemHub: React.FC<EmailSystemHubProps> = ({ onNavigate }) => {
  const {
    emailConfig,
    emailLogs,
    updateEmailConfig,
    sendTestEmailToRecipient,
    members,
    tiers,
  } = useApp();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'settings' | 'test' | 'templates' | 'logs'>('settings');

  // Form State for Email Settings
  const [formConfig, setFormConfig] = useState<EmailSystemConfig>({ ...emailConfig });

  // Test connection state
  const [testEmail, setTestEmail] = useState('edp.logar@gmail.com');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    responseTimeMs?: number;
  } | null>(null);

  // Template preview mode
  const [previewTemplate, setPreviewTemplate] = useState<'welcome' | 'reset'>('welcome');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmailConfig(formConfig);
  };

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) {
      showToast('Alamat email penerima uji coba wajib diisi.', 'error');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const startTime = Date.now();
    const result = await sendTestEmailToRecipient(testEmail.trim());
    const duration = Date.now() - startTime;

    setIsTesting(false);
    setTestResult({
      success: result.success,
      message: result.message,
      responseTimeMs: duration,
    });
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Super Admin Control
            </span>
            <span className="text-xs text-stone-400">·</span>
            <span className="text-xs text-stone-500 font-mono">SMTP & Email Gateway</span>
          </div>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            Pusat Pengaturan Email & Reset Password
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Konfigurasi default email pengirim resmi, server SMTP, pengiriman otomatis email registrasi member baru, dan pemulihan kata sandi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('test')}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-emerald-700" />
            <span>Uji Coba Kirim Email</span>
          </button>

          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-[#00A651] hover:bg-[#008F45] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 text-xs font-semibold overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Pengaturan Email & SMTP</span>
        </button>

        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'test'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Uji Coba Koneksi</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Template & Desain Email</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Riwayat Pengiriman ({emailLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Section A: Sender Identity */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <Mail className="w-4 h-4 text-[#00A651]" />
              <h3 className="font-bold text-sm text-stone-900">
                Identitas Default Email Pengirim (Sender Identity)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Default Email Pengirim Resmi *
                </label>
                <input
                  type="email"
                  value={formConfig.defaultSenderEmail}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, defaultSenderEmail: e.target.value })
                  }
                  placeholder="membership@lombokgardenhotel.com atau edp.logar@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                  required
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Alamat email yang akan muncul sebagai pengirim (From Address) pada email member baru dan reset password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Tampilan Pengirim (Sender Display Name) *
                </label>
                <input
                  type="text"
                  value={formConfig.defaultSenderName}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, defaultSenderName: e.target.value })
                  }
                  placeholder="Lombok Garden Hotel Concierge"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Alamat Balasan (Reply-To Email)
                </label>
                <input
                  type="email"
                  value={formConfig.replyToEmail}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, replyToEmail: e.target.value })
                  }
                  placeholder="guestservice@lombokgardenhotel.com"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:border-[#00A651]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Penyedia Layanan (Service Provider)
                </label>
                <select
                  value={formConfig.provider}
                  onChange={(e: any) =>
                    setFormConfig({ ...formConfig, provider: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-[#00A651]"
                >
                  <option value="smtp">Custom SMTP Server (Direct)</option>
                  <option value="gmail">Google Gmail SMTP / Workspace</option>
                  <option value="sendgrid">SendGrid API / SMTP</option>
                  <option value="resend">Resend / Mailgun</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section B: SMTP Server Configuration */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <Server className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-sm text-stone-900">
                Konfigurasi Server SMTP & Kredensial Otentikasi
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  SMTP Host Server *
                </label>
                <input
                  type="text"
                  value={formConfig.smtpHost}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, smtpHost: e.target.value })
                  }
                  placeholder="smtp.gmail.com atau mail.lombokgardenhotel.com"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:border-[#00A651]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  SMTP Port *
                </label>
                <input
                  type="number"
                  value={formConfig.smtpPort}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, smtpPort: parseInt(e.target.value) || 587 })
                  }
                  placeholder="587 / 465"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:border-[#00A651]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  SMTP Username / Email Akun *
                </label>
                <input
                  type="text"
                  value={formConfig.smtpUser}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, smtpUser: e.target.value })
                  }
                  placeholder="edp.logar@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:border-[#00A651]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  SMTP Password / App Password
                </label>
                <input
                  type="password"
                  value={formConfig.smtpPassword || ''}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, smtpPassword: e.target.value })
                  }
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:border-[#00A651]"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Untuk Gmail, gunakan <em>16-digit App Password</em> dari Google Account Security.
                </p>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                  <input
                    type="checkbox"
                    checked={formConfig.smtpSecure}
                    onChange={(e) =>
                      setFormConfig({ ...formConfig, smtpSecure: e.target.checked })
                    }
                    className="w-4 h-4 text-[#00A651] rounded focus:ring-[#00A651]/20"
                  />
                  <span>Gunakan Koneksi Aman SSL/TLS (Port 465)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section C: Automation Triggers */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-stone-900">
                Pemicu Otomatisasi Pengiriman Email
              </h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/60 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={formConfig.autoSendWelcomeEmail}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      autoSendWelcomeEmail: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-[#00A651] rounded focus:ring-[#00A651]/20 mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-stone-900">
                    Kirim Email Sambutan & Kartu Digital Otomatis saat Member Baru Terdaftar
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Setiap kali member baru mendaftar (mandiri atau didaftarkan staf), sistem langsung mengirimkan kartu keanggotaan digital dan mengonfirmasi email terdaftar sebagai syarat login & reset password.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/60 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={formConfig.autoSendPasswordResetEmail}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      autoSendPasswordResetEmail: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-[#00A651] rounded focus:ring-[#00A651]/20 mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-stone-900">
                    Aktifkan Layanan Pengiriman Tautan & OTP Reset Kata Sandi via Email Terdaftar
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Mengirimkan instruksi pemulihan aman dengan token 60 menit dan kode OTP ke alamat email terdaftar member saat meminta reset kata sandi.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-[#00A651] hover:bg-[#008F45] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Terapkan Konfigurasi Email</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: TEST CONNECTION */}
      {activeTab === 'test' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <Send className="w-4 h-4 text-[#00A651]" />
                <h3 className="font-bold text-sm text-stone-900">
                  Uji Coba Pengiriman Email Verifikasi
                </h3>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                Kirimkan email uji coba untuk memverifikasi bahwa konfigurasi email pengirim default <strong>{emailConfig.defaultSenderEmail}</strong> dan server SMTP <strong>{emailConfig.smtpHost}:{emailConfig.smtpPort}</strong> dapat menjangkau kotak masuk member dengan lancar.
              </p>

              <form onSubmit={handleRunTest} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Alamat Email Tujuan Uji Coba *
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="edp.logar@gmail.com atau email Anda"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isTesting}
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Menghubungi Server SMTP & Mengirim Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span>Kirim Email Verifikasi Sekarang</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Test Result Feedback */}
            {testResult && (
              <div
                className={`p-5 rounded-2xl border shadow-xs animate-in fade-in duration-200 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-start gap-3">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1.5 flex-1">
                    <div className="font-bold text-sm">
                      {testResult.success ? 'Hasil Pengujian: Berhasil' : 'Hasil Pengujian: Gagal'}
                    </div>
                    <div className="text-xs leading-relaxed opacity-90">
                      {testResult.message}
                    </div>
                    {testResult.responseTimeMs && (
                      <div className="text-[11px] font-mono opacity-75 pt-1">
                        Waktu Respons: {testResult.responseTimeMs} ms
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Configuration Summary Card */}
          <div className="lg:col-span-6">
            <div className="p-6 bg-gradient-to-br from-[#072417] via-[#0A3320] to-[#04160E] text-white rounded-2xl border border-[#0E4029] shadow-md space-y-4">
              <div className="text-[10px] font-mono text-[#C5A869] uppercase tracking-widest font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A869] animate-pulse" />
                STATUS GATEWAY EMAIL AKTIF
              </div>

              <div>
                <div className="text-xs text-emerald-200/80">Default Sender Address:</div>
                <div className="font-mono text-base font-bold text-white mt-0.5">
                  {emailConfig.defaultSenderEmail}
                </div>
                <div className="text-xs text-emerald-300/90 font-medium">
                  {emailConfig.defaultSenderName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-900/80 text-xs">
                <div>
                  <span className="text-emerald-300/70 text-[11px]">SMTP Host:</span>
                  <div className="font-mono text-white font-bold">{emailConfig.smtpHost}</div>
                </div>
                <div>
                  <span className="text-emerald-300/70 text-[11px]">Port:</span>
                  <div className="font-mono text-white font-bold">{emailConfig.smtpPort}</div>
                </div>
                <div>
                  <span className="text-emerald-300/70 text-[11px]">User:</span>
                  <div className="font-mono text-white font-bold truncate">{emailConfig.smtpUser}</div>
                </div>
                <div>
                  <span className="text-emerald-300/70 text-[11px]">Keamanan:</span>
                  <div className="font-mono text-white font-bold">
                    {emailConfig.smtpSecure ? 'SSL / TLS' : 'STARTTLS (587)'}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-900/80 space-y-1.5 text-xs text-emerald-200/90">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#00A651]" />
                  <span>Email Sambutan Member Baru: <strong>{emailConfig.autoSendWelcomeEmail ? 'Aktif' : 'Nonaktif'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#00A651]" />
                  <span>Reset Password via Email: <strong>{emailConfig.autoSendPasswordResetEmail ? 'Aktif' : 'Nonaktif'}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEMPLATES & PREVIEW */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreviewTemplate('welcome')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                previewTemplate === 'welcome'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              Template 1: Email Sambutan Member Baru & Kartu Digital
            </button>

            <button
              onClick={() => setPreviewTemplate('reset')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                previewTemplate === 'reset'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              Template 2: Instruksi & Kode OTP Reset Kata Sandi
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Template Editor */}
            <div className="lg:col-span-5 p-6 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-stone-900">
                {previewTemplate === 'welcome'
                  ? 'Kustomisasi Teks Email Sambutan'
                  : 'Kustomisasi Teks Email Reset Password'}
              </h3>

              {previewTemplate === 'welcome' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Subjek Email
                    </label>
                    <input
                      type="text"
                      value={formConfig.welcomeSubjectTemplate}
                      onChange={(e) =>
                        setFormConfig({ ...formConfig, welcomeSubjectTemplate: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-[#00A651]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Isi Pesan Dasar (Plain Text)
                    </label>
                    <textarea
                      rows={10}
                      value={formConfig.welcomeBodyTemplate}
                      onChange={(e) =>
                        setFormConfig({ ...formConfig, welcomeBodyTemplate: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-[11px] focus:outline-none focus:border-[#00A651]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Subjek Email
                    </label>
                    <input
                      type="text"
                      value={formConfig.resetSubjectTemplate}
                      onChange={(e) =>
                        setFormConfig({ ...formConfig, resetSubjectTemplate: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-[#00A651]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Isi Pesan Dasar (Plain Text)
                    </label>
                    <textarea
                      rows={10}
                      value={formConfig.resetBodyTemplate}
                      onChange={(e) =>
                        setFormConfig({ ...formConfig, resetBodyTemplate: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-[11px] focus:outline-none focus:border-[#00A651]"
                    />
                  </div>
                </>
              )}

              <div className="pt-2">
                <span className="text-[10px] text-stone-400 font-medium">Variabel yang didukung:</span>
                <div className="flex flex-wrap gap-1 mt-1 text-[10px] font-mono text-stone-600">
                  <span className="px-1.5 py-0.5 rounded bg-stone-100">{'{{fullName}}'}</span>
                  <span className="px-1.5 py-0.5 rounded bg-stone-100">{'{{email}}'}</span>
                  <span className="px-1.5 py-0.5 rounded bg-stone-100">{'{{membershipNumber}}'}</span>
                  <span className="px-1.5 py-0.5 rounded bg-stone-100">{'{{tierName}}'}</span>
                  <span className="px-1.5 py-0.5 rounded bg-stone-100">{'{{cardUrl}}'}</span>
                  <span className="px-1.5 py-0.5 rounded bg-stone-100">{'{{otpCode}}'}</span>
                  <span className="px-1.5 py-0.5 rounded bg-stone-100">{'{{resetUrl}}'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveSettings}
                className="w-full py-2.5 bg-[#00A651] hover:bg-[#008F45] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Simpan Perubahan Template
              </button>
            </div>

            {/* Live Visual Preview */}
            <div className="lg:col-span-7 p-6 bg-stone-100 rounded-2xl border border-stone-300 shadow-inner flex flex-col items-center justify-center">
              <div className="text-xs font-bold text-stone-500 mb-3 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau Tampilan Email di Kotak Masuk Member (HTML Visual)</span>
              </div>

              {/* Mock Email Frame */}
              <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden text-stone-900">
                {/* Email Header */}
                <div className="p-5 bg-gradient-to-br from-[#072417] via-[#0A3320] to-[#04160E] text-white text-center">
                  <div className="inline-block bg-white text-[#072417] px-3 py-1 rounded-lg text-xs font-serif font-bold tracking-wider mb-2">
                    LOMBOK GARDEN HOTEL
                  </div>
                  <div className="text-[10px] text-[#C5A869] font-bold tracking-widest uppercase">
                    Hospitality & Membership
                  </div>
                  <h4 className="font-serif text-base mt-2 font-normal text-white">
                    {previewTemplate === 'welcome'
                      ? 'Selamat Bergabung, Bpk. Rahmat Hidayat'
                      : 'Instruksi Reset Kata Sandi'}
                  </h4>
                </div>

                {/* Email Body */}
                <div className="p-5 space-y-4 text-xs text-stone-700">
                  {previewTemplate === 'welcome' ? (
                    <>
                      <p>
                        Terima kasih telah bergabung di program keanggotaan resmi <strong>Lombok Garden Hotel</strong>. Kartu digital Anda telah aktif:
                      </p>

                      <div className="p-3.5 bg-[#FAF9F5] border border-[#E5DFD3] rounded-xl space-y-2">
                        <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                          <div>
                            <span className="text-[10px] text-stone-500 uppercase">No. Member:</span>
                            <div className="font-mono text-sm font-bold text-[#00A651]">LGH-2024-0012</div>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Gold Tier
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span>Email Terdaftar: <strong>rahmat@gmail.com</strong></span>
                          <span className="text-amber-700 font-bold">+100 Poin</span>
                        </div>
                      </div>

                      <div className="text-center pt-2">
                        <span className="inline-block px-5 py-2.5 bg-[#00A651] text-white font-bold text-xs rounded-xl shadow-xs">
                          Buka Kartu Membership Digital
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>
                        Kami menerima permintaan untuk mereset kata sandi akun member Anda yang terdaftar pada email: <strong>rahmat@gmail.com</strong>.
                      </p>

                      <div className="p-4 bg-[#FAF9F5] border border-[#E5DFD3] rounded-xl text-center space-y-1">
                        <div className="text-[10px] text-stone-500 uppercase font-bold">Kode OTP Verifikasi:</div>
                        <div className="text-2xl font-mono font-bold text-[#00A651] tracking-widest">748921</div>
                        <div className="text-[10px] text-stone-400">Berlaku 60 menit</div>
                      </div>

                      <div className="text-center pt-2">
                        <span className="inline-block px-5 py-2.5 bg-[#00A651] text-white font-bold text-xs rounded-xl shadow-xs">
                          Atur Ulang Kata Sandi Sekarang
                        </span>
                      </div>
                    </>
                  )}

                  <div className="pt-3 border-t border-stone-100 text-[10px] text-stone-400 text-center">
                    Lombok Garden Hotel · Jl. Bung Karno No. 7, Mataram · (0370) 636015
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DISPATCH LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <h3 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
              Log Pengiriman Email Sistem ({emailLogs.length} Pesan)
            </h3>
            <span className="text-[11px] text-stone-500">
              Pengirim: <strong className="font-mono text-stone-700">{emailConfig.defaultSenderEmail}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Waktu</th>
                  <th className="px-5 py-3">Penerima</th>
                  <th className="px-5 py-3">Subjek & Tipe</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Token / OTP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {emailLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-stone-400">
                      Belum ada riwayat pengiriman email tercatat.
                    </td>
                  </tr>
                ) : (
                  emailLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="px-5 py-3 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-bold text-stone-900">{log.recipientName}</div>
                        <div className="font-mono text-[11px] text-emerald-700">{log.recipientEmail}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-stone-800">{log.subject}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[9px] uppercase font-bold font-mono bg-stone-100 text-stone-600">
                          {log.type}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                            log.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-stone-500">
                        {log.otpCode ? `OTP: ${log.otpCode}` : log.resetToken ? 'Token Issued' : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
