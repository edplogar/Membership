import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRoleType } from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  CheckCircle,
  XCircle,
  KeyRound,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AdminUsersManagement: React.FC = () => {
  const { users, roles, saveUser, deleteUser } = useApp();
  const { showToast } = useToast();

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'ADMIN' as UserRoleType,
    roleId: 'role_hotel_admin',
    isActive: true,
  });

  const adminUsers = users.filter((u) => u.role !== 'MEMBER');

  const handleOpenAdd = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      role: 'ADMIN',
      roleId: 'role_hotel_admin',
      isActive: true,
    });
    setIsAddModalOpen(true);
  };

  const handleEdit = (u: User) => {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      roleId: u.roleId,
      isActive: u.isActive,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      showToast('Harap lengkapi nama dan email.', 'error');
      return;
    }

    if (editingUser) {
      saveUser({
        ...editingUser,
        ...form,
      });
      setEditingUser(null);
    } else {
      saveUser({
        id: `usr_${Date.now()}`,
        ...form,
        createdAt: new Date().toISOString(),
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-luxury text-2xl font-bold text-stone-900">
            Pengelolaan Akun Administrator
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Kelola staf hotel yang berhak mengakses panel administrasi dan operasional sistem.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Admin Baru</span>
        </button>
      </div>

      {/* Admin Users Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Nama Staf</th>
                <th className="px-5 py-3.5">Email Akun</th>
                <th className="px-5 py-3.5">Peran (Role)</th>
                <th className="px-5 py-3.5">No. Kontak</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {adminUsers.map((u) => {
                const roleObj = roles.find((r) => r.id === u.roleId);
                const isSuper = u.role === 'SUPER_ADMIN';

                return (
                  <tr key={u.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-900 text-amber-400 font-bold flex items-center justify-center">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900">{u.name}</div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            ID: {u.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-stone-700">
                      {u.email}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                          isSuper
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {roleObj?.name || u.role}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-stone-500 font-mono">
                      {u.phone || '-'}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg transition-colors"
                          title="Edit Staf"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isSuper && (
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Admin Modal */}
      {(isAddModalOpen || editingUser) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingUser(null);
          }}
          title={editingUser ? `Edit Administrator: ${editingUser.name}` : 'Buat Administrator Baru'}
          subtitle="Tentukan nama, email, dan peran hak akses operasional"
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nama Lengkap & Gelar *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Akun *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nomor HP
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Peran Hak Akses (Role)
              </label>
              <select
                value={form.roleId}
                onChange={(e) => {
                  const roleObj = roles.find((r) => r.id === e.target.value);
                  setForm({
                    ...form,
                    roleId: e.target.value,
                    role: (roleObj?.code as UserRoleType) || 'ADMIN',
                  });
                }}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              >
                {roles
                  .filter((r) => r.code !== 'MEMBER')
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
              </select>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingUser(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
              >
                Simpan Administrator
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete User Confirm */}
      <ConfirmDialog
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => {
          if (userToDelete) deleteUser(userToDelete.id);
          setUserToDelete(null);
        }}
        title={`Hapus Administrator ${userToDelete?.name}?`}
        message="Akun ini tidak akan dapat login lagi ke dalam sistem hotel."
        confirmText="Hapus Akun"
        isDestructive
      />
    </div>
  );
};
