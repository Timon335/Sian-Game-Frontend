import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { ConfirmBox, Empty, ErrorBox, Loading, btnGhost, inputClass } from '../../components/admin/AdminStates';
import { getAdminMembers, setMemberRole } from '../../api/backend';
import { dateTH } from '../../utils/format';

function AdminMembers() {
  const { token, member: me } = useAuth();
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState(null); // สมาชิกที่กำลังจะเปลี่ยนบทบาท
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const list = await getAdminMembers(token);
        if (!ignore) { setMembers(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [token, reloadKey]);

  async function confirmRole() {
    const nextRole = target.role === 'admin' ? 'member' : 'admin';
    setBusy(true);
    setActionError(null);
    try {
      const updated = await setMemberRole(target.id, nextRole, token);
      setMembers(members.map((m) => (m.id === updated.id ? updated : m))); // แทนที่ด้วยข้อมูลที่ server ยืนยัน
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
      setTarget(null);
    }
  }

  const q = query.trim().toLowerCase();
  const shown = members.filter((m) => q === '' || m.displayName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-white">สมาชิก {status === 'success' && <span className="text-sm font-normal text-sian-muted">({members.length} คน)</span>}</h2>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นชื่อหรืออีเมล" aria-label="ค้นหาสมาชิก" className={inputClass + ' md:w-64'} />
      </div>
      {actionError && <p role="alert" className="mb-3 text-sm text-red-300">{actionError}</p>}
      {status === 'loading' && <Loading />}
      {status === 'error' && <ErrorBox error={error} onRetry={() => setReloadKey((k) => k + 1)} />}
      {status === 'success' && shown.length === 0 && <Empty text="ไม่พบสมาชิก" />}
      {status === 'success' && shown.length > 0 && (
        <div className="overflow-x-auto rounded bg-sian-panel">
          <table className="w-full text-sm">
            <thead className="bg-sian-raised text-left text-xs text-sian-muted">
              <tr>
                <th className="px-4 py-3">สมาชิก</th>
                <th className="px-4 py-3">บทบาท</th>
                <th className="px-4 py-3">สมัครเมื่อ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sian-line">
              {shown.map((m) => {
                const isMe = m.id === me?.id;
                return (
                  <tr key={m.id}>
                    <td className="px-4 py-2">
                      <p className="font-medium text-white">{m.displayName} {isMe && <span className="text-xs text-sian-muted">(คุณ)</span>}</p>
                      <p className="text-xs text-sian-muted">{m.email}</p>
                    </td>
                    <td className="px-4 py-2">{m.role}</td>
                    <td className="whitespace-nowrap px-4 py-2">{dateTH(m.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">
                      <button onClick={() => setTarget(m)} disabled={isMe} className={btnGhost}>
                        {m.role === 'admin' ? 'ลดเป็น member' : 'เลื่อนเป็น admin'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmBox open={Boolean(target)} busy={busy} confirmText="ยืนยัน"
        title={target?.role === 'admin' ? `ลด ${target?.displayName} เป็น member?` : `เลื่อน ${target?.displayName} เป็น admin?`}
        onConfirm={confirmRole} onCancel={() => setTarget(null)}>
        <p>มีผลเมื่อสมาชิกคนนี้เข้าสู่ระบบใหม่ ตั๋วที่ถืออยู่ใช้ได้จนหมดอายุภายใน 1 ชั่วโมง</p>
      </ConfirmBox>
    </div>
  );
}

export default AdminMembers;
