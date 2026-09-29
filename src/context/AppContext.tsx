import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Member,
  MembershipTier,
  MembershipBenefit,
  MembershipRule,
  Stay,
  Transaction,
  PointTransaction,
  PointRuleConfig,
  Reward,
  RewardRedemption,
  Voucher,
  VoucherRedemption,
  PromotionCampaign,
  AppNotification,
  AuditLog,
  HotelSystemSettings,
  IntegrationStatus,
  User,
  Role,
  PermissionCode,
  PingCoIdWhatsAppConfig,
  WhatsAppMessageLog,
  EmailSystemConfig,
  EmailMessageLog,
} from '../types';
import {
  INITIAL_MEMBERS,
  INITIAL_TIERS,
  INITIAL_BENEFITS,
  INITIAL_RULES,
  INITIAL_POINT_RULES,
  INITIAL_STAYS,
  INITIAL_TRANSACTIONS,
  INITIAL_POINT_TXS,
  INITIAL_REWARDS,
  INITIAL_REDEMPTIONS,
  INITIAL_VOUCHERS,
  INITIAL_PROMOTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SETTINGS,
  INITIAL_INTEGRATIONS,
  INITIAL_USERS,
  INITIAL_ROLES,
  loadFromStorage,
  saveToStorage,
} from '../services/storage';
import {
  INITIAL_PING_CONFIG,
  INITIAL_WHATSAPP_LOGS,
  sendWhatsAppMessageViaPing,
  formatWelcomeWhatsApp,
  formatPointsWhatsApp,
  formatTierUpgradeWhatsApp,
} from '../services/pingWhatsAppService';
import {
  INITIAL_EMAIL_CONFIG,
  INITIAL_EMAIL_LOGS,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  testEmailConnection,
} from '../services/emailService';
import {
  calculatePointsEarned,
  evaluateMemberTierRules,
  createAuditRecord,
  createNotificationRecord,
  generateMembershipNumber,
  formatIDR,
} from '../services/membershipEngine';
import {
  db,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '../services/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface AppContextValue {
  members: Member[];
  tiers: MembershipTier[];
  benefits: MembershipBenefit[];
  rules: MembershipRule[];
  stays: Stay[];
  transactions: Transaction[];
  pointTransactions: PointTransaction[];
  pointRules: PointRuleConfig;
  rewards: Reward[];
  redemptions: RewardRedemption[];
  vouchers: Voucher[];
  voucherRedemptions: VoucherRedemption[];
  promotions: PromotionCampaign[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  systemSettings: HotelSystemSettings;
  integrations: IntegrationStatus;
  users: User[];
  roles: Role[];
  whatsappConfig: PingCoIdWhatsAppConfig;
  whatsappLogs: WhatsAppMessageLog[];
  emailConfig: EmailSystemConfig;
  emailLogs: EmailMessageLog[];

  // Actions
  addMember: (data: Omit<Member, 'id' | 'membershipNumber' | 'totalVisits' | 'totalTransactions' | 'totalSpending' | 'totalPointsEarned' | 'availablePoints' | 'redeemedPoints'>) => Member;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => boolean;
  changeMemberTier: (memberId: string, newTierId: string, reason: string) => void;
  
  recordStay: (data: Omit<Stay, 'id'>) => Stay;
  updateStayStatus: (stayId: string, status: Stay['status']) => void;

  recordTransaction: (data: Omit<Transaction, 'id' | 'pointsEarned'>) => { transaction: Transaction; pointsEarned: number; upgradeNotice?: string };
  adjustPoints: (memberId: string, amount: number, isAddition: boolean, reason: string) => void;

  redeemReward: (memberId: string, rewardId: string) => { success: boolean; message: string; code?: string };
  claimVoucher: (memberId: string, voucherId: string) => { success: boolean; message: string };
  useVoucher: (redemptionId: string) => void;

  saveTier: (tier: MembershipTier) => void;
  deleteTier: (id: string) => void;

  saveBenefit: (benefit: MembershipBenefit) => void;
  deleteBenefit: (id: string) => void;

  saveRule: (rule: MembershipRule) => void;
  deleteRule: (id: string) => void;

  saveReward: (reward: Reward) => void;
  deleteReward: (id: string) => void;

  saveVoucher: (voucher: Voucher) => void;
  deleteVoucher: (id: string) => void;

  savePromotion: (promo: PromotionCampaign) => void;
  deletePromotion: (id: string) => void;

  savePointRules: (rules: PointRuleConfig) => void;
  updateSystemSettings: (settings: Partial<HotelSystemSettings>) => void;
  
  updateWhatsAppConfig: (config: Partial<PingCoIdWhatsAppConfig>) => void;
  addWhatsAppLog: (log: WhatsAppMessageLog) => void;
  updateEmailConfig: (config: Partial<EmailSystemConfig>) => void;
  addEmailLog: (log: EmailMessageLog) => void;
  sendTestEmailToRecipient: (recipientEmail: string) => Promise<{ success: boolean; message: string }>;

  updateRolePermissions: (roleId: string, permissions: PermissionCode[]) => void;
  saveUser: (user: User) => void;
  deleteUser: (userId: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { currentUser, refreshMemberData } = useAuth();
  const { showToast } = useToast();

  const [members, setMembers] = useState<Member[]>(() => loadFromStorage('members', INITIAL_MEMBERS));
  const [tiers, setTiers] = useState<MembershipTier[]>(() => loadFromStorage('tiers', INITIAL_TIERS));
  const [benefits, setBenefits] = useState<MembershipBenefit[]>(() => loadFromStorage('benefits', INITIAL_BENEFITS));
  const [rules, setRules] = useState<MembershipRule[]>(() => loadFromStorage('rules', INITIAL_RULES));
  const [stays, setStays] = useState<Stay[]>(() => loadFromStorage('stays', INITIAL_STAYS));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadFromStorage('transactions', INITIAL_TRANSACTIONS));
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>(() => loadFromStorage('pointTransactions', INITIAL_POINT_TXS));
  const [pointRules, setPointRules] = useState<PointRuleConfig>(() => loadFromStorage('pointRules', INITIAL_POINT_RULES));
  const [rewards, setRewards] = useState<Reward[]>(() => loadFromStorage('rewards', INITIAL_REWARDS));
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>(() => loadFromStorage('redemptions', INITIAL_REDEMPTIONS));
  const [vouchers, setVouchers] = useState<Voucher[]>(() => loadFromStorage('vouchers', INITIAL_VOUCHERS));
  const [voucherRedemptions, setVoucherRedemptions] = useState<VoucherRedemption[]>(() => loadFromStorage('voucherRedemptions', []));
  const [promotions, setPromotions] = useState<PromotionCampaign[]>(() => loadFromStorage('promotions', INITIAL_PROMOTIONS));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadFromStorage('notifications', INITIAL_NOTIFICATIONS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadFromStorage('auditLogs', INITIAL_AUDIT_LOGS));
  const [systemSettings, setSystemSettings] = useState<HotelSystemSettings>(() => loadFromStorage('systemSettings', INITIAL_SETTINGS));
  const [integrations] = useState<IntegrationStatus>(() => loadFromStorage('integrations', INITIAL_INTEGRATIONS));
  const [users, setUsers] = useState<User[]>(() => loadFromStorage('users', INITIAL_USERS));
  const [roles, setRoles] = useState<Role[]>(() => loadFromStorage('roles', INITIAL_ROLES));
  const [whatsappConfig, setWhatsappConfig] = useState<PingCoIdWhatsAppConfig>(() => loadFromStorage('whatsappConfig', INITIAL_PING_CONFIG));
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppMessageLog[]>(() => loadFromStorage('whatsappLogs', INITIAL_WHATSAPP_LOGS));
  const [emailConfig, setEmailConfig] = useState<EmailSystemConfig>(() => loadFromStorage('emailConfig', INITIAL_EMAIL_CONFIG));
  const [emailLogs, setEmailLogs] = useState<EmailMessageLog[]>(() => loadFromStorage('emailLogs', INITIAL_EMAIL_LOGS));

  // Test Firestore Connection on Boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Sync to localStorage
  useEffect(() => saveToStorage('members', members), [members]);
  useEffect(() => saveToStorage('tiers', tiers), [tiers]);
  useEffect(() => saveToStorage('benefits', benefits), [benefits]);
  useEffect(() => saveToStorage('rules', rules), [rules]);
  useEffect(() => saveToStorage('stays', stays), [stays]);
  useEffect(() => saveToStorage('transactions', transactions), [transactions]);
  useEffect(() => saveToStorage('pointTransactions', pointTransactions), [pointTransactions]);
  useEffect(() => saveToStorage('pointRules', pointRules), [pointRules]);
  useEffect(() => saveToStorage('rewards', rewards), [rewards]);
  useEffect(() => saveToStorage('redemptions', redemptions), [redemptions]);
  useEffect(() => saveToStorage('vouchers', vouchers), [vouchers]);
  useEffect(() => saveToStorage('voucherRedemptions', voucherRedemptions), [voucherRedemptions]);
  useEffect(() => saveToStorage('promotions', promotions), [promotions]);
  useEffect(() => saveToStorage('notifications', notifications), [notifications]);
  useEffect(() => saveToStorage('auditLogs', auditLogs), [auditLogs]);
  useEffect(() => saveToStorage('systemSettings', systemSettings), [systemSettings]);
  useEffect(() => saveToStorage('users', users), [users]);
  useEffect(() => saveToStorage('roles', roles), [roles]);
  useEffect(() => saveToStorage('whatsappConfig', whatsappConfig), [whatsappConfig]);
  useEffect(() => saveToStorage('whatsappLogs', whatsappLogs), [whatsappLogs]);
  useEffect(() => saveToStorage('emailConfig', emailConfig), [emailConfig]);
  useEffect(() => saveToStorage('emailLogs', emailLogs), [emailLogs]);

  // Firestore Real-time Listeners (multi-account synchronization)
  useEffect(() => {
    try {
      const unsubMembers = onSnapshot(
        collection(db, 'members'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Member[] = [];
            snapshot.forEach((docSnap) => list.push(docSnap.data() as Member));
            setMembers(list);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'members')
      );

      const unsubStays = onSnapshot(
        collection(db, 'stays'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Stay[] = [];
            snapshot.forEach((docSnap) => list.push(docSnap.data() as Stay));
            setStays(list);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'stays')
      );

      const unsubTxs = onSnapshot(
        collection(db, 'transactions'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Transaction[] = [];
            snapshot.forEach((docSnap) => list.push(docSnap.data() as Transaction));
            setTransactions(list);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'transactions')
      );

      const unsubPointTxs = onSnapshot(
        collection(db, 'point_transactions'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: PointTransaction[] = [];
            snapshot.forEach((docSnap) => list.push(docSnap.data() as PointTransaction));
            setPointTransactions(list);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'point_transactions')
      );

      const unsubTiers = onSnapshot(
        collection(db, 'membership_tiers'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: MembershipTier[] = [];
            snapshot.forEach((docSnap) => list.push(docSnap.data() as MembershipTier));
            setTiers(list);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'membership_tiers')
      );

      const unsubWALogs = onSnapshot(
        collection(db, 'whatsapp_logs'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: WhatsAppMessageLog[] = [];
            snapshot.forEach((docSnap) => list.push(docSnap.data() as WhatsAppMessageLog));
            setWhatsappLogs(list);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'whatsapp_logs')
      );

      const unsubWAPingConfig = onSnapshot(
        doc(db, 'system_settings', 'whatsapp_ping'),
        (docSnap) => {
          if (docSnap.exists()) {
            setWhatsappConfig(docSnap.data() as PingCoIdWhatsAppConfig);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'system_settings/whatsapp_ping')
      );

      const unsubEmailConfig = onSnapshot(
        doc(db, 'system_settings', 'email_config'),
        (docSnap) => {
          if (docSnap.exists()) {
            setEmailConfig(docSnap.data() as EmailSystemConfig);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'system_settings/email_config')
      );

      const unsubEmailLogs = onSnapshot(
        collection(db, 'email_logs'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: EmailMessageLog[] = [];
            snapshot.forEach((docSnap) => list.push(docSnap.data() as EmailMessageLog));
            setEmailLogs(list);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'email_logs')
      );

      return () => {
        unsubMembers();
        unsubStays();
        unsubTxs();
        unsubPointTxs();
        unsubTiers();
        unsubWALogs();
        unsubWAPingConfig();
        unsubEmailConfig();
        unsubEmailLogs();
      };
    } catch {
      // Offline fallback
    }
  }, []);

  // Log audit helper
  const logAudit = (action: string, module: string, recordId: string, oldVal?: string, newVal?: string) => {
    if (!currentUser) return;
    const log = createAuditRecord(currentUser, action, module, recordId, oldVal, newVal);
    setAuditLogs((prev) => [log, ...prev]);
  };

  // Add Member
  const addMember = (data: Omit<Member, 'id' | 'membershipNumber' | 'totalVisits' | 'totalTransactions' | 'totalSpending' | 'totalPointsEarned' | 'availablePoints' | 'redeemedPoints'>): Member => {
    const newId = `mem_${Date.now()}`;
    const membershipNumber = generateMembershipNumber(members.length);
    const newMember: Member = {
      ...data,
      id: newId,
      membershipNumber,
      totalVisits: 0,
      totalTransactions: 0,
      totalSpending: 0,
      totalPointsEarned: 0,
      availablePoints: 0,
      redeemedPoints: 0,
      status: 'ACTIVE',
    };

    setMembers((prev) => [newMember, ...prev]);

    // Save to Firestore for real-time cloud sync
    try {
      setDoc(doc(db, 'members', newId), newMember).catch(() => {});
    } catch {}

    logAudit('CREATE_MEMBER', 'MEMBERS', newId, 'None', `Nama: ${newMember.fullName}, No: ${membershipNumber}`);

    // Create welcoming notification
    const welcomeNotif = createNotificationRecord(
      newId,
      'Selamat Bergabung di Lombok Garden Hotel!',
      `Kartu Digital Membership Anda telah aktif (${membershipNumber}). Nikmati diskon kamar dan poin loyalitas istimewa.`,
      'system'
    );
    setNotifications((prev) => [welcomeNotif, ...prev]);

    // Trigger Welcome Email to member's registered email address
    if (emailConfig.autoSendWelcomeEmail && newMember.email) {
      const currentTier = tiers.find((t) => t.id === newMember.tierId) || tiers[0];
      sendWelcomeEmail(newMember, currentTier, emailConfig)
        .then((log) => addEmailLog(log))
        .catch(() => {});
    }

    // Trigger WhatsApp welcome message via ping.co.id if enabled
    if (whatsappConfig.autoSendWelcomeCard && newMember.phone) {
      const currentTier = tiers.find((t) => t.id === newMember.tierId) || tiers[0];
      const msg = formatWelcomeWhatsApp(newMember, currentTier, whatsappConfig);
      const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://membership.lombokgardenhotel.com';
      sendWhatsAppMessageViaPing(newMember.phone, newMember.fullName, msg, 'welcome', whatsappConfig, {
        event: 'member.created',
        membershipNumber: newMember.membershipNumber,
        fullName: newMember.fullName,
        phone: newMember.phone,
        tier: currentTier.name,
        cardUrl: `${appUrl}/card/${newMember.membershipNumber}`,
        registeredAt: new Date().toISOString(),
      })
        .then((log) => addWhatsAppLog(log))
        .catch(() => {});
    }

    showToast(`Member ${newMember.fullName} (${membershipNumber}) berhasil didaftarkan!`, 'success');
    return newMember;
  };

  // Update Member
  const updateMember = (id: string, updates: Partial<Member>) => {
    const existing = members.find((m) => m.id === id);
    if (!existing) return;

    const updated = members.map((m) => (m.id === id ? { ...m, ...updates } : m));
    setMembers(updated);

    const after = updated.find((m) => m.id === id);
    if (after) {
      refreshMemberData(after);
      try {
        setDoc(doc(db, 'members', id), after).catch(() => {});
      } catch {}
    }

    logAudit('UPDATE_MEMBER', 'MEMBERS', id, JSON.stringify(existing), JSON.stringify(updates));
    showToast('Data member berhasil diperbarui.', 'success');
  };

  // Delete Member (Strictly for SUPER_ADMIN role)
  const deleteMember = (id: string): boolean => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      showToast('Akses Ditolak: Hanya Super Admin yang memiliki wewenang untuk menghapus data member.', 'error');
      return false;
    }

    const existing = members.find((m) => m.id === id);
    if (!existing) return false;

    // Remove from local and firestore members collection
    setMembers((prev) => prev.filter((m) => m.id !== id));
    try {
      deleteDoc(doc(db, 'members', id)).catch(() => {});
    } catch {}

    // Clean up linked user login credentials if any exist
    const linkedUsers = users.filter((u) => u.memberId === id || u.email.toLowerCase() === existing.email.toLowerCase());
    if (linkedUsers.length > 0) {
      setUsers((prev) => prev.filter((u) => u.memberId !== id && u.email.toLowerCase() !== existing.email.toLowerCase()));
      try {
        linkedUsers.forEach((lu) => {
          deleteDoc(doc(db, 'users', lu.id)).catch(() => {});
        });
      } catch {}
    }

    logAudit(
      'DELETE_MEMBER_PERMANENT',
      'MEMBERS',
      id,
      `Member: ${existing.fullName} (${existing.membershipNumber}), Email: ${existing.email}, HP: ${existing.phone}`,
      'DELETED_BY_SUPER_ADMIN'
    );

    showToast(`Data member ${existing.fullName} (${existing.membershipNumber}) berhasil dihapus permanen.`, 'success');
    return true;
  };

  // Change Tier manually
  const changeMemberTier = (memberId: string, newTierId: string, reason: string) => {
    const member = members.find((m) => m.id === memberId);
    const targetTier = tiers.find((t) => t.id === newTierId);
    if (!member || !targetTier) return;

    const prevTier = tiers.find((t) => t.id === member.tierId);
    const updated = members.map((m) =>
      m.id === memberId ? { ...m, tierId: newTierId } : m
    );
    setMembers(updated);

    const changedMember = updated.find((m) => m.id === memberId);
    if (changedMember) {
      refreshMemberData(changedMember);
      try {
        setDoc(doc(db, 'members', memberId), changedMember).catch(() => {});
      } catch {}
    }

    // Notification
    const notif = createNotificationRecord(
      memberId,
      'Perubahan Tingkat Keanggotaan',
      `Tingkat membership Anda telah diubah menjadi ${targetTier.name}. Alasan: ${reason}`,
      'tier_upgrade'
    );
    setNotifications((prev) => [notif, ...prev]);

    // Trigger WhatsApp tier upgrade notification via ping.co.id
    if (whatsappConfig.autoSendTierUpgrade && member.phone) {
      const msg = formatTierUpgradeWhatsApp(member, targetTier, whatsappConfig);
      sendWhatsAppMessageViaPing(member.phone, member.fullName, msg, 'tier_upgrade', whatsappConfig)
        .then((log) => addWhatsAppLog(log))
        .catch(() => {});
    }

    logAudit(
      'CHANGE_TIER_MANUAL',
      'MEMBERS',
      memberId,
      `Tier Sebelumnya: ${prevTier?.name || '-'}`,
      `Tier Baru: ${targetTier.name}. Alasan: ${reason}`
    );

    showToast(`Tier ${member.fullName} berhasil diubah ke ${targetTier.name}`, 'success');
  };

  // Record Stay
  const recordStay = (data: Omit<Stay, 'id'>): Stay => {
    const newId = `sty_${Date.now()}`;
    const newStay: Stay = {
      ...data,
      id: newId,
    };

    setStays((prev) => [newStay, ...prev]);
    try {
      setDoc(doc(db, 'stays', newId), newStay).catch(() => {});
    } catch {}

    // Update member visit stats
    const member = members.find((m) => m.id === data.memberId);
    if (member) {
      const updatedVisits = member.totalVisits + 1;
      const updatedMembers = members.map((m) =>
        m.id === data.memberId
          ? {
              ...m,
              totalVisits: updatedVisits,
              lastVisitDate: data.checkInDate,
            }
          : m
      );
      setMembers(updatedMembers);
      try {
        const memAfter = updatedMembers.find((m) => m.id === data.memberId);
        if (memAfter) setDoc(doc(db, 'members', data.memberId), memAfter).catch(() => {});
      } catch {}
    }

    logAudit(
      'RECORD_STAY',
      'STAYS',
      newId,
      'None',
      `Booking #${data.bookingNumber}, Kamar ${data.roomNumber} (${data.roomType})`
    );

    showToast(`Reservasi #${data.bookingNumber} kamar ${data.roomNumber} berhasil dicatat.`, 'success');
    return newStay;
  };

  // Update Stay Status
  const updateStayStatus = (stayId: string, status: Stay['status']) => {
    const existing = stays.find((s) => s.id === stayId);
    if (!existing) return;

    const updated = stays.map((s) => (s.id === stayId ? { ...s, status } : s));
    setStays(updated);
    try {
      const updatedStay = updated.find((s) => s.id === stayId);
      if (updatedStay) setDoc(doc(db, 'stays', stayId), updatedStay).catch(() => {});
    } catch {}

    logAudit('UPDATE_STAY_STATUS', 'STAYS', stayId, existing.status, status);
    showToast(`Status reservasi #${existing.bookingNumber} diubah ke ${status}.`, 'info');
  };

  // Record Transaction
  const recordTransaction = (
    data: Omit<Transaction, 'id' | 'pointsEarned'>
  ): { transaction: Transaction; pointsEarned: number; upgradeNotice?: string } => {
    const newTxId = `tx_${Date.now()}`;
    const member = members.find((m) => m.id === data.memberId);
    const tier = tiers.find((t) => t.id === member?.tierId) || tiers[0];

    // Calculate Points
    const calcResult = calculatePointsEarned(
      data.amount,
      tier,
      pointRules,
      promotions
    );

    const newTx: Transaction = {
      ...data,
      id: newTxId,
      pointsEarned: calcResult.totalPoints,
    };

    setTransactions((prev) => [newTx, ...prev]);
    try {
      setDoc(doc(db, 'transactions', newTxId), newTx).catch(() => {});
    } catch {}

    let upgradeNotice: string | undefined;

    if (member) {
      const newTotalSpending = member.totalSpending + data.amount;
      const newTotalTx = member.totalTransactions + 1;
      const newTotalPointsEarned = member.totalPointsEarned + calcResult.totalPoints;
      const newAvailablePoints = member.availablePoints + calcResult.totalPoints;

      // Record point ledger
      const pointTxId = `ptx_${Date.now()}`;
      const pointTx: PointTransaction = {
        id: pointTxId,
        memberId: member.id,
        type: 'earned',
        amount: calcResult.totalPoints,
        balanceAfter: newAvailablePoints,
        description: `Perolehan poin dari transaksi ${data.category.toUpperCase()} #${data.transactionNumber}`,
        staffName: data.staffName || currentUser?.name || 'Front Desk',
        createdAt: new Date().toISOString(),
      };
      setPointTransactions((prev) => [pointTx, ...prev]);
      try {
        setDoc(doc(db, 'point_transactions', pointTxId), pointTx).catch(() => {});
      } catch {}

      // Check Dynamic Rules for Tier Upgrade
      const tempMember: Member = {
        ...member,
        totalSpending: newTotalSpending,
        totalTransactions: newTotalTx,
        totalPointsEarned: newTotalPointsEarned,
        availablePoints: newAvailablePoints,
      };

      const ruleEval = evaluateMemberTierRules(tempMember, tiers, rules, systemSettings.autoUpgradeEnabled);
      let finalTierId = member.tierId;

      if (ruleEval.upgraded && ruleEval.newTier) {
        finalTierId = ruleEval.newTier.id;
        const newTier = ruleEval.newTier;
        upgradeNotice = `Selamat! Member ${member.fullName} memenuhi syarat naik ke tingkat ${newTier.name}.`;

        const tierNotif = createNotificationRecord(
          member.id,
          'Selamat! Tingkat Membership Anda Naik 🎉',
          `Akumulasi belanja Anda telah mencapai tingkat ${newTier.name}. Nikmati diskon ekstra dan pengganda poin lebih tinggi!`,
          'tier_upgrade'
        );
        setNotifications((prev) => [tierNotif, ...prev]);

        // Trigger WhatsApp tier upgrade notification
        if (whatsappConfig.autoSendTierUpgrade && member.phone) {
          const waMsg = formatTierUpgradeWhatsApp(member, newTier, whatsappConfig);
          sendWhatsAppMessageViaPing(member.phone, member.fullName, waMsg, 'tier_upgrade', whatsappConfig)
            .then((log) => addWhatsAppLog(log))
            .catch(() => {});
        }
      }

      const updatedMembers = members.map((m) =>
        m.id === member.id
          ? {
              ...m,
              totalSpending: newTotalSpending,
              totalTransactions: newTotalTx,
              totalPointsEarned: newTotalPointsEarned,
              availablePoints: newAvailablePoints,
              tierId: finalTierId,
            }
          : m
      );

      setMembers(updatedMembers);
      const updatedActiveMember = updatedMembers.find((m) => m.id === member.id);
      if (updatedActiveMember) {
        refreshMemberData(updatedActiveMember);
        try {
          setDoc(doc(db, 'members', member.id), updatedActiveMember).catch(() => {});
        } catch {}
      }

      // Trigger WhatsApp points notification via ping.co.id
      if (whatsappConfig.autoSendPointUpdate && member.phone) {
        const pointsMsg = formatPointsWhatsApp(
          updatedActiveMember || tempMember,
          formatIDR(data.amount),
          calcResult.totalPoints,
          whatsappConfig
        );
        sendWhatsAppMessageViaPing(
          member.phone,
          member.fullName,
          pointsMsg,
          'point_update',
          whatsappConfig,
          {
            event: 'points.earned',
            transactionId: newTxId,
            membershipNumber: member.membershipNumber,
            fullName: member.fullName,
            phone: member.phone,
            billAmount: data.amount,
            billAmountFormatted: formatIDR(data.amount),
            pointsEarned: calcResult.totalPoints,
            totalPoints: newAvailablePoints,
            outlet: `${data.category.toUpperCase()} #${data.transactionNumber}`,
          }
        )
          .then((log) => addWhatsAppLog(log))
          .catch(() => {});
      }
    }

    logAudit(
      'RECORD_TRANSACTION',
      'BILLING',
      newTxId,
      'None',
      `Nominal: Rp ${data.amount.toLocaleString('id-ID')}, Kategori: ${data.category}, Poin: +${calcResult.totalPoints}`
    );

    showToast(
      `Transaksi Rp ${data.amount.toLocaleString('id-ID')} dicatat. Poin: +${calcResult.totalPoints}`,
      'success'
    );

    return { transaction: newTx, pointsEarned: calcResult.totalPoints, upgradeNotice };
  };

  // Adjust Points
  const adjustPoints = (memberId: string, amount: number, isAddition: boolean, reason: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    const diff = isAddition ? amount : -amount;
    const newBalance = Math.max(0, member.availablePoints + diff);
    const newTotalEarned = isAddition ? member.totalPointsEarned + amount : member.totalPointsEarned;
    const newRedeemed = !isAddition ? member.redeemedPoints + amount : member.redeemedPoints;

    const pointTxId = `ptx_${Date.now()}`;
    const pointTx: PointTransaction = {
      id: pointTxId,
      memberId: member.id,
      type: isAddition ? 'adjusted_add' : 'adjusted_sub',
      amount: diff,
      balanceAfter: newBalance,
      description: `Penyesuaian manual (${isAddition ? 'Penambahan' : 'Pengurangan'}): ${reason}`,
      staffName: currentUser?.name || 'Administrator',
      createdAt: new Date().toISOString(),
    };
    setPointTransactions((prev) => [pointTx, ...prev]);
    try {
      setDoc(doc(db, 'point_transactions', pointTxId), pointTx).catch(() => {});
    } catch {}

    const updatedMembers = members.map((m) =>
      m.id === memberId
        ? {
            ...m,
            availablePoints: newBalance,
            totalPointsEarned: newTotalEarned,
            redeemedPoints: newRedeemed,
          }
        : m
    );
    setMembers(updatedMembers);

    const changedMember = updatedMembers.find((m) => m.id === memberId);
    if (changedMember) {
      refreshMemberData(changedMember);
      try {
        setDoc(doc(db, 'members', memberId), changedMember).catch(() => {});
      } catch {}
    }

    logAudit(
      'ADJUST_POINTS',
      'POINTS',
      memberId,
      `Saldo sebelumnya: ${member.availablePoints} pts`,
      `${isAddition ? '+' : '-'}${amount} pts. Saldo baru: ${newBalance} pts. Alasan: ${reason}`
    );

    showToast(`Poin ${member.fullName} berhasil disesuaikan (${isAddition ? '+' : '-'}${amount} Poin).`, 'success');
  };

  // Redeem Reward
  const redeemReward = (memberId: string, rewardId: string) => {
    const member = members.find((m) => m.id === memberId);
    const reward = rewards.find((r) => r.id === rewardId);

    if (!member || !reward) return { success: false, message: 'Data tidak ditemukan' };
    if (member.availablePoints < reward.pointsRequired) {
      return { success: false, message: 'Poin Anda tidak mencukupi untuk reward ini' };
    }
    if (reward.stock !== undefined && reward.stock <= 0) {
      return { success: false, message: 'Stok reward ini sedang habis' };
    }

    const redemptionCode = `RDM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newBalance = member.availablePoints - reward.pointsRequired;

    // Deduct points ledger
    const pointTx: PointTransaction = {
      id: `ptx_${Date.now()}`,
      memberId: member.id,
      type: 'redeemed',
      amount: -reward.pointsRequired,
      balanceAfter: newBalance,
      description: `Penukaran reward: ${reward.title} (Kode: ${redemptionCode})`,
      staffName: currentUser?.name || 'Member Portal',
      createdAt: new Date().toISOString(),
    };
    setPointTransactions((prev) => [pointTx, ...prev]);

    // Record Redemption
    const newRedemption: RewardRedemption = {
      id: `rdm_${Date.now()}`,
      memberId: member.id,
      rewardId: reward.id,
      rewardTitle: reward.title,
      pointsSpent: reward.pointsRequired,
      redeemedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'issued',
      redemptionCode,
    };
    setRedemptions((prev) => [newRedemption, ...prev]);

    // Update reward stock
    if (reward.stock !== undefined) {
      setRewards((prev) =>
        prev.map((r) => (r.id === rewardId ? { ...r, stock: r.stock - 1 } : r))
      );
    }

    // Update Member
    const updatedMembers = members.map((m) =>
      m.id === memberId
        ? {
            ...m,
            availablePoints: newBalance,
            redeemedPoints: m.redeemedPoints + reward.pointsRequired,
          }
        : m
    );
    setMembers(updatedMembers);
    const changed = updatedMembers.find((m) => m.id === memberId);
    if (changed) {
      refreshMemberData(changed);
      try {
        setDoc(doc(db, 'members', memberId), changed).catch(() => {});
      } catch {}
    }

    logAudit('REDEEM_REWARD', 'REWARDS', rewardId, `${reward.pointsRequired} pts`, `Kode: ${redemptionCode}`);
    showToast(`Berhasil menukarkan reward "${reward.title}"! Kode: ${redemptionCode}`, 'success');

    return { success: true, message: 'Reward berhasil ditukarkan', code: redemptionCode };
  };

  // Claim Voucher
  const claimVoucher = (memberId: string, voucherId: string) => {
    const member = members.find((m) => m.id === memberId);
    const voucher = vouchers.find((v) => v.id === voucherId);

    if (!member || !voucher) return { success: false, message: 'Data tidak ditemukan' };

    const newVoucherRedemption: VoucherRedemption = {
      id: `vrdm_${Date.now()}`,
      memberId: member.id,
      voucherId: voucher.id,
      voucherCode: voucher.code,
      discountApplied: voucher.discountValue,
      claimedAt: new Date().toISOString(),
      status: 'available',
    };

    setVoucherRedemptions((prev) => [newVoucherRedemption, ...prev]);
    showToast(`Voucher "${voucher.title}" berhasil diklaim! Kode: ${voucher.code}`, 'success');
    return { success: true, message: 'Voucher berhasil diklaim' };
  };

  // Use Voucher
  const useVoucher = (redemptionId: string) => {
    setVoucherRedemptions((prev) =>
      prev.map((r) =>
        r.id === redemptionId ? { ...r, status: 'used', usedAt: new Date().toISOString() } : r
      )
    );
    showToast('Voucher berhasil digunakan pada transaksi.', 'success');
  };

  // Tier Management
  const saveTier = (tier: MembershipTier) => {
    setTiers((prev) => {
      const exists = prev.some((t) => t.id === tier.id);
      return exists ? prev.map((t) => (t.id === tier.id ? tier : t)) : [...prev, tier];
    });
    try {
      setDoc(doc(db, 'membership_tiers', tier.id), tier).catch(() => {});
    } catch {}
    logAudit('SAVE_TIER', 'TIERS', tier.id, 'None', JSON.stringify(tier));
    showToast(`Tier ${tier.name} berhasil disimpan.`, 'success');
  };

  const deleteTier = (id: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== id));
    try {
      deleteDoc(doc(db, 'membership_tiers', id)).catch(() => {});
    } catch {}
    logAudit('DELETE_TIER', 'TIERS', id, 'None', 'DELETED');
    showToast('Tier berhasil dihapus.', 'info');
  };

  // Benefit Management
  const saveBenefit = (benefit: MembershipBenefit) => {
    setBenefits((prev) => {
      const exists = prev.some((b) => b.id === benefit.id);
      return exists ? prev.map((b) => (b.id === benefit.id ? benefit : b)) : [...prev, benefit];
    });
    showToast(`Benefit "${benefit.name}" berhasil disimpan.`, 'success');
  };

  const deleteBenefit = (id: string) => {
    setBenefits((prev) => prev.filter((b) => b.id !== id));
    showToast('Benefit berhasil dihapus.', 'info');
  };

  // Rule Management
  const saveRule = (rule: MembershipRule) => {
    setRules((prev) => {
      const exists = prev.some((r) => r.id === rule.id);
      return exists ? prev.map((r) => (r.id === rule.id ? rule : r)) : [...prev, rule];
    });
    logAudit('SAVE_RULE', 'RULE_ENGINE', rule.id, 'None', JSON.stringify(rule));
    showToast(`Aturan evaluasi "${rule.name}" berhasil disimpan.`, 'success');
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    logAudit('DELETE_RULE', 'RULE_ENGINE', id, 'None', 'DELETED');
    showToast('Aturan berhasil dihapus.', 'info');
  };

  // Reward Management
  const saveReward = (reward: Reward) => {
    setRewards((prev) => {
      const exists = prev.some((r) => r.id === reward.id);
      return exists ? prev.map((r) => (r.id === reward.id ? reward : r)) : [...prev, reward];
    });
    showToast(`Reward "${reward.title}" berhasil disimpan.`, 'success');
  };

  const deleteReward = (id: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
    showToast('Reward berhasil dihapus.', 'info');
  };

  // Voucher Management
  const saveVoucher = (voucher: Voucher) => {
    setVouchers((prev) => {
      const exists = prev.some((v) => v.id === voucher.id);
      return exists ? prev.map((v) => (v.id === voucher.id ? voucher : v)) : [...prev, voucher];
    });
    showToast(`Voucher "${voucher.title}" berhasil disimpan.`, 'success');
  };

  const deleteVoucher = (id: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== id));
    showToast('Voucher berhasil dihapus.', 'info');
  };

  // Promotion Management
  const savePromotion = (promo: PromotionCampaign) => {
    setPromotions((prev) => {
      const exists = prev.some((p) => p.id === promo.id);
      return exists ? prev.map((p) => (p.id === promo.id ? promo : p)) : [...prev, promo];
    });
    showToast(`Kampanye promosi "${promo.title}" disimpan.`, 'success');
  };

  const deletePromotion = (id: string) => {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
    showToast('Kampanye promosi berhasil dihapus.', 'info');
  };

  // Point Rules & Settings
  const savePointRules = (newRules: PointRuleConfig) => {
    setPointRules(newRules);
    logAudit('UPDATE_POINT_RULES', 'POINTS', 'config', JSON.stringify(pointRules), JSON.stringify(newRules));
    showToast('Konfigurasi perolehan poin global berhasil disimpan.', 'success');
  };

  const updateSystemSettings = (settings: Partial<HotelSystemSettings>) => {
    setSystemSettings((prev) => ({ ...prev, ...settings }));
    logAudit('UPDATE_SETTINGS', 'SYSTEM', 'global_settings', JSON.stringify(systemSettings), JSON.stringify(settings));
    showToast('Pengaturan global properti berhasil diperbarui.', 'success');
  };

  const updateWhatsAppConfig = (config: Partial<PingCoIdWhatsAppConfig>) => {
    setWhatsappConfig((prev) => {
      const updated = { ...prev, ...config, lastCheckedAt: new Date().toISOString() };
      try {
        setDoc(doc(db, 'system_settings', 'whatsapp_ping'), updated).catch(() => {});
      } catch {}
      return updated;
    });
    logAudit('UPDATE_WHATSAPP_CONFIG', 'GATEWAY', 'ping.co.id', 'Updated', JSON.stringify(config));
  };

  const addWhatsAppLog = (log: WhatsAppMessageLog) => {
    setWhatsappLogs((prev) => [log, ...prev]);
    try {
      setDoc(doc(db, 'whatsapp_logs', log.id), log).catch(() => {});
    } catch {}
  };

  // Email System Configuration (Super Admin Settings)
  const updateEmailConfig = (config: Partial<EmailSystemConfig>) => {
    setEmailConfig((prev) => {
      const updated = { ...prev, ...config };
      try {
        setDoc(doc(db, 'system_settings', 'email_config'), updated).catch(() => {});
      } catch {}
      // Also update backend server config
      fetch('/api/email/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
    logAudit('UPDATE_EMAIL_CONFIG', 'GATEWAY', config.defaultSenderEmail || 'Email System', 'Updated', JSON.stringify(config));
    showToast('Pengaturan email pengirim & SMTP berhasil disimpan.', 'success');
  };

  const addEmailLog = (log: EmailMessageLog) => {
    setEmailLogs((prev) => [log, ...prev]);
    try {
      setDoc(doc(db, 'email_logs', log.id), log).catch(() => {});
    } catch {}
  };

  const sendTestEmailToRecipient = async (recipientEmail: string): Promise<{ success: boolean; message: string }> => {
    const result = await testEmailConnection(emailConfig, recipientEmail);
    if (result.log) {
      addEmailLog(result.log);
    }
    if (result.success) {
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
    return result;
  };

  // Role Permissions
  const updateRolePermissions = (roleId: string, permissions: PermissionCode[]) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, permissions } : r))
    );
    logAudit('UPDATE_ROLE_PERMISSIONS', 'SECURITY', roleId, 'Previous permissions', `${permissions.length} permissions updated`);
    showToast('Matriks izin peran berhasil diperbarui.', 'success');
  };

  // User Management
  const saveUser = (user: User) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      return exists ? prev.map((u) => (u.id === user.id ? user : u)) : [...prev, user];
    });
    logAudit('SAVE_USER', 'USERS', user.id, 'None', `User: ${user.name} (${user.email})`);
    showToast(`Akun staf "${user.name}" berhasil disimpan.`, 'success');
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    logAudit('DELETE_USER', 'USERS', userId, 'None', 'DELETED');
    showToast('Akun staf berhasil dihapus.', 'info');
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('Semua notifikasi ditandai telah dibaca.', 'info');
  };

  // Reset Data Demo
  const resetAllData = () => {
    setMembers(INITIAL_MEMBERS);
    setTiers(INITIAL_TIERS);
    setBenefits(INITIAL_BENEFITS);
    setRules(INITIAL_RULES);
    setStays(INITIAL_STAYS);
    setTransactions(INITIAL_TRANSACTIONS);
    setPointTransactions(INITIAL_POINT_TXS);
    setPointRules(INITIAL_POINT_RULES);
    setRewards(INITIAL_REWARDS);
    setRedemptions(INITIAL_REDEMPTIONS);
    setVouchers(INITIAL_VOUCHERS);
    setVoucherRedemptions([]);
    setPromotions(INITIAL_PROMOTIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSystemSettings(INITIAL_SETTINGS);
    setUsers(INITIAL_USERS);
    setRoles(INITIAL_ROLES);
    setWhatsappConfig(INITIAL_PING_CONFIG);
    setWhatsappLogs(INITIAL_WHATSAPP_LOGS);

    localStorage.clear();
    showToast('Data sistem berhasil direset ke standar pabrik.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        members,
        tiers,
        benefits,
        rules,
        stays,
        transactions,
        pointTransactions,
        pointRules,
        rewards,
        redemptions,
        vouchers,
        voucherRedemptions,
        promotions,
        notifications,
        auditLogs,
        systemSettings,
        integrations,
        users,
        roles,
        whatsappConfig,
        whatsappLogs,
        emailConfig,
        emailLogs,
        addMember,
        updateMember,
        deleteMember,
        changeMemberTier,
        recordStay,
        updateStayStatus,
        recordTransaction,
        adjustPoints,
        redeemReward,
        claimVoucher,
        useVoucher,
        saveTier,
        deleteTier,
        saveBenefit,
        deleteBenefit,
        saveRule,
        deleteRule,
        saveReward,
        deleteReward,
        saveVoucher,
        deleteVoucher,
        savePromotion,
        deletePromotion,
        savePointRules,
        updateSystemSettings,
        updateWhatsAppConfig,
        addWhatsAppLog,
        updateEmailConfig,
        addEmailLog,
        sendTestEmailToRecipient,
        updateRolePermissions,
        saveUser,
        deleteUser,
        markNotificationRead,
        markAllNotificationsRead,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
