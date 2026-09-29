import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatDateIndo, formatIDR } from '../../services/membershipEngine';
import { Ticket, Sparkles, QrCode, Tag, CheckCircle } from 'lucide-react';
import { QRCodeView } from '../common/QRCodeView';
import { Modal } from '../common/Modal';

export const MemberVouchers: React.FC = () => {
  const { currentMember } = useAuth();
  const { vouchers, voucherRedemptions, redemptions, claimVoucher } = useApp();
  const [selectedVoucherForQR, setSelectedVoucherForQR] = useState<{ code: string; title: string } | null>(null);

  const memberId = currentMember?.id || 'mem_john_doe';
  const memberTierId = currentMember?.tierId || 'tier_gold';

  // Available vouchers that can be claimed or used
  const availableVouchers = vouchers.filter((v) =>
    v.status === 'active' && v.applicableTierIds.includes(memberTierId)
  );

  // Vouchers claimed by member
  const memberClaims = voucherRedemptions.filter((vr) => vr.memberId === memberId);
  const memberRewardsRedeemed = redemptions.filter((r) => r.memberId === memberId);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      <div>
        <h1 className="font-serif-luxury text-2xl font-bold text-stone-900">
          Voucher & Penawaran Saya
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Koleksi kupon diskon dan complimentary voucher yang siap Anda gunakan
          di Lombok Garden Hotel.
        </p>
      </div>

      {/* Section 1: Active Reward Vouchers from Points */}
      {memberRewardsRedeemed.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Voucher Hasil Penukaran Poin
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {memberRewardsRedeemed.map((r) => (
              <div
                key={r.id}
                className="p-5 bg-linear-to-r from-stone-900 to-stone-950 text-white rounded-2xl border border-stone-800 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                    REWARD VOUCHER · {r.status.toUpperCase()}
                  </div>
                  <h4 className="font-bold text-sm text-stone-100 mt-1">
                    {r.rewardTitle}
                  </h4>
                  <div className="font-mono text-xs text-stone-400 mt-2">
                    Kode: <strong className="text-amber-300">{r.redemptionCode}</strong>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between">
                  <span className="text-[10px] text-stone-400 font-mono">
                    Berlaku s/d: {formatDateIndo(r.expiresAt.slice(0, 10))}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedVoucherForQR({ code: r.redemptionCode, title: r.rewardTitle })
                    }
                    className="p-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-amber-300 transition-colors"
                    title="Tampilkan Barcode/QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Hotel Exclusive Tier Vouchers */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-emerald-700" />
          Kupon Promosi Keanggotaan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableVouchers.map((v) => {
            const hasClaimed = memberClaims.some((c) => c.voucherId === v.id);

            return (
              <div
                key={v.id}
                className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between"
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
                    <span className="text-[10px] font-mono text-stone-400">
                      S/d {formatDateIndo(v.expiryDate)}
                    </span>
                  </div>

                  <h3 className="font-bold text-stone-900 text-sm mt-3">
                    {v.title}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {v.description}
                  </p>

                  <div className="mt-3 text-[11px] text-stone-500 font-mono">
                    Kode Promo: <strong className="text-stone-800">{v.code}</strong>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div className="text-[11px] text-stone-400">
                    Min transaksi: {formatIDR(v.minTransaction)}
                  </div>

                  {hasClaimed ? (
                    <button
                      onClick={() =>
                        setSelectedVoucherForQR({ code: v.code, title: v.title })
                      }
                      className="px-3 py-1.5 bg-stone-900 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Pakai Voucher</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => claimVoucher(memberId, v.id)}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      Klaim Kupon
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR Voucher View Modal */}
      {selectedVoucherForQR && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedVoucherForQR(null)}
          title="Tunjukkan Voucher ke Staff"
          maxWidth="sm"
        >
          <div className="text-center py-4 space-y-3">
            <QRCodeView value={selectedVoucherForQR.code} size={200} />
            <div className="font-mono text-base font-bold text-stone-900 tracking-wider">
              {selectedVoucherForQR.code}
            </div>
            <div className="text-xs text-stone-600">
              {selectedVoucherForQR.title}
            </div>
            <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
              Staff akan memindai atau memasukkan kode ini ke sistem saat pembayaran
              untuk mengaplikasikan potongan harga.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
