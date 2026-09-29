import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Building2,
  UserCheck,
  QrCode,
  RotateCcw,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface DemoRoleBarProps {
  onOpenScanner: () => void;
  onOpenLogin?: () => void;
}

export const DemoRoleBar: React.FC<DemoRoleBarProps> = ({ onOpenScanner }) => {
  const { currentUser, userRole, logout } = useAuth();
  const { resetAllData } = useApp();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="bg-stone-900 border-b border-stone-800 text-stone-200 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
      <div className="flex items-center gap-2.5">
        <span className="font-serif-luxury text-emerald-400 font-bold tracking-wider text-[11px] uppercase flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Sesi Terotentikasi
        </span>
        <span className="text-stone-600 hidden sm:inline">|</span>
        <span className="text-stone-300 flex items-center gap-2">
          <span>Pengguna: <strong className="text-white">{currentUser?.name}</strong></span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
            userRole === 'SUPER_ADMIN'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : userRole === 'ADMIN'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-stone-700 text-stone-200'
          }`}>
            {userRole === 'SUPER_ADMIN' ? 'Super Admin' : userRole === 'ADMIN' ? 'Admin Hotel' : 'Member Tamu'}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Front Desk Barcode Scanner (for staff/admin) */}
        {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
          <button
            onClick={onOpenScanner}
            className="px-2.5 py-1 rounded-md bg-[#00A651] hover:bg-[#009647] text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Scan QR Code / Barcode Kartu Member"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan Kartu Member</span>
          </button>
        )}

        {/* Keluar / Ganti Akun */}
        <button
          onClick={logout}
          className="px-2.5 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Keluar dari sesi ini dan buka Halaman Login"
        >
          <LogOut className="w-3.5 h-3.5 text-stone-400" />
          <span>Ganti Akun / Logout</span>
        </button>

        {/* Reset System Data (Only for Super Admin) */}
        {userRole === 'SUPER_ADMIN' && (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="p-1 rounded-md hover:bg-stone-800 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Reset Data Demo ke Kondisi Awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showResetConfirm && (
        <ConfirmDialog
          isOpen={showResetConfirm}
          title="Reset Seluruh Data Sistem?"
          message="Tindakan ini akan mengembalikan data member, tier, transaksi, benefit, dan log ke kondisi awal bawaan hotel."
          confirmText="Ya, Reset Data"
          cancelText="Batal"
          isDestructive={true}
          onConfirm={() => {
            resetAllData();
            setShowResetConfirm(false);
          }}
          onClose={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
};
