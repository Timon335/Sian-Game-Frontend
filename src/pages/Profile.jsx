import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { btnPrimary, inputClass } from '../components/admin/AdminStates';
import { changePassword, updateMe } from '../api/backend';

const EMPTY_PASSWORD = { current: '', next: '', confirm: '' };

function Profile() {
  const { token, member, updateMember } = useAuth();
  const [name, setName] = useState(member?.displayName ?? '');
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState(null);
  const [nameError, setNameError] = useState(null);

  const [pw, setPw] = useState(EMPTY_PASSWORD);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [pwError, setPwError] = useState(null);

  async function saveName(e) {
    e.preventDefault();
    setNameMsg(null);
    if (!name.trim()) { setNameError('ต้องมีชื่อที่แสดง'); return; }
    setNameBusy(true);
    setNameError(null);
    try {
      updateMember(await updateMe(name.trim(), token));
      setNameMsg('บันทึกชื่อแล้ว');
    } catch (err) {
      setNameError(err.message);
    } finally {
      setNameBusy(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwMsg(null);
    if (pw.next !== pw.confirm) { setPwError('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน'); return; }
    setPwBusy(true);
    setPwError(null);
    try {
      await changePassword(pw.current, pw.next, token);
      setPw(EMPTY_PASSWORD);
      setPwMsg('เปลี่ยนรหัสผ่านแล้ว');
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwBusy(false);
    }
  }

  const setField = (key) => (e) => setPw({ ...pw, [key]: e.target.value });

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white">โปรไฟล์ของฉัน</h1>

      <form onSubmit={saveName} className="mt-4 rounded bg-sian-panel p-5">
        <p className="text-sm text-sian-muted">อีเมล</p>
        <p className="text-white">{member?.email}</p>
        <label className="mt-3 block text-sm text-sian-muted" htmlFor="displayName">ชื่อที่แสดง</label>
        <input id="displayName" maxLength={50} value={name} onChange={(e) => setName(e.target.value)} className={inputClass + ' mt-1'} />
        {nameError && <p role="alert" className="mt-2 text-sm text-red-300">{nameError}</p>}
        {nameMsg && <p role="status" className="mt-2 text-sm text-sian-price">{nameMsg}</p>}
        <button type="submit" disabled={nameBusy} className={btnPrimary + ' mt-4'}>บันทึกชื่อ</button>
      </form>

      <form onSubmit={savePassword} className="mt-4 rounded bg-sian-panel p-5">
        <h2 className="text-lg font-semibold text-white">เปลี่ยนรหัสผ่าน</h2>
        <label className="mt-3 block text-sm text-sian-muted" htmlFor="current">รหัสผ่านเดิม</label>
        <input id="current" type="password" required autoComplete="current-password" value={pw.current} onChange={setField('current')} className={inputClass + ' mt-1'} />
        <label className="mt-3 block text-sm text-sian-muted" htmlFor="next">รหัสผ่านใหม่</label>
        <input id="next" type="password" required minLength={8} autoComplete="new-password" value={pw.next} onChange={setField('next')} className={inputClass + ' mt-1'} />
        <label className="mt-3 block text-sm text-sian-muted" htmlFor="confirm">ยืนยันรหัสผ่านใหม่</label>
        <input id="confirm" type="password" required autoComplete="new-password" value={pw.confirm} onChange={setField('confirm')} className={inputClass + ' mt-1'} />
        {pwError && <p role="alert" className="mt-2 text-sm text-red-300">{pwError}</p>}
        {pwMsg && <p role="status" className="mt-2 text-sm text-sian-price">{pwMsg}</p>}
        <button type="submit" disabled={pwBusy} className={btnPrimary + ' mt-4'}>เปลี่ยนรหัสผ่าน</button>
      </form>
    </div>
  );
}

export default Profile;
