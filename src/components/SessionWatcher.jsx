import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// เมื่อ token หมดอายุ พาไปหน้าเข้าสู่ระบบจากทุกหน้า รวมหน้าสาธารณะ และจำหน้าเดิมไว้
function SessionWatcher() {
  const { sessionExpired, clearSessionExpired } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!sessionExpired) return;
    clearSessionExpired();
    navigate('/login', { replace: true, state: { from: pathname, expired: true } });
  }, [sessionExpired, clearSessionExpired, navigate, pathname]);

  return null;
}

export default SessionWatcher;
