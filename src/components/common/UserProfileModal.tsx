import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from './Modal';
import { DevicePhotoUploader } from './DevicePhotoUploader';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Building2,
  Briefcase,
  ShieldCheck,
  Calendar,
  MapPin,
  Camera,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  Award,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, currentMember, userRole, updateUserProfile } = useAuth();
  const { tiers } = useApp();
  const { showToast } = useToast();

  const isStaffOrAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // Active sub-tab inside the profile modal
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'info'>('profile');

  // Form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'L' | 'P' | 'OTHER'>('L');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Load current user & member data into state when modal opens
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setUsername(
        currentUser.username ||
          (currentUser.role === 'SUPER_ADMIN'
            ? 'superadmin'
            : currentUser.role === 'ADMIN'
            ? 'admin'
            : currentUser.email.split('@')[0])
      );
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || currentMember?.phone || '');
      setAvatar(currentUser.avatar || currentMember?.avatar || '');
      setDepartment(
        currentUser.department ||
          (currentUser.role === 'SUPER_ADMIN'
            ? 'Executive Management & IT'
            : currentUser.role === 'ADMIN'
            ? 'Front Office & Loyalty CRM'
            : '')
      );
      setJobTitle(
        currentUser.jobTitle ||
          (currentUser.role === 'SUPER_ADMIN'
            ? 'General Manager & Super Admin'
            : currentUser.role === 'ADMIN'
            ? 'Front Office Manager'
            : '')
      );

      if (currentMember) {
        setNickname(currentMember.nickname || currentUser.name.split(' ')[0]);
        setBirthDate(currentMember.birthDate || '');
        setGender(currentMember.gender || 'L');
        setAddress(currentMember.address || '');
        setCity(currentMember.city || '');
      }
    }
    setNewPassword('');
    setConfirmPassword('');
    setActiveTab('profile');
  }, [currentUser, currentMember, isOpen]);

  if (!isOpen || !currentUser) return null;

  const currentTier = tiers.find((t) => t.id === currentMember?.tierId) || tiers[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Nama lengkap tidak boleh kosong.', 'error');
      return;
    }

    if (!username.trim()) {
      showToast('Username tidak boleh kosong.', 'error');
      return;
    }

    if (!email.trim()) {
      showToast('Alamat email tidak boleh kosong.', 'error');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        showToast('Kata sandi baru minimal 6 karakter.', 'error');
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast('Konfirmasi kata sandi baru tidak cocok.', 'error');
        return;
      }
    }

    updateUserProfile({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatar: avatar.trim() || undefined,
      department: isStaffOrAdmin ? department.trim() : undefined,
      jobTitle: isStaffOrAdmin ? jobTitle.trim() : undefined,
      password: newPassword ? newPassword.trim() : undefined,
      address: !isStaffOrAdmin ? address.trim() : undefined,
      city: !isStaffOrAdmin ? city.trim() : undefined,
      birthDate: !isStaffOrAdmin ? birthDate : undefined,
      gender: !isStaffOrAdmin ? gender : undefined,
    });

    showToast(
      isStaffOrAdmin
        ? 'Profil staf/manajemen berhasil diperbarui!'
        : 'Profil member berhasil diperbarui!',
      'success'
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isStaffOrAdmin
          ? `Edit Profil Staf: ${currentUser.name}`
          : `Edit Profil Member: ${currentUser.name}`
      }
      subtitle="Kelola identitas, data kontak, username login, serta keamanan akun Anda"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Profile Header Card */}
        <div className="p-4 bg-gradient-to-r from-stone-900 to-emerald-950 rounded-2xl text-white flex items-center justify-between gap-4 border border-stone-800">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#00A651] shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-emerald-800 border-2 border-emerald-500 flex items-center justify-center font-bold text-lg text-emerald-100 shadow-md">
                  {name.charAt(0) || 'U'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#00A651] ring-2 ring-stone-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-stone-100">{name || 'Nama Pengguna'}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                    userRole === 'SUPER_ADMIN'
                      ? 'bg-amber-400 text-stone-950'
                      : userRole === 'ADMIN'
                      ? 'bg-emerald-400 text-stone-950'
                      : 'bg-emerald-700 text-white'
                  }`}
                >
                  {userRole === 'SUPER_ADMIN'
                    ? 'Super Administrator'
                    : userRole === 'ADMIN'
                    ? 'Hotel Admin'
                    : currentTier?.name || 'Member'}
                </span>
              </div>
              <div className="text-xs text-stone-400 font-mono mt-0.5">
                @{username || 'username'} &bull; {email}
              </div>
              {isStaffOrAdmin && (department || jobTitle) && (
                <div className="text-[11px] text-emerald-300 mt-1 flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" />
                  <span>
                    {jobTitle} {department ? `&bull; ${department}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {!isStaffOrAdmin && currentMember && (
            <div className="hidden sm:block text-right pr-2">
              <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                Poin Loyalitas
              </div>
              <div className="text-lg font-bold font-mono text-amber-400">
                {currentMember.availablePoints.toLocaleString('id-ID')} Poin
              </div>
              <div className="text-[10px] text-stone-400 font-mono">
                {currentMember.membershipNumber}
              </div>
            </div>
          )}
        </div>

        {/* Tab Switcher inside Modal */}
        <div className="flex border-b border-stone-200 gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 transition-colors relative cursor-pointer ${
              activeTab === 'profile'
                ? 'text-[#00A651] border-b-2 border-[#00A651]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Data Profil & Kontak
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 transition-colors relative cursor-pointer ${
              activeTab === 'security'
                ? 'text-[#00A651] border-b-2 border-[#00A651]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Keamanan & Password
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 transition-colors relative cursor-pointer ${
              activeTab === 'info'
                ? 'text-[#00A651] border-b-2 border-[#00A651]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Detail Akun & Role
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TAB 1: DATA PROFIL & KONTAK */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nama Lengkap & Gelar *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Username Login * (Email/Username)
                  </label>
                  <div className="relative">
                    <span className="text-stone-400 font-mono text-xs absolute left-3 top-1/2 -translate-y-1/2">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '')
                        )
                      }
                      placeholder="username unik"
                      className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">
                    Bisa digunakan untuk login simpel tanpa mengetik email panjang.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Alamat Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nomor Telepon / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+62 812xxxx"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                    />
                  </div>
                </div>
              </div>

              {/* Staff-Specific Fields */}
              {isStaffOrAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Departemen Hotel
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Contoh: Front Office, F&B, IT"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Jabatan / Posisi
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Contoh: Front Desk Manager, IT Supervisor"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Member-Specific Fields */}
              {!isStaffOrAdmin && (
                <div className="space-y-4 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#00A651]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#00A651]"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                        <option value="OTHER">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Alamat Domisili
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Alamat lengkap"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#00A651]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Kota Asal
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Contoh: Mataram, Jakarta, Denpasar"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#00A651]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Photo Avatar via Direct Local Device Upload */}
              <div className="pt-2">
                <DevicePhotoUploader
                  currentPhoto={avatar}
                  onPhotoChange={(newPhoto) => setAvatar(newPhoto)}
                  userName={name || 'User'}
                  label="Foto Profil Pengguna (Upload Langsung dari Perangkat Lokal)"
                />
              </div>
            </div>
          )}

          {/* TAB 2: KEAMANAN & PASSWORD */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Kosongkan kolom kata sandi jika Anda <strong>tidak ingin mengubah</strong> kata sandi akun saat ini.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-9 pr-10 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#00A651]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#00A651]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DETAIL AKUN & ROLE */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                    ID Pengguna
                  </div>
                  <div className="font-mono font-semibold text-stone-800">{currentUser.id}</div>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                    Status Akun
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Aktif & Terverifikasi</span>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                    Tanggal Terdaftar
                  </div>
                  <div className="font-mono text-stone-700">
                    {new Date(currentUser.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                    Terakhir Masuk
                  </div>
                  <div className="font-mono text-stone-700">
                    {currentUser.lastLogin
                      ? new Date(currentUser.lastLogin).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Sesi Aktif'}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-700 text-white rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950">
                      Tingkat Akses: {userRole}
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      {userRole === 'SUPER_ADMIN'
                        ? 'Akses penuh ke seluruh konfigurasi sistem, database, audit, dan WhatsApp CRM.'
                        : userRole === 'ADMIN'
                        ? 'Akses operasional reservasi, transaksi Front Desk, scanner, dan penukaran poin.'
                        : 'Akses kartu keanggotaan digital, katalog reward, dan riwayat menginap.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-[#00A651] hover:bg-[#009647] text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Simpan Perubahan Profil</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
