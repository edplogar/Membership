import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDocFromServer,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Member,
  MembershipTier,
  MembershipBenefit,
  MembershipRule,
  Stay,
  Transaction,
  PointTransaction,
  Reward,
  Voucher,
  PromotionCampaign,
  HotelSystemSettings,
  User,
  Role,
} from '../types';
import {
  INITIAL_MEMBERS,
  INITIAL_TIERS,
  INITIAL_BENEFITS,
  INITIAL_RULES,
  INITIAL_STAYS,
  INITIAL_TRANSACTIONS,
  INITIAL_POINT_TXS,
  INITIAL_REWARDS,
  INITIAL_VOUCHERS,
  INITIAL_PROMOTIONS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_ROLES,
} from './storage';
import { FIRESTORE_DATABASE_ID } from './domainService';

export interface SyncStats {
  membersCount: number;
  tiersCount: number;
  staysCount: number;
  transactionsCount: number;
  pointTxsCount: number;
  rewardsCount: number;
  vouchersCount: number;
  promotionsCount: number;
  lastSyncedAt: string;
  databaseId: string;
  latencyMs: number;
  status: 'synced' | 'syncing' | 'offline' | 'error';
  error?: string;
}

/**
 * Checks if Firestore collections are already populated. If empty, seeds initial data.
 */
export async function seedFirestoreIfEmpty(): Promise<{ seeded: boolean; counts: Record<string, number> }> {
  const counts: Record<string, number> = {};

  try {
    const membersSnap = await getDocs(collection(db, 'members'));
    counts.members = membersSnap.size;

    if (membersSnap.empty) {
      console.log('[FIRESTORE SEED] Cloud database empty, seeding initial records...');
      const batch = writeBatch(db);

      // 1. Members
      INITIAL_MEMBERS.forEach((m) => {
        batch.set(doc(db, 'members', m.id), m);
      });

      // 2. Tiers
      INITIAL_TIERS.forEach((t) => {
        batch.set(doc(db, 'membership_tiers', t.id), t);
      });

      // 3. Benefits
      INITIAL_BENEFITS.forEach((b) => {
        batch.set(doc(db, 'membership_benefits', b.id), b);
      });

      // 4. Rules
      INITIAL_RULES.forEach((r) => {
        batch.set(doc(db, 'membership_rules', r.id), r);
      });

      // 5. Stays
      INITIAL_STAYS.forEach((s) => {
        batch.set(doc(db, 'stays', s.id), s);
      });

      // 6. Transactions
      INITIAL_TRANSACTIONS.forEach((tx) => {
        batch.set(doc(db, 'transactions', tx.id), tx);
      });

      // 7. Point Transactions
      INITIAL_POINT_TXS.forEach((ptx) => {
        batch.set(doc(db, 'point_transactions', ptx.id), ptx);
      });

      // 8. Rewards
      INITIAL_REWARDS.forEach((rew) => {
        batch.set(doc(db, 'rewards', rew.id), rew);
      });

      // 9. Vouchers
      INITIAL_VOUCHERS.forEach((vch) => {
        batch.set(doc(db, 'vouchers', vch.id), vch);
      });

      // 10. Promotions
      INITIAL_PROMOTIONS.forEach((p) => {
        batch.set(doc(db, 'promotions', p.id), p);
      });

      // 11. System Settings
      batch.set(doc(db, 'system_settings', 'hotel_settings'), INITIAL_SETTINGS);

      // 12. Users & Roles
      INITIAL_USERS.forEach((u) => {
        batch.set(doc(db, 'users', u.id), u);
      });
      INITIAL_ROLES.forEach((ro) => {
        batch.set(doc(db, 'roles', ro.id), ro);
      });

      await batch.commit();
      console.log('[FIRESTORE SEED] Cloud database successfully populated with initial dataset.');
      return { seeded: true, counts: { members: INITIAL_MEMBERS.length, tiers: INITIAL_TIERS.length } };
    }

    return { seeded: false, counts };
  } catch (err) {
    console.warn('[FIRESTORE SEED NOTICE]', err);
    return { seeded: false, counts };
  }
}

/**
 * Force synchronization of all in-memory or local entities to Firestore
 */
export async function pushAllToFirestore(payload: {
  members: Member[];
  tiers: MembershipTier[];
  benefits: MembershipBenefit[];
  rules: MembershipRule[];
  stays: Stay[];
  transactions: Transaction[];
  pointTransactions: PointTransaction[];
  rewards: Reward[];
  vouchers: Voucher[];
  promotions: PromotionCampaign[];
  systemSettings: HotelSystemSettings;
  users: User[];
  roles: Role[];
}): Promise<{ success: boolean; totalUploaded: number; latencyMs: number; error?: string }> {
  const startTime = Date.now();
  let totalUploaded = 0;

  try {
    const batch = writeBatch(db);

    payload.members.forEach((m) => {
      batch.set(doc(db, 'members', m.id), m);
      totalUploaded++;
    });

    payload.tiers.forEach((t) => {
      batch.set(doc(db, 'membership_tiers', t.id), t);
      totalUploaded++;
    });

    payload.benefits.forEach((b) => {
      batch.set(doc(db, 'membership_benefits', b.id), b);
      totalUploaded++;
    });

    payload.rules.forEach((r) => {
      batch.set(doc(db, 'membership_rules', r.id), r);
      totalUploaded++;
    });

    payload.stays.forEach((s) => {
      batch.set(doc(db, 'stays', s.id), s);
      totalUploaded++;
    });

    payload.transactions.forEach((tx) => {
      batch.set(doc(db, 'transactions', tx.id), tx);
      totalUploaded++;
    });

    payload.pointTransactions.forEach((ptx) => {
      batch.set(doc(db, 'point_transactions', ptx.id), ptx);
      totalUploaded++;
    });

    payload.rewards.forEach((r) => {
      batch.set(doc(db, 'rewards', r.id), r);
      totalUploaded++;
    });

    payload.vouchers.forEach((v) => {
      batch.set(doc(db, 'vouchers', v.id), v);
      totalUploaded++;
    });

    payload.promotions.forEach((p) => {
      batch.set(doc(db, 'promotions', p.id), p);
      totalUploaded++;
    });

    batch.set(doc(db, 'system_settings', 'hotel_settings'), payload.systemSettings);
    totalUploaded++;

    payload.users.forEach((u) => {
      batch.set(doc(db, 'users', u.id), u);
      totalUploaded++;
    });

    payload.roles.forEach((ro) => {
      batch.set(doc(db, 'roles', ro.id), ro);
      totalUploaded++;
    });

    await batch.commit();

    return {
      success: true,
      totalUploaded,
      latencyMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    const errorText = err instanceof Error ? err.message : String(err);
    console.error('Error in pushAllToFirestore:', err);
    return {
      success: false,
      totalUploaded,
      latencyMs: Date.now() - startTime,
      error: errorText,
    };
  }
}

/**
 * Ping and measure real latency to Firestore
 */
export async function measureFirestoreLatency(): Promise<{ connected: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    await getDocFromServer(doc(db, 'system_settings', 'hotel_settings'));
    return { connected: true, latencyMs: Date.now() - start };
  } catch {
    // If specific document doesn't exist, still test general connectivity
    try {
      await getDocFromServer(doc(db, 'test', 'ping'));
      return { connected: true, latencyMs: Date.now() - start };
    } catch {
      return { connected: false, latencyMs: Date.now() - start };
    }
  }
}
