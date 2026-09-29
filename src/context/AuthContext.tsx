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
  userRole: UserRoleType;
  roles: Role[];
  hasPermission: (permission: PermissionCode) => boolean;
  login: (email: string, roleHint?: UserRoleType) => boolean;
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

  // Default initial active user is Super Admin for full evaluation capabilities
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return loadFromStorage<string>('auth_current_user_id', 'usr_superadmin');
  });

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const userRole = currentUser?.role || 'MEMBER';

  // If user is a member, get member details
  const currentMember =
    userRole === 'MEMBER' && currentUser.memberId
      ? members.find((m) => m.id === currentUser.memberId) || members[0]
      : null;

  useEffect(() => {
    saveToStorage('auth_current_user_id', currentUserId);
  }, [currentUserId]);

  const hasPermission = (permission: PermissionCode): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true; // Super admin has universal permissions

    const roleObj = roles.find((r) => r.id === currentUser.roleId);
    if (!roleObj) return false;
    return roleObj.permissions.includes(permission);
  };

  const login = (email: string, _roleHint?: UserRoleType): boolean => {
    const foundUser = users.find(
      (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
    );

    if (foundUser) {
      if (!foundUser.isActive) return false;
      setCurrentUserId(foundUser.id);
      return true;
    }

    // Check if it's a member email not yet in users table
    const foundMember = members.find(
      (m) => m.email.toLowerCase().trim() === email.toLowerCase().trim()
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

  const logout = () => {
    // Switch to default public or member
    setCurrentUserId('usr_member_john');
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
        hasPermission,
        login,
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
