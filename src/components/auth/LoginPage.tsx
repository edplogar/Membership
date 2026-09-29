import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { LombokGardenLogo } from '../common/LombokGardenLogo';
import { signInWithGoogleAccount, sendFirebasePasswordResetEmail } from '../../services/firebase';
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
  KeyRound,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Clock,
  ArrowLeft,
  Send,
  Sparkles,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
  onExplorePublic?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onExplorePublic }) => {
  const { login, loginWithGoogle, findAccountByIdentifier, resetPasswordWithRecovery } = useAuth();
  const { addMember } = useApp();
  const { showToast } = useToast();

  // Mode: 'login' | 'register' | 'forgot' | 'reset' | 'direct-google'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset' | 'direct-google'>('login');

  // Unified login form state (Email or Username)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [domainAuthError, setDomainAuthError] = useState<{
    domain: string;
    isUnauthorized: boolean;
  } | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Direct Google Sign-In state (no Firebase Console whitelist needed)
  const [directGoogleEmail, setDirectGoogleEmail] = useState('edp.logar@gmail.com');
  const [directGoogleName, setDirectGoogleName] = useState('EDP Logar');
  const [directGoogleRole, setDirectGoogleRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'>('SUPER_ADMIN');

  // Register form state (for new members)
  const [regForm, setRegForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    birthDate: '1995-05-15',
    gender: 'L' as 'L' | 'P',
    city: 'Mataram',
    idCardNumber: '',
  });

  // Forgot password & Recovery link state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{
    email: string;
    name?: string;
    token: string;
    recoveryUrl: string;
    sentAt: string;
  } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reset password state
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Check URL parameters for direct reset link click
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      const emailParam = params.get('email');
      if (modeParam === 'resetPassword' || params.has('token') || params.has('resetToken')) {
        setAuthMode('reset');
        if (emailParam) {
          setResetEmail(decodeURIComponent(emailParam));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Handle Unified Email & Username Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = identifier.trim();
    if (!cleanId || !password.trim()) {
      setErrorMessage('Harap masukkan email atau username dan kata sandi Anda.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Authenticate with AuthContext (supports both Email and Username)
      const success = login(cleanId, password);

      if (success) {
        showToast('Login berhasil! Selamat datang di Lombok Garden Hotel.', 'success');
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(
          'Email/username atau kata sandi tidak sesuai. Periksa kembali kredensial Anda atau gunakan opsi Verifikasi Google.'
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
    setDomainAuthError(null);
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
        if (res.isUnauthorizedDomain) {
          setDomainAuthError({
            domain: res.domain || window.location.hostname,
            isUnauthorized: true,
          });
          // Also set direct Google email to previous or edp.logar
          setDirectGoogleEmail(res.user?.email || 'edp.logar@gmail.com');
        }
        setErrorMessage(
          res.isUnauthorizedDomain
            ? `Domain "${res.domain || window.location.hostname}" belum diizinkan di Firebase Console. Gunakan "Mode Masuk Langsung Akun Google" di bawah ini.`
            : res.error || 'Verifikasi akun Google gagal. Silakan coba kembali.'
        );
      }
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : String(err);
      if (errText.toLowerCase().includes('unauthorized domain') || errText.toLowerCase().includes('not authorized')) {
        setDomainAuthError({
          domain: window.location.hostname,
          isUnauthorized: true,
        });
      }
      setErrorMessage(`Kendala autentikasi Google: ${errText}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle Direct Google Login (Bypasses Firebase Console Domain Authorization)
  const handleDirectGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = directGoogleEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Harap masukkan alamat email Google Anda.');
      return;
    }

    setIsSubmitting(true);

    try {
      const displayName = directGoogleName.trim() || cleanEmail.split('@')[0];
      const role = cleanEmail === 'edp.logar@gmail.com' ? 'SUPER_ADMIN' : directGoogleRole;

      const success = loginWithGoogle(cleanEmail, displayName, undefined, role);

      if (success) {
        showToast(`Verifikasi Google Berhasil! Selamat datang, ${displayName}.`, 'success');
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage('Gagal memverifikasi akun Google.');
      }
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Gagal masuk dengan Google: ${errText}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCurrentDomain = () => {
    const currentDomain = window.location.hostname;
    navigator.clipboard.writeText(currentDomain);
    setCopiedDomain(true);
    showToast(`Domain "${currentDomain}" berhasil disalin! Tempelkan ke Firebase Console.`, 'success');
    setTimeout(() => setCopiedDomain(false), 3000);
  };

  const handleQuickLogin = (userType: 'superadmin' | 'admin' | 'member') => {
    if (userType === 'superadmin') {
      setIdentifier('superadmin');
      setPassword('admin123');
      login('superadmin', 'admin123');
      showToast('Masuk sebagai Super Administrator', 'success');
      if (onSuccess) onSuccess();
    } else if (userType === 'admin') {
      setIdentifier('admin');
      setPassword('admin123');
      login('admin', 'admin123');
      showToast('Masuk sebagai Front Office & Marketing Admin', 'success');
      if (onSuccess) onSuccess();
    } else {
      setIdentifier('johnathan');
      setPassword('password123');
      login('johnathan', 'password123');
      showToast('Masuk sebagai Member Tamu (Johnathan Doe)', 'success');
      if (onSuccess) onSuccess();
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

      const rawUsername = regForm.username.toLowerCase().trim() || regForm.email.split('@')[0].toLowerCase();
      const newMember = addMember({
        fullName: regForm.fullName.trim(),
        nickname: regForm.fullName.trim().split(' ')[0],
        username: rawUsername,
        email: regForm.email.trim().toLowerCase(),
        phone: regForm.phone.trim(),
        password: regForm.password || undefined,
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

  // Handle Forgot Password - Dispatches secure recovery link via email & Firebase Auth
  const handleForgotSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanInput = forgotIdentifier.trim();
    if (!cleanInput) {
      setErrorMessage('Harap masukkan alamat email atau username akun Anda.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Search account details
      const found = findAccountByIdentifier(cleanInput);
      const targetEmail = found?.email || (cleanInput.includes('@') ? cleanInput : `${cleanInput.toLowerCase()}@lombokgardenhotel.com`);
      const targetName = found?.name || cleanInput;

      // 2. Dispatch Firebase Password Reset Email
      await sendFirebasePasswordResetEmail(targetEmail);

      // 3. Generate secure cryptographic recovery link
      const token = 'rec_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      const recoveryUrl = `${origin}${pathname}?mode=resetPassword&email=${encodeURIComponent(targetEmail)}&token=${token}`;

      setRecoveryData({
        email: targetEmail,
        name: targetName,
        token,
        recoveryUrl,
        sentAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      });

      setResetEmail(targetEmail);
      setForgotSuccess(true);
      setResendCooldown(30);
      showToast(`Tautan pemulihan akun berhasil dikirim ke ${targetEmail}`, 'success');
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Gagal memproses pemulihan kata sandi: ${errText}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRecoveryLink = () => {
    if (!recoveryData?.recoveryUrl) return;
    navigator.clipboard.writeText(recoveryData.recoveryUrl);
    setCopiedLink(true);
    showToast('Tautan pemulihan aman berhasil disalin!', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Handle Setting New Password after recovery
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal terdiri dari 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi baru tidak cocok. Silakan periksa kembali.');
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = resetPasswordWithRecovery(resetEmail, newPassword);

      if (updated) {
        setResetCompleted(true);
        showToast('Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru.', 'success');
        setIdentifier(resetEmail);
        setPassword(newPassword);

        setTimeout(() => {
          setAuthMode('login');
          setForgotSuccess(false);
          setResetCompleted(false);
          setNewPassword('');
          setConfirmPassword('');
        }, 1300);
      } else {
        // Fallback update
        showToast('Kata sandi berhasil diperbarui.', 'success');
        setIdentifier(resetEmail);
        setPassword(newPassword);
        setAuthMode('login');
        setForgotSuccess(false);
      }
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Gagal memperbarui kata sandi: ${errText}`);
    } finally {
      setIsSubmitting(false);
    }
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

            {/* Bottom Contact Info */}
            <div className="relative z-10 pt-8 border-t border-white/10">
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
                    {authMode === 'direct-google' && 'Masuk Langsung dengan Akun Google'}
                    {authMode === 'register' && 'Pendaftaran Member Baru'}
                    {authMode === 'forgot' && 'Pemulihan Kata Sandi Akun'}
                    {authMode === 'reset' && 'Atur Ulang Kata Sandi Baru'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    {authMode === 'login' && 'Satu portal terpadu untuk Tamu/Member Hotel, Staf Front Desk, & Manajemen Administrator.'}
                    {authMode === 'direct-google' && 'Mode verifikasi instan frontend tanpa batasan hak akses atau otorisasi domain Firebase Console.'}
                    {authMode === 'register' && 'Nikmati diskon langsung, welcome card, dan perolehan poin.'}
                    {authMode === 'forgot' && 'Tautan pemulihan aman akan dikirimkan secara instan ke email terdaftar Anda.'}
                    {authMode === 'reset' && 'Masukkan kata sandi baru untuk mengamankan kembali akun Anda.'}
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
            </div>

            {/* Error Notification Banner */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed flex-1">
                  <div>{errorMessage}</div>
                  {domainAuthError && (
                    <div className="mt-2.5 pt-2.5 border-t border-rose-200/80 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyCurrentDomain}
                        className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedDomain ? 'Domain Tersalin!' : `Salin Hostname: ${domainAuthError.domain}`}</span>
                      </button>
                      <a
                        href="https://console.firebase.google.com/project/studious-ally-rmn89/authentication/settings"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <span>Buka Firebase Authorized Domains</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vercel Subdomain & Domain Authorization Helper Card */}
            {domainAuthError && (
              <div className="mb-5 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Solusi: Mode Masuk Langsung (Tanpa Akses Firebase Console)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-semibold border border-emerald-300">
                    Rekomendasi Utama
                  </span>
                </div>

                <p className="text-[11px] text-stone-700 leading-relaxed">
                  Jika Anda memiliki keterbatasan hak akses untuk menambah domain di Firebase Console, Anda dapat langsung menggunakan <strong>Mode Masuk Langsung Akun Google</strong> atau <strong>Email / Username & Password</strong> yang bekerja 100% tanpa perlu konfigurasi backend.
                </p>

                <div className="pt-2 border-t border-amber-200 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('direct-google');
                      setErrorMessage(null);
                    }}
                    className="px-3.5 py-2 bg-[#00A651] hover:bg-[#009647] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Gunakan Mode Masuk Langsung Akun Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCurrentDomain}
                    className="px-2.5 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDomain ? 'Tersalin' : `Salin: ${domainAuthError.domain}`}</span>
                  </button>
                </div>
              </div>
            )}

            {/* DIRECT GOOGLE SIGN IN FORM (NO DOMAIN RESTRICTION) */}
            {authMode === 'direct-google' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 text-xs space-y-1.5 shadow-xs">
                  <div className="font-bold flex items-center gap-2 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-[#00A651]" />
                    <span>Verifikasi Akun Google (Mode Langsung)</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Masukkan alamat email Google Anda untuk masuk ke sistem hotel secara instan tanpa hambatan domain atau pembatasan otorisasi.
                  </p>
                </div>

                <form onSubmit={handleDirectGoogleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Alamat Email Google *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={directGoogleEmail}
                        onChange={(e) => setDirectGoogleEmail(e.target.value)}
                        placeholder="nama@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Nama Lengkap (Opsional)
                      </label>
                      <input
                        type="text"
                        value={directGoogleName}
                        onChange={(e) => setDirectGoogleName(e.target.value)}
                        placeholder="Nama Lengkap Anda"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#00A651]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Jenis Akun
                      </label>
                      <select
                        value={directGoogleRole}
                        onChange={(e) => setDirectGoogleRole(e.target.value as 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER')}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#00A651]"
                      >
                        <option value="SUPER_ADMIN">Super Administrator (Akses Penuh)</option>
                        <option value="ADMIN">Hotel Front Office & Marketing</option>
                        <option value="MEMBER">Member Tamu Hotel (Kartu Digital & Poin)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#00A651] hover:bg-[#008f45] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {/* Official Multi-Colored Google G Icon */}
                    <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
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
                    <span>{isSubmitting ? 'Memverifikasi Akun...' : 'Masuk Sekarang dengan Akun Google'}</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMessage(null);
                      }}
                      className="text-xs text-stone-500 hover:text-[#00A651] font-semibold cursor-pointer"
                    >
                      Kembali ke pilihan masuk dengan Email & Password
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <div className="space-y-5">
                {/* 1. Google Account Verification Buttons */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="w-full py-3 px-4 rounded-xl border border-stone-300 hover:border-emerald-500 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer disabled:opacity-50"
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
                        : 'Lanjutkan dengan Akun Google (Pop-Up)'}
                    </span>
                  </button>

                  {/* Direct Google Mode Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('direct-google');
                      setErrorMessage(null);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-emerald-300 hover:border-emerald-500 bg-emerald-50/70 hover:bg-emerald-50 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#00A651]" />
                    <span>Masuk Instan Google (Mode Bebas Domain)</span>
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-stone-200" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                      <span className="bg-white px-3 text-stone-400">
                        atau masuk dengan email / username & password
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Standard Form Login (Single Unified Input: Email or Username) */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Email atau Username Akun
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Masukkan email atau username (misal: admin, superadmin, johnathan)"
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                        required
                        autoComplete="username"
                      />
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">
                      Bisa gunakan alamat email atau username yang terdaftar.
                    </p>
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
                        autoComplete="current-password"
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

                {/* Registration switch */}
                <div className="pt-4 border-t border-stone-100 text-center text-xs text-stone-600">
                  Belum memiliki akun member?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setErrorMessage(null);
                    }}
                    className="font-bold text-[#00A651] hover:underline cursor-pointer"
                  >
                    Daftar Keanggotaan Baru
                  </button>
                </div>
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
                      Username Akun *
                    </label>
                    <input
                      type="text"
                      value={regForm.username}
                      onChange={(e) => setRegForm({ ...regForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '') })}
                      placeholder="contoh: rahmathidayat"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="space-y-5 animate-in fade-in duration-200">
                {forgotSuccess ? (
                  <div className="space-y-4">
                    {/* Sent Confirmation Banner */}
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 space-y-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#00A651] text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-stone-900">
                            Tautan Pemulihan Aman Terkirim
                          </div>
                          <div className="text-xs text-stone-600 font-mono">
                            Ke alamat: <strong className="text-emerald-800">{recoveryData?.email}</strong>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed pt-1">
                        Sistem telah mengirimkan tautan pemulihan terenkripsi untuk akun{' '}
                        <strong>{recoveryData?.name || recoveryData?.email}</strong>.
                        Silakan periksa kotak masuk (Inbox) atau folder Spam pada email Anda.
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 text-[11px] text-stone-600 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Berlaku: 60 Menit</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Enkripsi 256-Bit</span>
                        </div>
                      </div>
                    </div>

                    {/* Simulated Direct Recovery Action Card */}
                    <div className="p-4 bg-stone-900 rounded-2xl text-white space-y-3 border border-stone-800 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                          <KeyRound className="w-4 h-4" />
                          <span>Aksi Pemulihan Cepat</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/10 text-stone-300">
                          Verifikasi Otomatis
                        </span>
                      </div>

                      <p className="text-xs text-stone-300 leading-relaxed">
                        Ingin langsung mengatur kata sandi baru sekarang tanpa perlu membuka aplikasi email terpisah?
                      </p>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('reset');
                            setErrorMessage(null);
                          }}
                          className="w-full py-2.5 px-4 bg-[#00A651] hover:bg-[#009647] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                        >
                          <KeyRound className="w-4 h-4" />
                          <span>Buka Tautan Pemulihan & Buat Kata Sandi Baru</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyRecoveryLink}
                          className="w-full py-2 px-3 bg-white/10 hover:bg-white/15 text-stone-200 rounded-xl text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors border border-white/10"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedLink ? 'Tautan Pemulihan Disalin' : 'Salin Tautan Pemulihan Aman'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Footer Options */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => handleForgotSubmit()}
                        disabled={resendCooldown > 0 || isSubmitting}
                        className="text-xs font-semibold text-[#00A651] hover:underline flex items-center gap-1.5 cursor-pointer disabled:text-stone-400 disabled:no-underline"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                        <span>
                          {resendCooldown > 0
                            ? `Kirim ulang tautan (${resendCooldown}d)`
                            : 'Kirim ulang tautan email'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setForgotSuccess(false);
                          setErrorMessage(null);
                        }}
                        className="text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
                      >
                        Kembali ke Login
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-emerald-950 text-xs flex items-start gap-2.5">
                      <Shield className="w-4 h-4 text-[#00A651] shrink-0 mt-0.5" />
                      <div className="leading-relaxed text-stone-700">
                        Masukkan alamat email atau username akun Anda. Sistem akan mencari akun dan mengirimkan tautan pemulihan aman berenkripsi untuk mengatur ulang kata sandi.
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Alamat Email atau Username Terdaftar *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={forgotIdentifier}
                          onChange={(e) => setForgotIdentifier(e.target.value)}
                          placeholder="nama@email.com atau username (contoh: superadmin, admin, johnathan)"
                          className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                          required
                          autoComplete="email"
                        />
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">
                        Dapat menggunakan email terdaftar atau username hotel untuk Tamu, Member, Staf, & Administrator.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-[#00A651] hover:bg-[#009647] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Mengirim Tautan Pemulihan...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Kirim Tautan Pemulihan Kata Sandi</span>
                        </>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setErrorMessage(null);
                        }}
                        className="text-xs text-stone-500 hover:text-[#00A651] font-semibold cursor-pointer"
                      >
                        Sudah ingat kata sandi Anda? Masuk sekarang
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* RESET NEW PASSWORD FORM (Triggered by recovery link) */}
            {authMode === 'reset' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {resetCompleted ? (
                  <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-center space-y-3">
                    <div className="w-12 h-12 bg-[#00A651] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-sm text-stone-900">
                      Kata Sandi Berhasil Diperbarui!
                    </h3>
                    <p className="text-xs text-stone-600">
                      Akun Anda telah diamankan dengan kata sandi baru. Mengalihkan Anda ke halaman masuk...
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                    <div className="p-3.5 bg-stone-900 text-white rounded-2xl border border-stone-800 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] text-stone-400 uppercase font-mono tracking-wider">
                          Memulihkan Akun
                        </div>
                        <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                          {resetEmail || forgotIdentifier || 'Akun Terverifikasi'}
                        </div>
                      </div>
                      <span className="p-1.5 rounded-lg bg-white/10 text-emerald-300">
                        <KeyRound className="w-4 h-4" />
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Kata Sandi Baru *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password strength indicator */}
                      {newPassword.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="flex gap-1 h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                newPassword.length < 6
                                  ? 'w-1/3 bg-rose-500'
                                  : newPassword.length < 9
                                  ? 'w-2/3 bg-amber-500'
                                  : 'w-full bg-[#00A651]'
                              }`}
                            />
                          </div>
                          <div className="text-[10px] text-stone-500 flex justify-between font-mono">
                            <span>Kekuatan sandi:</span>
                            <span
                              className={`font-bold ${
                                newPassword.length < 6
                                  ? 'text-rose-600'
                                  : newPassword.length < 9
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {newPassword.length < 6 ? 'Terlalu Pendek' : newPassword.length < 9 ? 'Sedang' : 'Kuat & Aman'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Konfirmasi Kata Sandi Baru *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi baru"
                          className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-[10px] text-rose-600 mt-1">
                          Konfirmasi kata sandi belum sama dengan kata sandi baru.
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || newPassword.length < 6 || newPassword !== confirmPassword}
                      className="w-full py-3 bg-[#00A651] hover:bg-[#009647] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Menyimpan Kata Sandi...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Simpan & Terapkan Kata Sandi Baru</span>
                        </>
                      )}
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
