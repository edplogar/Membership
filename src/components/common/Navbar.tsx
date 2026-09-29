import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  LogOut,
  User,
  Search,
  Check,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenScanner: () => void;
  onSearchClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenScanner,
  onSearchClick,
}) => {
  const { currentUser, userRole, logout } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Filter notifications for current user or broad alerts
  const userNotifs = notifications.filter(
    (n) =>
      n.recipientUserId === currentUser?.id ||
      n.recipientUserId === currentUser?.memberId ||
      (userRole !== 'MEMBER' && (n.type === 'system' || n.recipientUserId === 'usr_admin'))
  );
  const unreadCount = userNotifs.filter((n) => !n.isRead).length;

  // Determine top navigation links based on user role
  const getNavLinks = () => {
    if (userRole === 'MEMBER') {
      return [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'membership', label: 'Membership Digital' },
        { id: 'benefits', label: 'Benefit' },
        { id: 'points', label: 'Poin & Rewards' },
        { id: 'vouchers', label: 'Voucher Saya' },
        { id: 'history', label: 'Riwayat Menginap' },
      ];
    } else if (userRole === 'ADMIN') {
      return [
        { id: 'admin_dashboard', label: 'Ringkasan' },
        { id: 'admin_members', label: 'Data Member' },
        { id: 'admin_stays', label: 'Stay & Kunjungan' },
        { id: 'admin_transactions', label: 'Transaksi' },
        { id: 'admin_tiers', label: 'Tier & Rules' },
        { id: 'admin_reports', label: 'Laporan' },
      ];
    } else {
      // SUPER_ADMIN
      return [
        { id: 'super_dashboard', label: 'Control Center' },
        { id: 'admin_members', label: 'Member' },
        { id: 'super_whatsapp', label: 'WhatsApp CRM' },
        { id: 'admin_tiers', label: 'Tier Engine' },
        { id: 'super_admins', label: 'Hak Akses' },
        { id: 'admin_audit', label: 'Audit Log' },
      ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-8 z-30 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onTabChange(userRole === 'MEMBER' ? 'dashboard' : userRole === 'ADMIN' ? 'admin_dashboard' : 'super_dashboard')}
          className="text-left group cursor-pointer focus:outline-hidden"
        >
          <span className="font-serif-luxury text-base sm:text-lg font-bold tracking-wider text-stone-100 group-hover:text-amber-400 transition-colors whitespace-nowrap">
            Lombok Garden Hotel
          </span>
        </button>

        {/* Zone 2: 4–6 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-medium text-stone-300">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onTabChange(link.id)}
                className={`transition-colors whitespace-nowrap relative py-2 ${
                  isActive
                    ? 'text-amber-400 font-semibold'
                    : 'text-stone-300 hover:text-stone-100'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1–2 primary actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search button for staff */}
          {userRole !== 'MEMBER' && (
            <button
              onClick={onSearchClick}
              className="p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
              title="Cari Member atau Transaksi"
            >
              <Search className="w-4 h-4 text-stone-400" />
              <span className="hidden xl:inline text-stone-400 font-mono text-[11px]">
                Cari...
              </span>
            </button>
          )}

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg relative transition-colors"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-stone-900" />
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-100">
                <div className="px-4 py-3 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-200 uppercase tracking-wider">
                      Notifikasi
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.2 rounded font-semibold">
                        {unreadCount} baru
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-stone-400 hover:text-amber-400 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Tandai dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-stone-800/60">
                  {userNotifs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-stone-500">
                      Tidak ada notifikasi baru saat ini.
                    </div>
                  ) : (
                    userNotifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3.5 hover:bg-stone-800/50 cursor-pointer transition-colors ${
                          !n.isRead ? 'bg-stone-800/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold text-stone-200 leading-tight">
                            {n.title}
                          </h4>
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="text-[9px] text-stone-500 font-mono mt-1.5">
                          {new Date(n.createdAt).toLocaleDateString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-stone-800 text-stone-200 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-800 border border-emerald-600 flex items-center justify-center text-xs font-bold text-emerald-200">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <span className="hidden md:inline text-xs font-medium text-stone-200 max-w-[120px] truncate">
                {currentUser?.name?.split(' ')[0]}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in">
                <div className="px-3.5 py-2.5 border-b border-stone-800">
                  <div className="text-xs font-semibold text-stone-100 truncate">
                    {currentUser?.name}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate">
                    {currentUser?.email}
                  </div>
                  <div className="text-[10px] font-mono text-amber-400 mt-1 uppercase font-semibold">
                    {userRole}
                  </div>
                </div>

                {userRole === 'MEMBER' && (
                  <button
                    onClick={() => {
                      onTabChange('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-stone-800 text-xs text-stone-200 flex items-center gap-2 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    Profil Saya
                  </button>
                )}

                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-stone-800 text-xs text-rose-400 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar Akun
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav Scroller */}
      <div className="lg:hidden px-4 py-2 border-t border-stone-800/80 flex items-center gap-3 overflow-x-auto no-scrollbar text-xs">
        {navLinks.map((link) => {
          const isActive = currentTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onTabChange(link.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                isActive
                  ? 'bg-amber-400/20 text-amber-300 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
