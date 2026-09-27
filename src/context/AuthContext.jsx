import React, { useContext, useState } from 'react';
import { AuthContext } from './authContextDef';
import { apiService } from '../services/apiService';
import { USER_ROLES } from '../utils/constants';

export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cafe_pos_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // login is now async — calls real backend
  const login = async (username, password) => {
    const authResult = await apiService.login(username, password);
    if (!authResult) {
      throw new Error('Invalid username or password');
    }
    setUser(authResult);
    localStorage.setItem('cafe_pos_auth_user', JSON.stringify(authResult));
    return authResult;
  };

  const setupOwner = async (ownerData) => {
    const authResult = await apiService.setupOwner(ownerData);
    if (!authResult) {
      throw new Error('Failed to create owner account');
    }
    setUser(authResult);
    localStorage.setItem('cafe_pos_auth_user', JSON.stringify(authResult));
    return authResult;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cafe_pos_auth_user');
  };

  const isOwner = user?.role === USER_ROLES.OWNER;
  const isAdmin = user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.OWNER;
  const isWaiter = user?.role === USER_ROLES.WAITER || user?.role === USER_ROLES.OWNER;

  return (
    <AuthContext.Provider value={{ user, login, logout, setupOwner, isOwner, isAdmin, isWaiter }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
