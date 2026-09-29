import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Member, MembershipTier } from '../../types';
import { Modal } from '../common/Modal';
import { QRCodeView } from '../common/QRCodeView';
import { formatDateIndo } from '../../services/membershipEngine';
import {
  Search,
  CheckCircle,
  AlertCircle,
  BedDouble,
  Receipt,
  Coins,
  UserCheck,
  Sparkles,
} from 'lucide-react';

interface FrontDeskScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionCheckIn: (member: Member) => void;
  onActionAddTransaction: (member: Member) => void;
  onActionAdjustPoints: (member: Member) => void;
  onActionViewProfile: (member: Member) => void;
}

export const FrontDeskScannerModal: React.FC<FrontDeskScannerModalProps> = ({
  isOpen,
  onClose,
  onActionCheckIn,
  onActionAddTransaction,
  onActionAdjustPoints,
  onActionViewProfile,
}) => {
  const { members, tiers } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Quick select initial member when modal opens
  React.useEffect(() => {
    if (isOpen && !selectedMember && members.length > 0) {
      setSelectedMember(members[0]);
    }
  }, [isOpen, members, selectedMember]);

  const filteredMembers = members.filter(
    (m) =>
      m.membershipNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
  );

  const currentTier: MembershipTier = selectedMember
    ? tiers.find((t) => t.id === selectedMember.tierId) || tiers[0]
    : tiers[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Front Desk QR Scanner & Member Verification"
      subtitle="Pindai atau cari member untuk verifikasi benefit dan proses operasional"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Search / Scan Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik Nomor Member (LGH-...), Nama Tamu, atau No. Telepon..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700"
          />
        </div>

        {/* Quick Member Selection Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-stone-400 shrink-0 font-medium text-[11px]">
            Tamu Terdaftar:
          </span>
          {members.slice(0, 6).map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMember(m)}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                selectedMember?.id === m.id
                  ? 'bg-stone-900 text-amber-300 font-semibold shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {m.fullName.split(' ')[0]} ({m.membershipNumber})
            </button>
          ))}
        </div>

        {/* Verification Card */}
        {selectedMember ? (
          <div className="bg-stone-50/80 rounded-2xl border border-stone-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-900 text-amber-300 font-serif-luxury font-bold text-lg flex items-center justify-center shadow-xs">
                  {selectedMember.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-stone-900">
                      {selectedMember.fullName}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        selectedMember.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedMember.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-stone-500 mt-0.5">
                    {selectedMember.membershipNumber} · {selectedMember.phone}
                  </div>
                </div>
              </div>

              {/* Tier Badge */}
              <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                    Tier Membership
                  </div>
                  <div className="text-xs font-bold text-stone-900 font-serif-luxury">
                    {currentTier.name} (Lvl {currentTier.level})
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-stone-200">
                <div className="text-[10px] text-stone-400 font-medium uppercase">
                  Poin Tersedia
                </div>
                <div className="text-sm font-bold text-amber-700 font-mono mt-0.5">
                  {selectedMember.availablePoints.toLocaleString('id-ID')} pts
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200">
                <div className="text-[10px] text-stone-400 font-medium uppercase">
                  Total Spending
                </div>
                <div className="text-sm font-bold text-stone-900 font-mono mt-0.5">
                  Rp {(selectedMember.totalSpending / 1000000).toFixed(1)} Jt
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200">
                <div className="text-[10px] text-stone-400 font-medium uppercase">
                  Total Kunjungan
                </div>
                <div className="text-sm font-bold text-stone-900 font-mono mt-0.5">
                  {selectedMember.totalVisits}x Menginap
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200">
                <div className="text-[10px] text-stone-400 font-medium uppercase">
                  Masa Berlaku
                </div>
                <div className="text-[11px] font-semibold text-stone-700 font-mono mt-0.5">
                  {formatDateIndo(selectedMember.membershipEndDate)}
                </div>
              </div>
            </div>

            {/* Active Tier Benefits preview for Front Office Staff */}
            <div className="bg-white p-3.5 rounded-xl border border-stone-200">
              <div className="text-[11px] font-semibold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Benefit Aktif yang Berhak Diberikan ke Tamu:
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-stone-600">
                {currentTier.benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Staff Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  onActionCheckIn(selectedMember);
                  onClose();
                }}
                className="py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <BedDouble className="w-3.5 h-3.5" />
                <span>Check-In Stay</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onActionAddTransaction(selectedMember);
                  onClose();
                }}
                className="py-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>Catat Belanja</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onActionAdjustPoints(selectedMember);
                  onClose();
                }}
                className="py-2.5 px-3 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>Sesuaikan Poin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onActionViewProfile(selectedMember);
                  onClose();
                }}
                className="py-2.5 px-3 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-stone-500" />
                <span>Detail Profil</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
            Pilih atau ketik member di atas untuk verifikasi kartu
          </div>
        )}
      </div>
    </Modal>
  );
};
