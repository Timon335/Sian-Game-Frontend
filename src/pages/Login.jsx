import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { btnGhost, btnPrimary, inputClass } from '../components/admin/AdminStates';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  function fillDemo() {
    setEmail('demo@siangame.test');
    setPassword('demo1234');
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <form onSubmit={handleSubmit} className="rounded bg-sian-panel p-6">
        <h1 className="text-2xl font-bold text-white">เข้าสู่ระบบ</h1>
        {location.state?.expired && <p role="status" className="mt-2 text-sm text-sian-star">การเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่</p>}
        <label className="mt-4 block text-sm text-sian-muted" htmlFor="email">อีเมล</label>
        <input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass + ' mt-1'} />
        <label className="mt-3 block text-sm text-sian-muted" htmlFor="password">รหัสผ่าน</label>
        <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass + ' mt-1'} />
        {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={busy} className={btnPrimary + ' mt-4 w-full'}>{busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>
        <button type="button" onClick={fillDemo} className={btnGhost + ' mt-2 w-full'}>กรอกบัญชีทดลอง</button>
        <p className="mt-4 text-center text-sm text-sian-muted">
          ยังไม่มีบัญชี? <Link to="/register" state={location.state} className="text-sian-accent hover:underline">สมัครสมาชิก</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
