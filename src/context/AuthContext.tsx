import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Member, UserRoleType, PermissionCode, Role } from '../types';
import {
  INITIAL_USERS,
  INITIAL_ROLES,
  INITIAL_MEMBERS,
  loadFromStorage,
  saveToStorage,
} from '../services/storage';

interface AuthContextValue {
  currentUser: User | null;
  currentMember: Member | null;
  userRole: UserRoleType | null;
  roles: Role[];
  isAuthenticated: boolean;
  hasPermission: (permission: PermissionCode) => boolean;
  login: (email: string, password?: string) => boolean;
  loginWithGoogle: (googleEmail: string, displayName?: string, photoURL?: string) => boolean;
  logout: () => void;
  switchDemoRole: (userIdOrRole: string) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  refreshMemberData: (member: Member) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() =>
    loadFromStorage<User[]>('users', INITIAL_USERS)
  );
  const [roles] = useState<Role[]>(() =>
    loadFromStorage<Role[]>('roles', INITIAL_ROLES)
  );
  const [members, setMembers] = useState<Member[]>(() =>
    loadFromStorage<Member[]>('members', INITIAL_MEMBERS)
  );

  // Active user session (null when logged out, defaults to initial user for immediate access or saved session)
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return loadFromStorage<string | null>('auth_current_user_id', 'usr_superadmin');
  });

  const currentUser = currentUserId ? users.find((u) => u.id === currentUserId) || null : null;
  const userRole = currentUser?.role || null;
  const isAuthenticated = Boolean(currentUser);

  // If user is a member, get member details
  const currentMember =
    userRole === 'MEMBER' && currentUser?.memberId
      ? members.find((m) => m.id === currentUser.memberId) || members[0]
      : null;

  useEffect(() => {
    if (currentUserId) {
      saveToStorage('auth_current_user_id', currentUserId);
    } else {
      localStorage.removeItem('lgh_membership_auth_current_user_id');
    }
  }, [currentUserId]);

  const hasPermission = (permission: PermissionCode): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true; // Super admin has universal permissions

    const roleObj = roles.find((r) => r.id === currentUser.roleId);
    if (!roleObj) return false;
    return roleObj.permissions.includes(permission);
  };

  const login = (email: string, _password?: string): boolean => {
    const cleanEmail = email.toLowerCase().trim();
    const foundUser = users.find(
      (u) => u.email.toLowerCase().trim() === cleanEmail
    );

    if (foundUser) {
      if (!foundUser.isActive) return false;
      setCurrentUserId(foundUser.id);
      return true;
    }

    // Check if it's a member email not yet in users table
    const foundMember = members.find(
      (m) => m.email.toLowerCase().trim() === cleanEmail
    );
    if (foundMember) {
      const newMemberUser: User = {
        id: `usr_${foundMember.id}`,
        email: foundMember.email,
        name: foundMember.fullName,
        role: 'MEMBER',
        roleId: 'role_member',
        memberId: foundMember.id,
        phone: foundMember.phone,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const updated = [...users, newMemberUser];
      setUsers(updated);
      saveToStorage('users', updated);
      setCurrentUserId(newMemberUser.id);
      return true;
    }

    return false;
  };

  const loginWithGoogle = (googleEmail: string, displayName?: string, photoURL?: string): boolean => {
    const cleanEmail = googleEmail.toLowerCase().trim();

    // 1. Check existing users table (staff / super admin / existing member user)
    const existingUser = users.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (existingUser) {
      if (!existingUser.isActive) return false;
      if (photoURL && !existingUser.avatar) {
        existingUser.avatar = photoURL;
      }
      setCurrentUserId(existingUser.id);
      return true;
    }

    // 2. Check existing members table
    const existingMember = members.find((m) => m.email.toLowerCase().trim() === cleanEmail);
    if (existingMember) {
      const newMemberUser: User = {
        id: `usr_${existingMember.id}`,
        email: existingMember.email,
        name: displayName || existingMember.fullName,
        role: 'MEMBER',
        roleId: 'role_member',
        memberId: existingMember.id,
        avatar: photoURL,
        phone: existingMember.phone,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const updated = [...users, newMemberUser];
      setUsers(updated);
      saveToStorage('users', updated);
      setCurrentUserId(newMemberUser.id);
      return true;
    }

    // 3. New Google User -> Register as new Member & User
    const newMemberId = `mem_g_${Date.now()}`;
    const membershipNumber = `LGH-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString().slice(0, 10);
    const end = new Date(Date.now() + 24 * 30 * 86400000).toISOString().slice(0, 10);

    const newMember: Member = {
      id: newMemberId,
      membershipNumber,
      fullName: displayName || cleanEmail.split('@')[0],
      nickname: (displayName || cleanEmail.split('@')[0]).split(' ')[0],
      email: cleanEmail,
      phone: '+62 812-Google-User',
      gender: 'L',
      birthDate: '1995-01-01',
      address: 'Mataram, Lombok',
      city: 'Mataram',
      province: 'Nusa Tenggara Barat',
      country: 'Indonesia',
      idCardNumber: '5201GoogleVerified',
      tierId: 'tier_member',
      registrationDate: now,
      membershipStartDate: now,
      membershipEndDate: end,
      referralCode: `${(displayName || 'LGH').slice(0, 4).toUpperCase()}-GOOG`,
      status: 'ACTIVE',
      totalVisits: 0,
      totalTransactions: 0,
      totalSpending: 0,
      totalPointsEarned: 100, // Welcome points
      availablePoints: 100,
      redeemedPoints: 0,
      internalNotes: 'Pendaftaran otomatis melalui Verifikasi Akun Google.',
    };

    const updatedMembers = [newMember, ...members];
    setMembers(updatedMembers);
    saveToStorage('members', updatedMembers);

    const newGoogleUser: User = {
      id: `usr_${newMemberId}`,
      email: cleanEmail,
      name: displayName || cleanEmail.split('@')[0],
      role: 'MEMBER',
      roleId: 'role_member',
      memberId: newMemberId,
      avatar: photoURL,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newGoogleUser];
    setUsers(updatedUsers);
    saveToStorage('users', updatedUsers);
    setCurrentUserId(newGoogleUser.id);
    return true;
  };

  const logout = () => {
    setCurrentUserId(null);
  };

  const switchDemoRole = (targetIdOrRole: string) => {
    // Check if target is a known user ID
    const targetUser = users.find((u) => u.id === targetIdOrRole);
    if (targetUser) {
      setCurrentUserId(targetUser.id);
      return;
    }

    // Check if target is a role identifier
    if (targetIdOrRole === 'SUPER_ADMIN') {
      setCurrentUserId('usr_superadmin');
      return;
    }
    if (targetIdOrRole === 'ADMIN') {
      setCurrentUserId('usr_admin');
      return;
    }
    if (targetIdOrRole === 'MEMBER') {
      setCurrentUserId('usr_member_john');
      return;
    }

    // Check if target is a member ID directly
    const memberTarget = members.find((m) => m.id === targetIdOrRole);
    if (memberTarget) {
      // Find or create user for this member
      let memUser = users.find((u) => u.memberId === memberTarget.id);
      if (!memUser) {
        memUser = {
          id: `usr_${memberTarget.id}`,
          email: memberTarget.email,
          name: memberTarget.fullName,
          role: 'MEMBER',
          roleId: 'role_member',
          memberId: memberTarget.id,
          phone: memberTarget.phone,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        const updated = [...users, memUser];
        setUsers(updated);
        saveToStorage('users', updated);
      }
      setCurrentUserId(memUser.id);
    }
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = users.map((u) =>
      u.id === currentUser.id ? { ...u, ...updates } : u
    );
    setUsers(updated);
    saveToStorage('users', updated);
  };

  const refreshMemberData = (updatedMember: Member) => {
    const updatedList = members.map((m) =>
      m.id === updatedMember.id ? updatedMember : m
    );
    setMembers(updatedList);
    saveToStorage('members', updatedList);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentMember,
        userRole,
        roles,
        isAuthenticated,
        hasPermission,
        login,
        loginWithGoogle,
        logout,
        switchDemoRole,
        updateCurrentUser,
        refreshMemberData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
