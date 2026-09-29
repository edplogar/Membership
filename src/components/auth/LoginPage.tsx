import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { LombokGardenLogo } from '../common/LombokGardenLogo';
import { signInWithGoogleAccount } from '../../services/firebase';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Shield,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
  onExplorePublic?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onExplorePublic }) => {
  const { login, loginWithGoogle } = useAuth();
  const { addMember } = useApp();
  const { showToast } = useToast();

  // Mode: 'login' | 'register' | 'forgot'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Multi-User Segment Selection: 'member' | 'staff'
  const [userSegment, setUserSegment] = useState<'member' | 'staff'>('member');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Register form state (for new members)
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    birthDate: '1995-05-15',
    gender: 'L' as 'L' | 'P',
    city: 'Mataram',
    idCardNumber: '',
  });

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Handle standard Email & Password Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Harap masukkan alamat email dan kata sandi Anda.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Authenticate with AuthContext (verifies email and password)
      const success = login(email.trim(), password);

      if (success) {
        showToast('Login berhasil! Selamat datang di Lombok Garden Hotel.', 'success');
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(
          userSegment === 'staff'
            ? 'Kredensial staf/manajemen tidak valid atau akun dinonaktifkan. Pastikan email dan password terdaftar di sistem hotel.'
            : 'Email atau kata sandi tidak cocok. Silakan periksa kembali atau gunakan pendaftaran member baru.'
        );
      }
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Terjadi kesalahan saat masuk: ${errText}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google Account Verification & Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);

    try {
      const res = await signInWithGoogleAccount();

      if (res.success && res.user && res.user.email) {
        // Authenticate with Google Credentials in AuthContext
        const loggedIn = loginWithGoogle(
          res.user.email,
          res.user.displayName || undefined,
          res.user.photoURL || undefined
        );

        if (loggedIn) {
          showToast(`Verifikasi Google berhasil! Masuk sebagai ${res.user.displayName || res.user.email}`, 'success');
          if (onSuccess) onSuccess();
        } else {
          setErrorMessage('Akun Google berhasil diverifikasi, namun akun Anda dalam status nonaktif.');
        }
      } else {
        setErrorMessage(res.error || 'Verifikasi akun Google gagal. Silakan coba kembali.');
      }
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Kendala autentikasi Google: ${errText}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle New Member Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regForm.fullName.trim() || !regForm.email.trim() || !regForm.phone.trim()) {
      setErrorMessage('Harap lengkapi nama lengkap, alamat email, dan nomor WhatsApp aktif.');
      return;
    }

    if (regForm.password && regForm.password.length < 6) {
      setErrorMessage('Kata sandi minimal terdiri dari 6 karakter.');
      return;
    }

    if (regForm.password && regForm.password !== regForm.confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString().slice(0, 10);
      const end = new Date(Date.now() + 24 * 30 * 86400000).toISOString().slice(0, 10);

      const newMember = addMember({
        fullName: regForm.fullName.trim(),
        nickname: regForm.fullName.trim().split(' ')[0],
        email: regForm.email.trim().toLowerCase(),
        phone: regForm.phone.trim(),
        gender: regForm.gender,
        birthDate: regForm.birthDate,
        address: 'Mataram, Lombok',
        city: regForm.city || 'Mataram',
        province: 'Nusa Tenggara Barat',
        country: 'Indonesia',
        idCardNumber: regForm.idCardNumber || '5201000000000000',
        tierId: 'tier_member',
        registrationDate: now,
        membershipStartDate: now,
        membershipEndDate: end,
        referralCode: `${regForm.fullName.slice(0, 4).toUpperCase()}-LGH`,
        status: 'ACTIVE',
        internalNotes: 'Pendaftaran mandiri akun member melalui portal web.',
      });

      // Auto-login into newly created member
      login(newMember.email);
      showToast(`Pendaftaran berhasil! Selamat bergabung, ${newMember.fullName}.`, 'success');
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Gagal mendaftar: ${errText}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMessage('Masukkan email Anda yang terdaftar.');
      return;
    }
    setForgotSuccess(true);
    setErrorMessage(null);
    showToast(`Instruksi reset kata sandi telah dikirim ke ${forgotEmail}`, 'info');
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-between selection:bg-[#00A651] selection:text-white">
      {/* Top Brand Accent Stripe */}
      <div className="h-1.5 w-full bg-[#00A651]" />

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Hero Brand Panel (5 Cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-stone-900 via-stone-900 to-emerald-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#00A651]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

            {/* Top Logo presentation: Official Logo in Pure Original Colors */}
            <div className="relative z-10 space-y-6">
              <div className="p-4 bg-white rounded-2xl shadow-lg border border-stone-100 inline-block">
                <LombokGardenLogo variant="vertical" size="lg" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A651]/20 border border-[#00A651]/40 text-emerald-300 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#00A651] animate-pulse" />
                  <span>Hospitality & Membership Portal</span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                  Kenyamanan Tropis & Privilese Istimewa
                </h1>
                <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                  Selamat datang di portal terpadu Lombok Garden Hotel. Akses kartu keanggotaan digital, perolehan poin loyalitas, serta pengelolaan reservasi hotel.
                </p>
              </div>
            </div>

            {/* Bottom Highlights & Security Badges */}
            <div className="relative z-10 pt-8 border-t border-white/10 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Multi-User</div>
                  <div className="font-bold text-emerald-400">Tamu & Manajemen</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Keamanan</div>
                  <div className="font-bold text-emerald-400">Verifikasi Google</div>
                </div>
              </div>

              <div className="text-[11px] text-stone-400 flex items-center justify-between">
                <span>Jl. Bung Karno No. 7, Mataram</span>
                <span>(0370) 636015</span>
              </div>
            </div>
          </div>

          {/* Right Form Panel (7 Cols) */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
            
            {/* Header / Mode Switcher */}
            <div className="mb-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900 font-serif">
                    {authMode === 'login' && 'Masuk ke Akun Anda'}
                    {authMode === 'register' && 'Pendaftaran Member Baru'}
                    {authMode === 'forgot' && 'Pemulihan Kata Sandi'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    {authMode === 'login' && 'Pilih tipe pengguna dan masukkan kredensial akun Anda.'}
                    {authMode === 'register' && 'Nikmati diskon langsung, welcome card, dan perolehan poin.'}
                    {authMode === 'forgot' && 'Masukkan email terdaftar untuk menerima tautan reset.'}
                  </p>
                </div>

                {/* Back to login if in register/forgot */}
                {authMode !== 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMessage(null);
                    }}
                    className="text-xs font-semibold text-[#00A651] hover:underline cursor-pointer"
                  >
                    Kembali ke Login
                  </button>
                )}
              </div>

              {/* Multi-User Segment Tabs (Member vs Staff/Management) */}
              {authMode === 'login' && (
                <div className="mt-5 p-1 bg-stone-100 rounded-2xl grid grid-cols-2 gap-1 border border-stone-200">
                  <button
                    type="button"
                    onClick={() => {
                      setUserSegment('member');
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      userSegment === 'member'
                        ? 'bg-white text-stone-900 shadow-sm border border-stone-200/60'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Users className="w-4 h-4 text-[#00A651]" />
                    <span>Tamu & Member Hotel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserSegment('staff');
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      userSegment === 'staff'
                        ? 'bg-white text-stone-900 shadow-sm border border-stone-200/60'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-[#00A651]" />
                    <span>Staf & Manajemen Hotel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Error Notification Banner */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <div className="space-y-5">
                {/* 1. Google Account Verification Button (Required by prompt) */}
                <div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="w-full py-3 px-4 rounded-xl border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {/* Official Multi-Colored Google G Icon */}
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
                    <span>
                      {isGoogleLoading
                        ? 'Memverifikasi Akun Google...'
                        : 'Lanjutkan dengan Akun Google'}
                    </span>
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-stone-200" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                      <span className="bg-white px-3 text-stone-400">
                        atau masukkan email & password
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Standard Form Login (No Quick Login) */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {userSegment === 'member' ? 'Alamat Email Member' : 'Alamat Email Staf Hotel'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={
                          userSegment === 'member'
                            ? 'nama@email.com'
                            : 'staf@lombokgardenhotel.com'
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-stone-700">
                        Kata Sandi (Password)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setErrorMessage(null);
                        }}
                        className="text-[11px] text-[#00A651] hover:underline cursor-pointer"
                      >
                        Lupa kata sandi?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-[#00A651] focus:ring-[#00A651]"
                      />
                      <span className="text-stone-600">Ingat sesi saya di perangkat ini</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#00A651] hover:bg-[#009647] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Memverifikasi Akun...</span>
                    ) : (
                      <>
                        <span>Masuk ke Sistem Hotel</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Registration switch for guests */}
                {userSegment === 'member' && (
                  <div className="pt-4 border-t border-stone-100 text-center text-xs text-stone-600">
                    Belum menjadi member Lombok Garden?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setErrorMessage(null);
                      }}
                      className="font-bold text-[#00A651] hover:underline cursor-pointer"
                    >
                      Daftar Keanggotaan Gratis
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* REGISTER FORM */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      value={regForm.fullName}
                      onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                      placeholder="Contoh: Bpk. Rahmat Hidayat"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nomor WhatsApp Aktif *
                    </label>
                    <input
                      type="text"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="0812xxxx atau +62812xxxx"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Alamat Email *
                  </label>
                  <input
                    type="email"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="nama@email.com"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Kata Sandi *
                    </label>
                    <input
                      type="password"
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Konfirmasi Kata Sandi *
                    </label>
                    <input
                      type="password"
                      value={regForm.confirmPassword}
                      onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                      placeholder="Ulangi kata sandi"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Kota Asal</label>
                    <input
                      type="text"
                      value={regForm.city}
                      onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                      placeholder="Mataram"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-[#00A651]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={regForm.gender}
                      onChange={(e) => setRegForm({ ...regForm, gender: e.target.value as 'L' | 'P' })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-[#00A651]"
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#00A651] hover:bg-[#009647] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? 'Mendaftarkan Akun...' : 'Daftar & Terbitkan Kartu Digital'}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {authMode === 'forgot' && (
              <div className="space-y-4">
                {forgotSuccess ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-[#00A651]" />
                      <span>Tautan Terkirim</span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Kami telah mengirimkan instruksi pemulihan ke alamat <strong>{forgotEmail}</strong>. Silakan periksa kotak masuk atau spam email Anda.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setForgotSuccess(false);
                      }}
                      className="w-full py-2.5 bg-[#00A651] text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Kembali ke Halaman Masuk
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Alamat Email Terdaftar
                      </label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-[#00A651]"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#00A651] hover:bg-[#009647] text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Kirim Tautan Pemulihan Kata Sandi
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="py-4 text-center text-xs text-stone-500 border-t border-stone-200">
        <div className="flex items-center justify-center gap-2">
          <span>&copy; {new Date().getFullYear()} Lombok Garden Hotel. Seluruh Hak Cipta Dilindungi.</span>
          <span>&bull;</span>
          <span className="text-[#00A651] font-semibold">Lombok Hospitality Management</span>
        </div>
      </footer>
    </div>
  );
};
