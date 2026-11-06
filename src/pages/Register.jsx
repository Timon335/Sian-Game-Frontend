import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { btnPrimary, inputClass } from '../components/admin/AdminStates';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน'); return; }
    setBusy(true);
    setError(null);
    try {
      await register(form.email, form.password, form.displayName);
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <form onSubmit={handleSubmit} className="rounded bg-sian-panel p-6">
        <h1 className="text-2xl font-bold text-white">สมัครสมาชิก</h1>
        <label className="mt-4 block text-sm text-sian-muted" htmlFor="displayName">ชื่อที่แสดง</label>
        <input id="displayName" required maxLength={50} value={form.displayName} onChange={set('displayName')} className={inputClass + ' mt-1'} />
        <label className="mt-3 block text-sm text-sian-muted" htmlFor="email">อีเมล</label>
        <input id="email" type="email" required autoComplete="username" value={form.email} onChange={set('email')} className={inputClass + ' mt-1'} />
        <label className="mt-3 block text-sm text-sian-muted" htmlFor="password">รหัสผ่าน</label>
        <input id="password" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} className={inputClass + ' mt-1'} />
        <p className="mt-1 text-xs text-sian-muted">อย่างน้อย 8 ตัวอักษร</p>
        <label className="mt-3 block text-sm text-sian-muted" htmlFor="confirm">ยืนยันรหัสผ่าน</label>
        <input id="confirm" type="password" required autoComplete="new-password" value={form.confirm} onChange={set('confirm')} className={inputClass + ' mt-1'} />
        {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={busy} className={btnPrimary + ' mt-4 w-full'}>{busy ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}</button>
        <p className="mt-4 text-center text-sm text-sian-muted">
          มีบัญชีแล้ว? <Link to="/login" state={location.state} className="text-sian-accent hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
