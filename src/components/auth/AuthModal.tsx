import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { LombokGardenLogo } from '../common/LombokGardenLogo';
import { signInWithGoogleAccount } from '../../services/firebase';
import { Lock, Mail, User, Phone, CheckCircle2, AlertCircle, Copy, ExternalLink, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const { login, loginWithGoogle } = useAuth();
  const { addMember } = useApp();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(defaultMode);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Register form state
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '1995-05-15',
    gender: 'L' as 'L' | 'P',
    address: 'Mataram, Lombok',
    city: 'Mataram',
    province: 'Nusa Tenggara Barat',
    country: 'Indonesia',
    idCardNumber: '',
    password: '',
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Harap masukkan email dan kata sandi Anda.');
      return;
    }

    const success = login(loginEmail.trim(), loginPassword);
    if (success) {
      showToast('Berhasil masuk ke sistem Lombok Garden Hotel!', 'success');
      onClose();
    } else {
      setErrorMessage('Email atau kata sandi tidak cocok. Silakan periksa kembali akun Anda.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setUnauthorizedDomain(null);
    setIsGoogleLoading(true);

    try {
      const res = await signInWithGoogleAccount();
      if (res.success && res.user && res.user.email) {
        const loggedIn = loginWithGoogle(
          res.user.email,
          res.user.displayName || undefined,
          res.user.photoURL || undefined
        );

        if (loggedIn) {
          showToast(`Verifikasi Google berhasil! Selamat datang, ${res.user.displayName || res.user.email}`, 'success');
          onClose();
        } else {
          setErrorMessage('Akun Google berhasil diverifikasi namun status akun tidak aktif.');
        }
      } else {
        if (res.isUnauthorizedDomain) {
          setUnauthorizedDomain(res.domain || window.location.hostname);
        }
        setErrorMessage(res.error || 'Verifikasi akun Google dibatalkan atau gagal.');
      }
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : String(err);
      if (errText.toLowerCase().includes('unauthorized domain')) {
        setUnauthorizedDomain(window.location.hostname);
      }
      setErrorMessage(`Kendala autentikasi Google: ${errText}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleCopyDomain = () => {
    const domain = unauthorizedDomain || window.location.hostname;
    navigator.clipboard.writeText(domain);
    setCopiedDomain(true);
    showToast(`Domain "${domain}" berhasil disalin!`, 'success');
    setTimeout(() => setCopiedDomain(false), 2500);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!regForm.fullName || !regForm.email || !regForm.phone) {
      setErrorMessage('Harap lengkapi nama lengkap, email, dan nomor WhatsApp.');
      return;
    }

    const now = new Date().toISOString().slice(0, 10);
    const end = new Date(Date.now() + 24 * 30 * 86400000).toISOString().slice(0, 10);

    const newMember = addMember({
      fullName: regForm.fullName.trim(),
      nickname: regForm.fullName.trim().split(' ')[0],
      email: regForm.email.trim().toLowerCase(),
      phone: regForm.phone.trim(),
      gender: regForm.gender,
      birthDate: regForm.birthDate,
      address: regForm.address,
      city: regForm.city,
      province: regForm.province,
      country: regForm.country,
      idCardNumber: regForm.idCardNumber || '5201000000000000',
      tierId: 'tier_member',
      registrationDate: now,
      membershipStartDate: now,
      membershipEndDate: end,
      referralCode: `${regForm.fullName.slice(0, 4).toUpperCase()}-LGH`,
      status: 'ACTIVE',
      internalNotes: 'Pendaftaran mandiri melalui portal web.',
    });

    login(newMember.email);
    showToast('Registrasi berhasil! Selamat bergabung di Lombok Garden Hotel.', 'success');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="md"
    >
      <div className="space-y-5 -mt-2">
        {/* Official Brand Header */}
        <div className="flex flex-col items-center text-center pb-3 border-b border-stone-100">
          <LombokGardenLogo variant="vertical" size="md" />
          <h3 className="font-serif text-lg font-bold text-stone-900 mt-2">
            {mode === 'login' && 'Masuk ke Portal Keanggotaan'}
            {mode === 'register' && 'Pendaftaran Member Baru'}
            {mode === 'forgot' && 'Pemulihan Kata Sandi'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mt-0.5">
            {mode === 'login' && 'Masukkan kredensial akun Anda atau gunakan verifikasi Akun Google.'}
            {mode === 'register' && 'Daftar gratis untuk menikmati diskon kamar dan poin reward istimewa.'}
            {mode === 'forgot' && 'Masukkan email terdaftar untuk menerima instruksi reset.'}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div>{errorMessage}</div>
              {unauthorizedDomain && (
                <div className="mt-2 pt-2 border-t border-rose-200 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyDomain}
                    className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-md text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDomain ? 'Tersalin!' : `Salin: ${unauthorizedDomain}`}</span>
                  </button>
                  <a
                    href="https://console.firebase.google.com/project/studious-ally-rmn89/authentication/settings"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-md text-[10px] font-bold inline-flex items-center gap-1"
                  >
                    <span>Firebase Authorized Domains</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <div className="space-y-4">
            {/* Google Verification */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Memverifikasi Google...' : 'Verifikasi dengan Akun Google'}</span>
            </button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-white px-2.5 text-stone-400">atau email & sandi</span>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] text-[#00A651] hover:underline"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#00A651] hover:bg-[#009647] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Masuk ke Akun
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-stone-600">
              Belum memiliki akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
                className="font-bold text-[#00A651] hover:underline cursor-pointer"
              >
                Daftar Member Baru
              </button>
            </div>
          </div>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                value={regForm.fullName}
                onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                placeholder="Sesuai KTP / Paspor"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="nama@email.com"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  WhatsApp *
                </label>
                <input
                  type="text"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  placeholder="0812xxxx"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#00A651] hover:bg-[#009647] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              Daftar & Dapatkan Kartu Digital
            </button>

            <div className="text-center text-xs text-stone-600">
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className="font-bold text-[#00A651] hover:underline cursor-pointer"
              >
                Masuk di sini
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <div className="space-y-3.5 text-center">
            <p className="text-xs text-stone-600">
              Silakan hubungi Front Desk di <strong>(0370) 636015</strong> atau masukkan email Anda untuk bantuan reset kredensial.
            </p>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className="w-full py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold cursor-pointer"
            >
              Kembali ke Login
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
