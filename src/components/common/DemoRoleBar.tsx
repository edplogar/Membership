import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Building2,
  UserCheck,
  QrCode,
  RotateCcw,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface DemoRoleBarProps {
  onOpenScanner: () => void;
}

export const DemoRoleBar: React.FC<DemoRoleBarProps> = ({ onOpenScanner }) => {
  const { currentUser, switchDemoRole } = useAuth();
  const { resetAllData, members } = useApp();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const keyMembers = members.slice(0, 5);

  return (
    <div className="bg-stone-900 border-b border-stone-800 text-stone-200 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <span className="font-serif-luxury text-amber-400 font-bold tracking-wider text-[11px] uppercase flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Demo Role Switcher
        </span>
        <span className="text-stone-600 hidden sm:inline">|</span>
        <span className="text-stone-400 hidden md:inline">
          Aktif: <strong className="text-white">{currentUser?.name}</strong> (
          <span className="text-amber-300 font-mono">{currentUser?.role}</span>)
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Super Admin */}
        <button
          onClick={() => switchDemoRole('SUPER_ADMIN')}
          className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
            currentUser?.role === 'SUPER_ADMIN'
              ? 'bg-amber-500 text-stone-950 font-semibold shadow-xs'
              : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
          }`}
          title="Super Admin (Akses Penuh Seluruh Sistem)"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Super Admin</span>
        </button>

        {/* Hotel Admin */}
        <button
          onClick={() => switchDemoRole('ADMIN')}
          className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
            currentUser?.role === 'ADMIN'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
          }`}
          title="Admin Hotel / Front Office"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Admin Hotel</span>
        </button>

        {/* Member dropdown / Direct switch */}
        <div className="relative">
          <button
            onClick={() => setShowMemberDropdown(!showMemberDropdown)}
            className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              currentUser?.role === 'MEMBER'
                ? 'bg-stone-200 text-stone-900 font-semibold shadow-xs'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>
              {currentUser?.role === 'MEMBER'
                ? `Member (${currentUser.name.split(' ')[0]})`
                : 'Pilih Guest Member'}
            </span>
            <ChevronDown className="w-3 h-3 text-stone-400" />
          </button>

          {showMemberDropdown && (
            <div className="absolute right-0 mt-1 w-64 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-stone-400 border-b border-stone-800">
                Pilih Akun Tamu Demo
              </div>
              {keyMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    switchDemoRole(m.id);
                    setShowMemberDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-stone-800 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="font-semibold text-stone-100">{m.fullName}</div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      {m.membershipNumber} · {m.availablePoints} pts
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      m.tierId === 'tier_platinum'
                        ? 'bg-purple-950 text-purple-300'
                        : m.tierId === 'tier_gold'
                        ? 'bg-amber-950 text-amber-300'
                        : m.tierId === 'tier_silver'
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-emerald-950 text-emerald-300'
                    }`}
                  >
                    {m.tierId.replace('tier_', '')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Front Desk QR Scanner Shortcut */}
        <button
          onClick={onOpenScanner}
          className="px-2.5 py-1 rounded-md font-medium bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 border border-amber-700/50 flex items-center gap-1.5 transition-colors"
          title="Buka QR Code Scanner Front Desk"
        >
          <QrCode className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">QR Scan Staff</span>
        </button>

        {/* Reset Demo Data */}
        <button
          onClick={() => setShowResetConfirm(true)}
          className="p-1 rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors ml-1"
          title="Reset Semua Data ke Default Awal"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={resetAllData}
        title="Reset Data Demo?"
        message="Tindakan ini akan mengembalikan semua member, transaksi, poin, dan pengaturan hotel ke data benih default Lombok Garden Hotel."
        confirmText="Reset Data Sekarang"
        isDestructive
      />
    </div>
  );
};
