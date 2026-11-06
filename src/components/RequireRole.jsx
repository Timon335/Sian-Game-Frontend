import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// ซ่อนหน้าจากคนที่ไม่มีสิทธิ์ แต่ด่านจริงอยู่ที่ Go ซึ่งตอบ 403 ทุกคำขอที่ไม่ใช่ admin
function RequireRole({ role, children }) {
  const { isLoggedIn, member } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (member?.role !== role) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-6xl font-bold text-sian-accent">403</p>
        <h1 className="mt-4 text-xl font-semibold text-white">คุณไม่มีสิทธิ์เข้าถึงส่วนนี้</h1>
        <Link to="/" className="mt-6 inline-block text-sian-accent hover:underline">กลับหน้าแรก</Link>
      </div>
    );
  }
  return children;
}

export default RequireRole;
