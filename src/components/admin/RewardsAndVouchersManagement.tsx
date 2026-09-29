import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Reward, Voucher, PromotionCampaign } from '../../types';
import { formatIDR, formatDateIndo } from '../../services/membershipEngine';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Gift,
  Ticket,
  Tag,
  Plus,
  Edit2,
  Trash2,
  Coins,
  Sparkles,
} from 'lucide-react';

export const RewardsAndVouchersManagement: React.FC = () => {
  const {
    rewards,
    vouchers,
    promotions,
    tiers,
    saveReward,
    deleteReward,
    saveVoucher,
    deleteVoucher,
    savePromotion,
    deletePromotion,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'rewards' | 'vouchers' | 'promotions'>('rewards');

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

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-luxury text-2xl font-bold text-stone-900">
            Katalog Reward, Voucher & Kampanye Promo
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Kelola katalog penukaran poin, kupon diskon, dan kampanye promosi berjangka.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'rewards'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Reward Poin ({rewards.length})
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'vouchers'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Kupon Voucher ({vouchers.length})
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'promotions'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Promosi ({promotions.length})
          </button>
        </div>
      </div>

      {/* TAB 1: Rewards */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-800">
              Katalog Hadiah yang Dapat Ditukar dengan Poin
            </h3>
            <button
              onClick={() => setEditingReward(defaultReward)}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Reward Baru</span>
            </button>
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingReward(r)}
                        className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setItemToDelete({ type: 'reward', id: r.id, name: r.title })
                        }
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
            <button
              onClick={() => setEditingVoucher(defaultVoucher)}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Voucher Baru</span>
            </button>
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingVoucher(v)}
                        className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setItemToDelete({ type: 'voucher', id: v.id, name: v.title })
                        }
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
            <button
              onClick={() => setEditingPromo(defaultPromo)}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Kampanye Promo</span>
            </button>
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingPromo(p)}
                        className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setItemToDelete({ type: 'promo', id: p.id, name: p.title })
                        }
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
    </div>
  );
};
