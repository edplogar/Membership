import React, { useState } from 'react';
import { Member, MembershipTier } from '../../types';
import { QRCodeView } from '../common/QRCodeView';
import { formatDateIndo } from '../../services/membershipEngine';
import { LombokGardenLogo } from '../common/LombokGardenLogo';
import {
  Sparkles,
  QrCode,
  Maximize2,
  Calendar,
  Award,
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface DigitalMembershipCardProps {
  member: Member;
  tier: MembershipTier;
  nextTier?: MembershipTier;
  onViewBenefits?: () => void;
}

export const DigitalMembershipCard: React.FC<DigitalMembershipCardProps> = ({
  member,
  tier,
  nextTier,
  onViewBenefits,
}) => {
  const [showFullQR, setShowFullQR] = useState(false);

  // Background and styling by tier
  const getCardTheme = () => {
    switch (tier.level) {
      case 4: // Platinum
        return {
          gradient: 'from-stone-950 via-stone-900 to-slate-950',
          accent: 'text-amber-300',
          border: 'border-amber-400/40 ring-1 ring-amber-400/20',
          foil: 'bg-linear-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent',
          chipColor: 'bg-linear-to-tr from-amber-400 to-amber-200',
        };
      case 3: // Gold
        return {
          gradient: 'from-amber-900 via-stone-900 to-amber-950',
          accent: 'text-amber-400',
          border: 'border-amber-500/50 ring-1 ring-amber-500/30',
          foil: 'bg-linear-to-r from-amber-100 via-amber-300 to-yellow-200 bg-clip-text text-transparent',
          chipColor: 'bg-linear-to-tr from-amber-300 to-yellow-100',
        };
      case 2: // Silver
        return {
          gradient: 'from-slate-900 via-stone-900 to-slate-800',
          accent: 'text-slate-300',
          border: 'border-slate-500/40 ring-1 ring-slate-400/20',
          foil: 'bg-linear-to-r from-slate-100 via-slate-300 to-slate-200 bg-clip-text text-transparent',
          chipColor: 'bg-linear-to-tr from-slate-300 to-slate-100',
        };
      default: // Member
        return {
          gradient: 'from-emerald-950 via-stone-900 to-teal-950',
          accent: 'text-emerald-300',
          border: 'border-emerald-600/40 ring-1 ring-emerald-500/20',
          foil: 'bg-linear-to-r from-emerald-100 via-emerald-300 to-teal-200 bg-clip-text text-transparent',
          chipColor: 'bg-linear-to-tr from-emerald-400 to-teal-200',
        };
    }
  };

  const theme = getCardTheme();

  // Progress to next tier
  let progressPercent = 100;
  let spendingRemaining = 0;
  if (nextTier) {
    const required = nextTier.minSpending;
    const current = member.totalSpending;
    progressPercent = Math.min(100, Math.round((current / required) * 100));
    spendingRemaining = Math.max(0, required - current);
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Physical-Feel VIP Membership Card */}
      <div
        className={`relative aspect-[1.586/1] w-full rounded-2xl bg-linear-to-br ${theme.gradient} ${theme.border} p-6 sm:p-7 text-white shadow-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between`}
      >
        {/* Subtle Luxury Pattern Lines Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Card Header */}
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1 px-2 rounded-xl bg-white shadow-sm border border-stone-200/60">
              <LombokGardenLogo variant="horizontal" size="sm" />
            </div>
          </div>

          {/* Tier Label */}
          <div className="text-right">
            <span
              className={`font-serif-luxury text-sm sm:text-base font-extrabold uppercase tracking-wider ${theme.foil} block`}
            >
              {tier.name}
            </span>
            <span className="text-[9px] font-mono tracking-widest text-stone-400 uppercase">
              Tier Level {tier.level}
            </span>
          </div>
        </div>

        {/* Middle Zone: EMV Chip & QR Quick Thumb */}
        <div className="relative z-10 flex items-center justify-between my-2">
          {/* Decorative Gold Chip */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-7 sm:w-11 sm:h-8 rounded-md ${theme.chipColor} shadow-inner flex flex-col justify-around p-1 border border-stone-800/40`}
            >
              <div className="h-0.5 bg-stone-900/30 w-full" />
              <div className="h-0.5 bg-stone-900/30 w-3/4" />
              <div className="h-0.5 bg-stone-900/30 w-1/2" />
            </div>
            <Sparkles className="w-4 h-4 text-amber-400/80" />
          </div>

          {/* Quick QR code thumbnail with click to expand */}
          <button
            type="button"
            onClick={() => setShowFullQR(true)}
            className="flex items-center gap-1.5 bg-stone-900/80 hover:bg-stone-800/90 text-stone-200 border border-stone-700/60 rounded-lg p-1.5 transition-colors group cursor-pointer"
            title="Klik untuk memperbesar QR Code"
          >
            <div className="w-9 h-9 bg-white rounded p-0.5 flex items-center justify-center">
              <QRCodeView value={member.membershipNumber} size={32} showLogo={false} />
            </div>
            <Maximize2 className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-400 mr-1" />
          </button>
        </div>

        {/* Bottom Details */}
        <div className="relative z-10">
          {/* Membership Number */}
          <div className="font-mono text-base sm:text-xl font-bold tracking-widest text-stone-100 drop-shadow-sm">
            {member.membershipNumber}
          </div>

          {/* Name & Expiry */}
          <div className="flex items-end justify-between mt-2 pt-2 border-t border-stone-800/60">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-stone-400 font-medium">
                Nama Anggota
              </div>
              <div className="text-xs sm:text-sm font-semibold tracking-wide text-stone-100 uppercase truncate max-w-[200px] sm:max-w-[260px]">
                {member.fullName}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-stone-400 font-medium">
                Berlaku Hingga
              </div>
              <div className="text-[11px] sm:text-xs font-mono font-semibold text-stone-200">
                {formatDateIndo(member.membershipEndDate)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Progress Bar to Next Tier */}
      {nextTier && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-stone-700 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              Progres Menuju <strong className="text-stone-900">{nextTier.name}</strong>
            </span>
            <span className="font-mono text-stone-600 font-semibold">
              {progressPercent}%
            </span>
          </div>

          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-[11px] text-stone-500">
            <span>
              Terkumpul:{' '}
              <strong className="text-stone-800 font-mono">
                Rp {member.totalSpending.toLocaleString('id-ID')}
              </strong>
            </span>
            <span>
              Kurang:{' '}
              <strong className="text-amber-800 font-mono">
                Rp {spendingRemaining.toLocaleString('id-ID')}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setShowFullQR(true)}
          className="flex-1 py-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <QrCode className="w-4 h-4 text-amber-400" />
          <span>Tampilkan QR Member</span>
        </button>

        {onViewBenefits && (
          <button
            onClick={onViewBenefits}
            className="py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Lihat Benefit
          </button>
        )}
      </div>

      {/* Full-Screen QR Modal for Front Desk Staff Scan */}
      <Modal
        isOpen={showFullQR}
        onClose={() => setShowFullQR(false)}
        title="QR Code Membership Tamu"
        subtitle="Tunjukkan kepada front desk saat check-in, transaksi restoran, atau spa"
        maxWidth="sm"
      >
        <div className="text-center py-4 flex flex-col items-center">
          <QRCodeView
            value={member.membershipNumber}
            size={220}
            className="mb-4"
          />

          <div className="font-mono text-lg font-bold text-stone-900 tracking-wider">
            {member.membershipNumber}
          </div>
          <div className="font-semibold text-stone-800 mt-1">
            {member.fullName}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            Tier: <strong className="text-amber-700">{tier.name}</strong> ·{' '}
            {member.availablePoints} Poin Tersedia
          </div>

          <p className="text-[11px] text-stone-400 max-w-xs mt-4 leading-relaxed">
            Staff resepsionis dapat memindai kode QR ini langsung untuk verifikasi
            keanggotaan, penambahan poin, dan aktivasi benefit diskon.
          </p>
        </div>
      </Modal>
    </div>
  );
};
