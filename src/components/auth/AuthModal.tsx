import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { Lock, Mail, User, Phone, Sparkles, CheckCircle2 } from 'lucide-react';

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
  const { login, switchDemoRole } = useAuth();
  const { addMember } = useApp();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(defaultMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('superadmin@lombokgardenhotel.com');
  const [loginPassword, setLoginPassword] = useState('demo123');

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
    const success = login(loginEmail);
    if (success) {
      showToast('Berhasil masuk ke sistem!', 'success');
      onClose();
    } else {
      showToast('Email atau kata sandi tidak cocok. Gunakan kredensial demo.', 'error');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.fullName || !regForm.email || !regForm.phone) {
      showToast('Harap lengkapi semua field bertanda bintang.', 'error');
      return;
    }

    const now = new Date().toISOString().slice(0, 10);
    const end = new Date(Date.now() + 24 * 30 * 86400000).toISOString().slice(0, 10);

    const newMember = addMember({
      fullName: regForm.fullName,
      nickname: regForm.fullName.split(' ')[0],
      email: regForm.email,
      phone: regForm.phone,
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
      internalNotes: 'Pendaftaran mandiri melalui portal publik hotel.',
    });

    // Auto-login to new member
    login(newMember.email);
    showToast('Registrasi berhasil! Selamat bergabung di Lombok Garden Hotel.', 'success');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'login'
          ? 'Masuk ke Portal Keanggotaan'
          : mode === 'register'
          ? 'Pendaftaran Member Baru Lombok Garden'
          : 'Lupa Kata Sandi'
      }
      subtitle={
        mode === 'login'
          ? 'Silakan masuk menggunakan akun Member atau Staf Administrator'
          : mode === 'register'
          ? 'Daftar gratis untuk menikmati diskon kamar dan poin reward istimewa'
          : 'Masukkan email untuk menerima instruksi reset'
      }
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Quick Demo Credentials Autofill */}
        {mode === 'login' && (
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Pilih Kredensial Demo Cepat:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('superadmin@lombokgardenhotel.com');
                  setLoginPassword('demo123');
                }}
                className="p-2 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 text-left transition-colors"
              >
                <div className="font-bold text-[11px]">Super Admin</div>
                <div className="text-[9px] text-stone-400 truncate">Hendra Wijaya</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginEmail('admin@lombokgardenhotel.com');
                  setLoginPassword('demo123');
                }}
                className="p-2 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 text-left transition-colors"
              >
                <div className="font-bold text-[11px]">Hotel Admin</div>
                <div className="text-[9px] text-stone-400 truncate">Siti Rahmawati</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginEmail('member@example.com');
                  setLoginPassword('demo123');
                }}
                className="p-2 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 text-left transition-colors"
              >
                <div className="font-bold text-[11px]">Member (Gold)</div>
                <div className="text-[9px] text-stone-400 truncate">Johnathan Doe</div>
              </button>
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700/20"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-stone-400 hover:text-emerald-800 font-medium"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700/20"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Masuk Sekarang
            </button>

            <div className="text-center pt-2 text-xs text-stone-500">
              Belum memiliki kartu member?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-emerald-800 font-bold hover:underline"
              >
                Daftar Gratis
              </button>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nama Lengkap Sesuai KTP/Paspor *
              </label>
              <input
                type="text"
                value={regForm.fullName}
                onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                placeholder="Nama Anda"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
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
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nomor HP / WhatsApp *
                </label>
                <input
                  type="tel"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  placeholder="+62 812-xxxx"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={regForm.birthDate}
                  onChange={(e) => setRegForm({ ...regForm, birthDate: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={regForm.gender}
                  onChange={(e: any) => setRegForm({ ...regForm, gender: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors mt-2"
            >
              Daftar & Terbitkan Kartu Digital
            </button>

            <div className="text-center pt-2 text-xs text-stone-500">
              Sudah memiliki akun?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-stone-900 font-bold hover:underline"
              >
                Masuk
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            <p className="text-xs text-stone-600">
              Masukkan alamat email Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
            </p>
            <input
              type="email"
              placeholder="nama@email.com"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
            />
            <button
              type="button"
              onClick={() => {
                showToast('Tautan instruksi pemulihan telah dikirim ke email.', 'success');
                setMode('login');
              }}
              className="w-full py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold"
            >
              Kirim Tautan Reset
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-stone-500 hover:text-stone-800"
              >
                Kembali ke Form Masuk
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
