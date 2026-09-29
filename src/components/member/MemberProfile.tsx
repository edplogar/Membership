import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { formatDateIndo } from '../../services/membershipEngine';
import { User, Phone, MapPin, Share2, Copy, Check, Shield } from 'lucide-react';

export const MemberProfile: React.FC = () => {
  const { currentMember } = useAuth();
  const { updateMember } = useApp();
  const { showToast } = useToast();

  const member = currentMember || {
    id: 'mem_john_doe',
    membershipNumber: 'LGH-001088',
    fullName: 'Johnathan Doe',
    nickname: 'John',
    email: 'member@example.com',
    phone: '+62 812-3456-7890',
    gender: 'L',
    birthDate: '1988-06-15',
    address: 'Jl. Sunset Road No. 88, Kuta',
    city: 'Denpasar',
    province: 'Bali',
    country: 'Indonesia',
    idCardNumber: '3201123456780001',
    registrationDate: '2025-01-10',
    membershipStartDate: '2025-01-10',
    membershipEndDate: '2027-01-10',
    tierId: 'tier_gold',
    status: 'ACTIVE' as const,
    totalVisits: 9,
    totalTransactions: 14,
    totalSpending: 28750000,
    totalPointsEarned: 4312,
    availablePoints: 3250,
    redeemedPoints: 1062,
    referralCode: 'JOHN-LGH',
    internalNotes: '',
  };

  const [formData, setFormData] = useState({
    fullName: member.fullName,
    nickname: member.nickname,
    phone: member.phone,
    address: member.address,
    city: member.city,
    birthDate: member.birthDate,
  });

  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMember(member.id, formData);
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(member.referralCode);
    setCopied(true);
    showToast('Kode referral berhasil disalin!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in duration-200">
      <div>
        <h1 className="font-serif-luxury text-2xl font-bold text-stone-900">
          Profil & Pengaturan Akun
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Kelola data pribadi Anda dan bagikan kode referral ke rekan Anda.
        </p>
      </div>

      {/* Referral Card Banner */}
      <div className="p-6 bg-linear-to-r from-stone-900 via-stone-950 to-emerald-950 text-white rounded-2xl border border-stone-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-semibold">
            PROGRAM REFERRAL MEMBER
          </div>
          <h3 className="font-serif-luxury text-lg font-bold mt-1">
            Ajak Sahabat & Dapatkan +500 Poin
          </h3>
          <p className="text-xs text-stone-300 mt-1 max-w-md">
            Bagikan kode unik Anda kepada teman. Anda mendapatkan +500 poin dan
            teman Anda menerima bonus +250 poin saat pertama mendaftar.
          </p>
        </div>

        <div className="bg-stone-900/90 p-3.5 rounded-xl border border-stone-700 flex items-center gap-3 shrink-0">
          <div className="font-mono text-base font-bold text-amber-300 tracking-wider">
            {member.referralCode}
          </div>
          <button
            type="button"
            onClick={handleCopyReferral}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors"
            title="Salin Kode Referral"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-stone-100">
            <div className="w-14 h-14 rounded-2xl bg-emerald-900 text-amber-300 font-serif-luxury text-xl font-bold flex items-center justify-center">
              {formData.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                {formData.fullName}
              </h3>
              <div className="text-xs font-mono text-stone-500 mt-0.5">
                Nomor: {member.membershipNumber} · Bergabung sejak{' '}
                {formatDateIndo(member.registrationDate)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Nama Panggilan
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) =>
                  setFormData({ ...formData, nickname: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Nomor WhatsApp / HP
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Tanggal Lahir (Untuk Benefit Ultah)
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Alamat Tinggal
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Kota / Domisili
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Email Terdaftar
              </label>
              <input
                type="email"
                value={member.email}
                disabled
                className="w-full px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm text-stone-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Simpan Perubahan Profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
