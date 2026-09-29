import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Transaction, Member } from '../../types';
import { formatIDR, formatDateIndo, calculatePointsEarned } from '../../services/membershipEngine';
import { Modal } from '../common/Modal';
import { Receipt, Plus, Search, Download, Sparkles, Coins } from 'lucide-react';
import { exportToCSV } from '../../services/exportService';

interface TransactionManagementProps {
  preselectedMember?: Member | null;
  isOpenNewTxModal?: boolean;
  onCloseNewTxModal?: () => void;
}

export const TransactionManagement: React.FC<TransactionManagementProps> = ({
  preselectedMember,
  isOpenNewTxModal = false,
  onCloseNewTxModal,
}) => {
  const { transactions, members, tiers, pointRules, promotions, recordTransaction } = useApp();
  const { currentUser } = useAuth();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  const isModalOpen = isOpenNewTxModal || internalModalOpen;
  const handleCloseModal = () => {
    setInternalModalOpen(false);
    if (onCloseNewTxModal) onCloseNewTxModal();
  };

  const [formData, setFormData] = useState({
    memberId: preselectedMember?.id || (members[0]?.id || ''),
    transactionNumber: `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().slice(0, 10),
    category: 'restaurant' as Transaction['category'],
    amount: 750000,
    paymentMethod: 'Credit Card' as Transaction['paymentMethod'],
    staffName: currentUser?.name || 'Front Desk Staff',
    referenceNumber: 'BILL-8890',
    notes: '',
  });

  React.useEffect(() => {
    if (preselectedMember) {
      setFormData((prev) => ({ ...prev, memberId: preselectedMember.id }));
    }
  }, [preselectedMember]);

  // Live points calculator preview for staff
  const selectedMember = members.find((m) => m.id === formData.memberId) || members[0];
  const selectedTier = tiers.find((t) => t.id === selectedMember?.tierId) || tiers[0];
  const pointCalcPreview = calculatePointsEarned(
    formData.amount,
    selectedTier,
    pointRules,
    promotions
  );

  const filteredTxs = transactions.filter((tx) => {
    const member = members.find((m) => m.id === tx.memberId);
    const matchSearch =
      tx.transactionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member?.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === 'all' || tx.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordTransaction(formData);
    handleCloseModal();
  };

  const handleExportCSV = () => {
    const headers = [
      'No. Transaksi',
      'Member',
      'Tanggal',
      'Kategori',
      'Metode Bayar',
      'Jumlah (IDR)',
      'Poin Diperoleh',
      'Referensi',
      'Staf',
    ];
    const rows = filteredTxs.map((t) => {
      const m = members.find((mem) => mem.id === t.memberId);
      return [
        t.transactionNumber,
        m?.fullName || '-',
        t.date,
        t.category,
        t.paymentMethod,
        t.amount,
        t.pointsEarned,
        t.referenceNumber,
        t.staffName,
      ];
    });
    exportToCSV('LGH_Data_Transaksi', headers, rows);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-luxury text-2xl font-bold text-stone-900">
            Pencatatan Transaksi & Perolehan Poin
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Mencatat transaksi belanja member di seluruh outlet kamar, restoran, bar, dan spa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => setInternalModalOpen(true)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Catat Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi, member, referensi tagihan..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-stone-400 text-xs font-semibold whitespace-nowrap">
            Kategori:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
          >
            <option value="all">Semua Kategori</option>
            <option value="room">Room / Kamar</option>
            <option value="restaurant">Restoran Teratai</option>
            <option value="spa">Garden Sanctuary Spa</option>
            <option value="bar">Sasak Poolside Bar</option>
            <option value="laundry">Laundry</option>
            <option value="meeting">Meeting / Banquet</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">No. Tagihan</th>
                <th className="px-5 py-3.5">Nama Member</th>
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5">Metode Bayar</th>
                <th className="px-5 py-3.5 text-right">Jumlah (IDR)</th>
                <th className="px-5 py-3.5 text-right">Poin Didapat</th>
                <th className="px-5 py-3.5">Staf Input</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTxs.map((tx) => {
                const member = members.find((m) => m.id === tx.memberId);
                return (
                  <tr key={tx.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-stone-800">
                      {tx.transactionNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-stone-900">
                        {member?.fullName || 'Tamu'}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        {member?.membershipNumber}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono">{formatDateIndo(tx.date)}</td>
                    <td className="px-5 py-3.5">
                      <span className="capitalize font-semibold text-stone-800">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-stone-600">{tx.paymentMethod}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-stone-900 whitespace-nowrap">
                      {formatIDR(tx.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      +{tx.pointsEarned} pts
                    </td>
                    <td className="px-5 py-3.5 text-stone-500 font-mono text-[11px]">
                      {tx.staffName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Pencatatan Transaksi Belanja Member"
        subtitle="Mencatat transaksi untuk otomatis menambah poin dan mengevaluasi upgrade tier"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Pilih Member Tamu *
              </label>
              <select
                value={formData.memberId}
                onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700/20"
                required
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.membershipNumber}) - Tier:{' '}
                    {m.tierId.replace('tier_', '').toUpperCase()} (
                    {m.availablePoints} pts)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Kategori Belanja *
              </label>
              <select
                value={formData.category}
                onChange={(e: any) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              >
                <option value="room">Akomodasi Kamar</option>
                <option value="restaurant">Restoran Teratai Garden</option>
                <option value="spa">Garden Sanctuary Spa</option>
                <option value="bar">Sasak Poolside Bar</option>
                <option value="laundry">Layanan Laundry</option>
                <option value="meeting">Meeting & Event</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e: any) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="QRIS">QRIS</option>
                <option value="Cash">Cash</option>
                <option value="Room Charge">Room Charge (Kamar)</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Total Jumlah Transaksi (IDR) *
              </label>
              <input
                type="number"
                min="10000"
                step="5000"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nomor Referensi Struk / Bill
              </label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) =>
                  setFormData({ ...formData, referenceNumber: e.target.value })
                }
                placeholder="POS-TERATAI-1092"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Real-time Points Engine Preview Box */}
          <div className="p-4 bg-stone-900 text-stone-100 rounded-xl border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400 font-mono">
                Tier Member: <strong className="text-amber-300">{selectedTier.name}</strong> ({selectedTier.pointMultiplier}x Multiplier)
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                Estimasi Poin: +{pointCalcPreview.totalPoints} pts
              </span>
            </div>
            <div className="text-[11px] text-stone-400">
              Perhitungan: (Rp {formData.amount.toLocaleString('id-ID')} / Rp{' '}
              {pointRules.rupiahPerPoint.toLocaleString('id-ID')}) ×{' '}
              {selectedTier.pointMultiplier}
              {pointCalcPreview.campaignMultiplier > 1 &&
                ` × ${pointCalcPreview.campaignMultiplier} (Campaign Bonus)`}{' '}
              ={' '}
              <strong className="text-white">
                {pointCalcPreview.totalPoints} Poin Loyalitas
              </strong>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-xl shadow-xs"
            >
              Simpan & Terbitkan Poin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
