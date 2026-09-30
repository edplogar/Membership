import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Reward, Voucher, PromotionCampaign, VoucherRedemption } from '../../types';
import { formatIDR, formatDateIndo } from '../../services/membershipEngine';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { VoucherScannerModal } from './VoucherScannerModal';
import { exportToCSV } from '../../services/exportService';
import {
  Gift,
  Ticket,
  Tag,
  Plus,
  Edit2,
  Trash2,
  Coins,
  Sparkles,
  History,
  ScanLine,
  QrCode,
  CheckCircle2,
  Clock,
  Building2,
  UtensilsCrossed,
  Flower2,
  Search,
  Download,
  ShieldCheck,
  AlertCircle,
  Lock,
} from 'lucide-react';

export const RewardsAndVouchersManagement: React.FC = () => {
  const {
    rewards,
    vouchers,
    promotions,
    tiers,
    members,
    voucherRedemptions,
    redemptions,
    saveReward,
    deleteReward,
    saveVoucher,
    deleteVoucher,
    savePromotion,
    deletePromotion,
  } = useApp();
  const { currentUser, hasPermission } = useAuth();

  // Rule enforcement: Check if current staff is restricted to barcode scan only (FO / FB staff)
  const isScanOnlyStaff =
    hasPermission('voucher.scan_only') ||
    currentUser?.roleId === 'role_front_office' ||
    currentUser?.roleId === 'role_food_beverage' ||
    currentUser?.department?.toLowerCase().includes('front office') ||
    currentUser?.department?.toLowerCase().includes('food') ||
    currentUser?.department?.toLowerCase().includes('f&b');

  const [activeTab, setActiveTab] = useState<'rewards' | 'vouchers' | 'promotions' | 'history'>('vouchers');
  const [isVoucherScannerOpen, setIsVoucherScannerOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyOutletFilter, setHistoryOutletFilter] = useState('all');

  // Modals state
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [editingPromo, setEditingPromo] = useState<PromotionCampaign | null>(null);

  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; name: string } | null>(null);

  // New templates
  const defaultReward: Reward = {
    id: `rew_${Date.now()}`,
    title: 'Diskon F&B Rp 100.000',
    description: 'Voucher santap di Restoran Teratai Garden.',
    category: 'fnb',
    pointsRequired: 1000,
    stock: 50,
    validityDays: 60,
    terms: 'Minimum transaksi Rp 250.000',
    status: 'active',
    icon: 'Utensils',
  };

  const defaultVoucher: Voucher = {
    id: `vch_${Date.now()}`,
    code: `PROMO-${Math.floor(100 + Math.random() * 900)}`,
    title: 'Diskon Spesial Menginap 20%',
    description: 'Potongan menginap untuk member aktif.',
    type: 'percent',
    discountValue: 20,
    minTransaction: 1000000,
    maxDiscount: 400000,
    startDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    usageLimit: 200,
    usedCount: 0,
    perMemberLimit: 1,
    applicableTierIds: ['tier_member', 'tier_silver', 'tier_gold', 'tier_platinum'],
    status: 'active',
  };

  const defaultPromo: PromotionCampaign = {
    id: `promo_${Date.now()}`,
    title: 'Promosi Musim Liburan',
    description: 'Nikmati ekstra poin dan benefit khusus.',
    gradientBg: 'from-emerald-900 to-stone-900',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    applicableTierIds: ['tier_gold', 'tier_platinum'],
    pointsMultiplier: 2.0,
    discountText: 'Bonus Poin 2x',
    terms: 'Berlaku otomatis saat check-in.',
    status: 'active',
  };

  const handleSaveReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReward) saveReward(editingReward);
    setEditingReward(null);
  };

  const handleSaveVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVoucher) saveVoucher(editingVoucher);
    setEditingVoucher(null);
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPromo) savePromotion(editingPromo);
    setEditingPromo(null);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'reward') deleteReward(itemToDelete.id);
    if (itemToDelete.type === 'voucher') deleteVoucher(itemToDelete.id);
    if (itemToDelete.type === 'promo') deletePromotion(itemToDelete.id);
    setItemToDelete(null);
  };

  // Filtered redemptions for Tab 4: Riwayat Redeem Barcode
  const usedRedemptions = voucherRedemptions.filter((r) => r.status === 'used');
  const filteredRedemptions = usedRedemptions.filter((r) => {
    const member = members.find((m) => m.id === r.memberId);
    const voucherDef = vouchers.find((v) => v.id === r.voucherId || v.code === r.voucherCode);
    const searchLower = historySearchQuery.toLowerCase();

    const matchesSearch =
      r.voucherCode.toLowerCase().includes(searchLower) ||
      (r.transactionNumber && r.transactionNumber.toLowerCase().includes(searchLower)) ||
      (r.redeemedByStaffName && r.redeemedByStaffName.toLowerCase().includes(searchLower)) ||
      (member && member.fullName.toLowerCase().includes(searchLower)) ||
      (member && member.membershipNumber.toLowerCase().includes(searchLower)) ||
      (voucherDef && voucherDef.title.toLowerCase().includes(searchLower));

    const matchesOutlet = historyOutletFilter === 'all' || r.outlet === historyOutletFilter;

    return matchesSearch && matchesOutlet;
  });

  const handleExportRedemptionCSV = () => {
    const headers = [
      'ID Redemption',
      'Waktu Digunakan',
      'Nama Member',
      'No. Member',
      'Kode Barcode Voucher',
      'Judul Voucher',
      'Outlet',
      'Staf Pemroses',
      'Diskon (IDR)',
      'No. Ref Tagihan',
      'Catatan',
    ];
    const rows = filteredRedemptions.map((r) => {
      const m = members.find((mem) => mem.id === r.memberId);
      const v = vouchers.find((vch) => vch.id === r.voucherId || vch.code === r.voucherCode);
      return [
        r.id,
        r.usedAt || r.claimedAt,
        m?.fullName || 'Tamu Hotel',
        m?.membershipNumber || '-',
        r.voucherCode,
        v?.title || '-',
        r.outlet || 'Front Desk',
        r.redeemedByStaffName || '-',
        r.discountApplied || 0,
        r.transactionNumber || '-',
        r.notes || '-',
      ];
    });
    exportToCSV('LGH_Riwayat_Redeem_Voucher', headers, rows);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-luxury text-2xl font-bold text-stone-900">
            Katalog Reward, Voucher & Kampanye Promo
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Kelola katalog penukaran poin, kupon diskon, riwayat redeem barcode, dan kampanye promosi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsVoucherScannerOpen(true)}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            title="Buka scanner barcode untuk memvalidasi dan me-redeem voucher tamu"
          >
            <ScanLine className="w-4 h-4 text-emerald-300" />
            <span>Pindai Barcode Voucher</span>
          </button>
        </div>
      </div>

      {/* Compliance Rule Banner for FO / FB Staff */}
      {isScanOnlyStaff && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <span>Rule Akses Staf FO / FB Aktif: Validasi Wajib Via Barcode Scan</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono font-bold uppercase">
                  Scan-Only Rule
                </span>
              </div>
              <p className="text-amber-800 mt-1 leading-relaxed">
                Sesuai SOP Hotel Lombok Garden, staf Front Office (FO) dan Food & Beverage (FB) hanya berhak melakukan penukaran/redeem voucher menggunakan metode <strong>Scan Barcode / QR resmi tamu</strong>. Pembuatan atau pengeditan master voucher dikunci khusus Super Admin & Manajer.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsVoucherScannerOpen(true)}
            className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Pindai Barcode</span>
          </button>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'vouchers'
              ? 'bg-white text-stone-900 shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Ticket className="w-3.5 h-3.5 text-emerald-700" />
          <span>Kupon Voucher ({vouchers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'rewards'
              ? 'bg-white text-stone-900 shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Gift className="w-3.5 h-3.5 text-amber-600" />
          <span>Reward Poin ({rewards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('promotions')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'promotions'
              ? 'bg-white text-stone-900 shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Promosi ({promotions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'history'
              ? 'bg-white text-stone-900 shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <History className="w-3.5 h-3.5 text-amber-600" />
          <span>Riwayat Redeem Barcode ({voucherRedemptions.filter((r) => r.status === 'used').length})</span>
        </button>
      </div>

      {/* TAB 1: Rewards */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-800">
              Katalog Hadiah yang Dapat Ditukar dengan Poin
            </h3>
            {!isScanOnlyStaff ? (
              <button
                onClick={() => setEditingReward(defaultReward)}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Reward Baru</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsVoucherScannerOpen(true)}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Pindai Barcode Tamu</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rewards.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md">
                      {r.pointsRequired.toLocaleString('id-ID')} Poin
                    </span>
                    {!isScanOnlyStaff ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingReward(r)}
                          className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setItemToDelete({ type: 'reward', id: r.id, name: r.title })
                          }
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsVoucherScannerOpen(true)}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-bold border border-emerald-200 flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3 h-3 text-emerald-600" />
                        <span>Redeem Barcode</span>
                      </button>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-stone-900 mt-3">
                    {r.title}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {r.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-mono">
                  <span>Stok: {r.stock} kuota</span>
                  <span>Masa: {r.validityDays} hari</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Vouchers */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-800">
              Daftar Kupon & Voucher Diskon Hotel
            </h3>
            {isScanOnlyStaff ? (
              <button
                type="button"
                onClick={() => setIsVoucherScannerOpen(true)}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ScanLine className="w-4 h-4 text-emerald-300" />
                <span>Pindai Barcode Tamu</span>
              </button>
            ) : (
              <button
                onClick={() => setEditingVoucher(defaultVoucher)}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Voucher Baru</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {vouchers.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                      {v.type === 'percent'
                        ? `Diskon ${v.discountValue}%`
                        : v.type === 'complimentary'
                        ? 'Complimentary'
                        : `Potongan ${formatIDR(v.discountValue)}`}
                    </span>
                    {!isScanOnlyStaff ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingVoucher(v)}
                          className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setItemToDelete({ type: 'voucher', id: v.id, name: v.title })
                          }
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsVoucherScannerOpen(true)}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-bold border border-emerald-200 flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3 h-3 text-emerald-600" />
                        <span>Redeem Barcode</span>
                      </button>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-stone-900 mt-3">
                    {v.title}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {v.description}
                  </p>

                  <div className="mt-3 text-xs font-mono text-stone-500">
                    Kode Promo: <strong className="text-stone-800">{v.code}</strong>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                  <span>Terpakai: {v.usedCount}x</span>
                  <span>Kadaluwarsa: {formatDateIndo(v.expiryDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Promotions */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-800">
              Kampanye Promosi Poin & Diskon Musiman
            </h3>
            {!isScanOnlyStaff ? (
              <button
                onClick={() => setEditingPromo(defaultPromo)}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Kampanye Promo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsVoucherScannerOpen(true)}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Pindai Barcode Tamu</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {promotions.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                      {p.discountText || 'Promo'}
                    </span>
                    {!isScanOnlyStaff ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingPromo(p)}
                          className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setItemToDelete({ type: 'promo', id: p.id, name: p.title })
                          }
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsVoucherScannerOpen(true)}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-bold border border-emerald-200 flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3 h-3 text-emerald-600" />
                        <span>Redeem Barcode</span>
                      </button>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-stone-900 mt-3">
                    {p.title}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                  <span>Multiplier: {p.pointsMultiplier || 1}x</span>
                  <span>Hingga: {formatDateIndo(p.endDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Riwayat Redeem Barcode Voucher */}
      {activeTab === 'history' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Total Voucher Diredeem
                </span>
                <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">
                  {usedRedemptions.length} Voucher
                </div>
                <span className="text-[11px] text-stone-500 mt-0.5 block">
                  Tervalidasi via Barcode Scan
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Total Potongan Diberikan
                </span>
                <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
                  {formatIDR(
                    usedRedemptions.reduce((sum, r) => sum + (r.discountApplied || 0), 0)
                  )}
                </div>
                <span className="text-[11px] text-stone-500 mt-0.5 block">
                  Nilai diskon dinikmati tamu
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  SOP Validasi
                </span>
                <div className="text-base font-bold text-stone-900 mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Barcode Gun & QR</span>
                </div>
                <span className="text-[11px] text-stone-500 mt-0.5 block">
                  100% Tercatat Log Audit & FO/FB
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherScannerOpen(true)}
                className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Scan Sekarang
              </button>
            </div>
          </div>

          {/* Filters & Export Bar */}
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Cari kode voucher, nama member, staff pemroses, no. tagihan..."
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={historyOutletFilter}
                onChange={(e) => setHistoryOutletFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
              >
                <option value="all">Semua Outlet</option>
                <option value="Front Desk">Front Desk (FO)</option>
                <option value="Restaurant & Bar">Restoran & Bar (FB)</option>
                <option value="Spa & Wellness">Spa & Wellness</option>
              </select>

              <button
                type="button"
                onClick={handleExportRedemptionCSV}
                className="px-3.5 py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Waktu Redeem</th>
                    <th className="px-5 py-3.5">Nama Member</th>
                    <th className="px-5 py-3.5">Voucher & Barcode</th>
                    <th className="px-5 py-3.5">Outlet</th>
                    <th className="px-5 py-3.5">Petugas / Staff</th>
                    <th className="px-5 py-3.5 text-right">Potongan Diskon</th>
                    <th className="px-5 py-3.5">No. Tagihan</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredRedemptions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-500">
                        Tidak ada riwayat penukaran voucher yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredRedemptions.map((red) => {
                      const member = members.find((m) => m.id === red.memberId);
                      const voucherDef = vouchers.find(
                        (v) => v.id === red.voucherId || v.code === red.voucherCode
                      );
                      const tier = tiers.find((t) => t.id === member?.tierId);

                      return (
                        <tr key={red.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-stone-600 whitespace-nowrap">
                            {formatDateIndo(red.usedAt ? red.usedAt.slice(0, 10) : red.claimedAt.slice(0, 10))}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-stone-900">
                              {member?.fullName || 'Tamu Hotel'}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>{member?.membershipNumber || '-'}</span>
                              {tier && (
                                <span className="bg-stone-100 px-1.5 py-0.2 rounded text-stone-600">
                                  {tier.name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-stone-800">
                              {voucherDef?.title || red.voucherCode}
                            </div>
                            <span className="font-mono text-[10px] font-bold bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 text-stone-700 mt-0.5 inline-block">
                              {red.voucherCode}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 font-medium text-stone-700">
                              {red.outlet === 'Restaurant & Bar' ? (
                                <UtensilsCrossed className="w-3 h-3 text-amber-600" />
                              ) : red.outlet === 'Spa & Wellness' ? (
                                <Flower2 className="w-3 h-3 text-purple-600" />
                              ) : (
                                <Building2 className="w-3 h-3 text-emerald-600" />
                              )}
                              <span>{red.outlet || 'Front Desk'}</span>
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-stone-800">
                              {red.redeemedByStaffName || 'Staff FO'}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono">
                              {red.redeemedByStaffRole || 'Hotel Staff'}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                            {red.discountApplied ? formatIDR(red.discountApplied) : '-'}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                            {red.transactionNumber ? `#${red.transactionNumber}` : '-'}
                          </td>
                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold">
                              DIGUNAKAN
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reward Modal */}
      {editingReward && (
        <Modal
          isOpen={true}
          onClose={() => setEditingReward(null)}
          title="Konfigurasi Reward Poin"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveReward} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Judul Hadiah / Reward *
              </label>
              <input
                type="text"
                value={editingReward.title}
                onChange={(e) =>
                  setEditingReward({ ...editingReward, title: e.target.value })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Poin yang Diperlukan *
                </label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={editingReward.pointsRequired}
                  onChange={(e) =>
                    setEditingReward({
                      ...editingReward,
                      pointsRequired: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Stok Kuota Hadiah
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingReward.stock}
                  onChange={(e) =>
                    setEditingReward({
                      ...editingReward,
                      stock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Deskripsi Lengkap
              </label>
              <textarea
                rows={2}
                value={editingReward.description}
                onChange={(e) =>
                  setEditingReward({ ...editingReward, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setEditingReward(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl"
              >
                Simpan Reward
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Voucher Modal */}
      {editingVoucher && (
        <Modal
          isOpen={true}
          onClose={() => setEditingVoucher(null)}
          title="Konfigurasi Kupon Voucher"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveVoucher} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Kode Kupon Voucher *
                </label>
                <input
                  type="text"
                  value={editingVoucher.code}
                  onChange={(e) =>
                    setEditingVoucher({
                      ...editingVoucher,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tipe Diskon
                </label>
                <select
                  value={editingVoucher.type}
                  onChange={(e: any) =>
                    setEditingVoucher({ ...editingVoucher, type: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                >
                  <option value="percent">Persentase (%)</option>
                  <option value="fixed">Nominal Tetap (IDR)</option>
                  <option value="complimentary">Complimentary Service</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nama Voucher *
              </label>
              <input
                type="text"
                value={editingVoucher.title}
                onChange={(e) =>
                  setEditingVoucher({ ...editingVoucher, title: e.target.value })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nilai Diskon (% atau IDR)
                </label>
                <input
                  type="number"
                  value={editingVoucher.discountValue}
                  onChange={(e) =>
                    setEditingVoucher({
                      ...editingVoucher,
                      discountValue: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Minimal Transaksi (IDR)
                </label>
                <input
                  type="number"
                  value={editingVoucher.minTransaction}
                  onChange={(e) =>
                    setEditingVoucher({
                      ...editingVoucher,
                      minTransaction: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setEditingVoucher(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl"
              >
                Simpan Voucher
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Hapus ${itemToDelete?.name}?`}
        message="Item ini akan dihapus dari sistem."
        confirmText="Hapus Sekarang"
        isDestructive
      />
      {/* Voucher Barcode Scanner Modal */}
      <VoucherScannerModal
        isOpen={isVoucherScannerOpen}
        onClose={() => setIsVoucherScannerOpen(false)}
      />
    </div>
  );
};
