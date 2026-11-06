import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as api from '../api/backend';

// Context คือกล่องกลางที่ทุกหน้าหยิบสถานะ login ได้ ไม่ต้องส่ง props ต่อกันเป็นทอด ๆ
const AuthContext = createContext(null);

const TOKEN_KEY = 'siangame.token';
const MEMBER_KEY = 'siangame.member';

function readMember() {
  try {
    return JSON.parse(localStorage.getItem(MEMBER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // อ่านค่าเดิมจาก localStorage จะได้ไม่หลุด login ตอนรีเฟรช
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [member, setMember] = useState(readMember);
  const [sessionExpired, setSessionExpired] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setMember(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MEMBER_KEY);
  }, []);

  // token หมดอายุระหว่างใช้งาน: ล้างสถานะ แล้ว SessionWatcher จะพาไปหน้าเข้าสู่ระบบ
  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      logout();
      setSessionExpired(true);
    });
    return () => api.setUnauthorizedHandler(null);
  }, [logout]);

  function updateMember(next) {
    setMember(next);
    localStorage.setItem(MEMBER_KEY, JSON.stringify(next));
  }

  async function login(email, password) {
    const data = await api.login(email, password); // ถ้าผิด backend.js จะ throw
    setToken(data.token);
    localStorage.setItem(TOKEN_KEY, data.token);
    updateMember(data.member);
    return data.member;
  }

  async function register(email, password, displayName) {
    await api.register(email, password, displayName);
    return login(email, password); // สมัครเสร็จเข้าสู่ระบบให้เลย
  }

  const value = {
    token,
    member,
    isLoggedIn: Boolean(token),
    isAdmin: member?.role === 'admin',
    login,
    register,
    logout,
    updateMember,
    sessionExpired,
    clearSessionExpired: () => setSessionExpired(false),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
