import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ConfirmBox, Empty, ErrorBox, Loading, btnGhost } from '../../components/admin/AdminStates';
import { adminDeleteReview, getAdminReviews } from '../../api/backend';
import { dateTH } from '../../utils/format';

function AdminReviews() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const list = await getAdminReviews(token);
        if (!ignore) { setReviews(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [token, reloadKey]);

  async function confirmDelete() {
    setBusy(true);
    setActionError(null);
    try {
      await adminDeleteReview(target.id, token);
      setReviews(reviews.filter((r) => r.id !== target.id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
      setTarget(null);
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-white">รีวิว {status === 'success' && <span className="text-sm font-normal text-sian-muted">({reviews.length} รายการ)</span>}</h2>
      {actionError && <p role="alert" className="mb-3 text-sm text-red-300">{actionError}</p>}
      {status === 'loading' && <Loading />}
      {status === 'error' && <ErrorBox error={error} onRetry={() => setReloadKey((k) => k + 1)} />}
      {status === 'success' && reviews.length === 0 && <Empty text="ยังไม่มีรีวิว" />}
      {status === 'success' && reviews.length > 0 && (
        <div className="overflow-x-auto rounded bg-sian-panel">
          <table className="w-full text-sm">
            <thead className="bg-sian-raised text-left text-xs text-sian-muted">
              <tr>
                <th className="px-4 py-3">เกม</th>
                <th className="px-4 py-3">ผู้เขียน</th>
                <th className="px-4 py-3">คะแนน</th>
                <th className="px-4 py-3">รีวิว</th>
                <th className="px-4 py-3">วันที่</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sian-line">
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2"><Link to={`/games/${r.gameId}`} className="hover:text-sian-accent">{r.gameTitle}</Link></td>
                  <td className="px-4 py-2">
                    <p className="font-medium text-white">{r.displayName}</p>
                    <p className="text-xs text-sian-muted">{r.email}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-sian-star">★ {r.rating}</td>
                  <td className="max-w-xs break-words px-4 py-2">{r.text}</td>
                  <td className="whitespace-nowrap px-4 py-2">{dateTH(r.createdAt)}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => setTarget(r)} className={btnGhost}>ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmBox open={Boolean(target)} busy={busy} title="ลบรีวิวนี้?" confirmText="ลบรีวิว" onConfirm={confirmDelete} onCancel={() => setTarget(null)}>
        <p>เมื่อลบแล้วจะกู้คืนไม่ได้ คะแนนเฉลี่ยของเกมจะเปลี่ยนตาม</p>
      </ConfirmBox>
    </div>
  );
}

export default AdminReviews;
