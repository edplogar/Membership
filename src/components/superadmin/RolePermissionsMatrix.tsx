import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PermissionCode, Role } from '../../types';
import { Lock, Shield, Check, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface PermissionGroup {
  groupName: string;
  permissions: { code: PermissionCode; label: string; desc: string }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    groupName: 'Member Management',
    permissions: [
      { code: 'member.view', label: 'Lihat Daftar Member', desc: 'Melihat tabel dan profil member' },
      { code: 'member.create', label: 'Tambah Member Baru', desc: 'Mendaftarkan akun tamu baru' },
      { code: 'member.edit', label: 'Edit Data Member', desc: 'Mengubah profil, alamat, telepon' },
      { code: 'member.delete', label: 'Hapus / Nonaktifkan Member', desc: 'Menonaktifkan akses keanggotaan' },
      { code: 'member.tier_change', label: 'Ubah Tier Manual', desc: 'Mengubah tier tanpa melalui rule engine' },
    ],
  },
  {
    groupName: 'Tier & Rule Engine',
    permissions: [
      { code: 'tier.view', label: 'Lihat Konfigurasi Tier', desc: 'Melihat daftar syarat tier' },
      { code: 'tier.create', label: 'Tambah Tier Baru', desc: 'Membuat tingkatan keanggotaan baru' },
      { code: 'tier.edit', label: 'Edit Syarat & Benefit Tier', desc: 'Mengubah diskon, multiplier, benefit' },
      { code: 'tier.delete', label: 'Hapus Tier', desc: 'Menghapus tingkatan tier' },
      { code: 'rule.view', label: 'Lihat Aturan Rule Engine', desc: 'Melihat formula otomatis upgrade' },
      { code: 'rule.edit', label: 'Edit Aturan Rule Engine', desc: 'Menambah dan mengubah formula rule' },
    ],
  },
  {
    groupName: 'Loyalitas, Poin & Transaksi',
    permissions: [
      { code: 'points.view', label: 'Lihat Buku Besar Poin', desc: 'Melihat mutasi poin seluruh member' },
      { code: 'points.adjust', label: 'Sesuaikan Poin Manual', desc: 'Menambah atau mengurangi saldo poin' },
      { code: 'stay.create', label: 'Catat Kunjungan Menginap', desc: 'Membuat rekaman stay kamar' },
      { code: 'transaction.create', label: 'Catat Transaksi Belanja', desc: 'Input tagihan kamar, F&B, dan spa' },
    ],
  },
  {
    groupName: 'Reward, Voucher & Promosi',
    permissions: [
      { code: 'reward.view', label: 'Lihat Katalog Hadiah', desc: 'Melihat stok dan daftar reward' },
      { code: 'reward.edit', label: 'Kelola Katalog Hadiah', desc: 'Menambah dan mengedit reward poin' },
      { code: 'voucher.view', label: 'Lihat Daftar Voucher', desc: 'Melihat kupon promosi aktif' },
      { code: 'voucher.create', label: 'Terbitkan Voucher Baru', desc: 'Membuat kode kupon diskon' },
      { code: 'voucher.edit', label: 'Kelola & Nonaktifkan Voucher', desc: 'Mengubah kuota dan tanggal kadaluwarsa' },
      { code: 'promotion.edit', label: 'Kelola Kampanye Promosi', desc: 'Mengatur bonus multiplier musiman' },
    ],
  },
  {
    groupName: 'Laporan, Audit & Keamanan Sistem',
    permissions: [
      { code: 'reports.view', label: 'Lihat Laporan Bisnis', desc: 'Melihat statistik revenue dan tier' },
      { code: 'reports.export', label: 'Ekspor Data CSV', desc: 'Mengunduh laporan ke file CSV' },
      { code: 'audit.view', label: 'Lihat Audit Security Trail', desc: 'Melihat rekaman sebelum & sesudah' },
      { code: 'settings.view', label: 'Lihat Pengaturan Sistem', desc: 'Melihat konfigurasi global hotel' },
      { code: 'settings.edit', label: 'Edit Pengaturan Sistem', desc: 'Mengubah konfigurasi hotel & keamanan' },
      { code: 'admin.create', label: 'Kelola Akun Administrator', desc: 'Membuat dan menghapus user admin' },
    ],
  },
];

export const RolePermissionsMatrix: React.FC = () => {
  const { roles, updateRolePermissions } = useApp();
  const { showToast } = useToast();

  const [selectedRoleId, setSelectedRoleId] = useState<string>('role_hotel_admin');
  const targetRole = roles.find((r) => r.id === selectedRoleId) || roles[1];

  const [selectedPerms, setSelectedPerms] = useState<PermissionCode[]>(
    targetRole.permissions
  );

  React.useEffect(() => {
    setSelectedPerms(targetRole.permissions);
  }, [selectedRoleId, roles]);

  const togglePermission = (code: PermissionCode) => {
    if (targetRole.code === 'SUPER_ADMIN') {
      showToast('Peran Super Administrator selalu memiliki seluruh hak akses secara default.', 'warning');
      return;
    }

    if (selectedPerms.includes(code)) {
      setSelectedPerms(selectedPerms.filter((p) => p !== code));
    } else {
      setSelectedPerms([...selectedPerms, code]);
    }
  };

  const handleSave = () => {
    updateRolePermissions(selectedRoleId, selectedPerms);
  };

  const selectAll = () => {
    const all = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.code));
    setSelectedPerms(all);
  };

  const clearAll = () => {
    setSelectedPerms([]);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-luxury text-2xl font-bold text-stone-900">
            Matriks Hak Akses Granular (RBAC)
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Konfigurasi izin terperinci untuk setiap peran pengguna di lingkungan Lombok Garden Hotel.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Perubahan Hak Akses</span>
        </button>
      </div>

      {/* Role Picker Banner */}
      <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-700">Pilih Peran:</span>
          <div className="flex items-center gap-1.5">
            {roles
              .filter((r) => r.code !== 'MEMBER')
              .map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedRoleId === r.id
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {r.name}
                </button>
              ))}
          </div>
        </div>

        {targetRole.code !== 'SUPER_ADMIN' && (
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={selectAll}
              className="text-emerald-800 font-semibold hover:underline"
            >
              Pilih Semua
            </button>
            <span className="text-stone-300">·</span>
            <button
              onClick={clearAll}
              className="text-stone-500 font-semibold hover:underline"
            >
              Kosongkan
            </button>
          </div>
        )}
      </div>

      {/* Permissions Matrix by Group */}
      <div className="space-y-6">
        {PERMISSION_GROUPS.map((group) => (
          <div
            key={group.groupName}
            className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden"
          >
            <div className="px-5 py-3.5 bg-stone-50/80 border-b border-stone-200 font-bold text-xs uppercase tracking-wider text-stone-700">
              {group.groupName}
            </div>

            <div className="divide-y divide-stone-100">
              {group.permissions.map((perm) => {
                const isChecked =
                  targetRole.code === 'SUPER_ADMIN' ||
                  selectedPerms.includes(perm.code);

                return (
                  <label
                    key={perm.code}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50/50 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs text-stone-900 flex items-center gap-2">
                        <span>{perm.label}</span>
                        <span className="font-mono text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                          {perm.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {perm.desc}
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={targetRole.code === 'SUPER_ADMIN'}
                      onChange={() => togglePermission(perm.code)}
                      className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700/20 cursor-pointer disabled:opacity-50"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
