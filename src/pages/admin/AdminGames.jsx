import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ConfirmBox, Empty, ErrorBox, Loading, btnGhost, btnPrimary, inputClass } from '../../components/admin/AdminStates';
import { getAdminGames, stopSellingGame } from '../../api/backend';
import { baht } from '../../utils/format';

function AdminGames() {
  const { token } = useAuth();
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState(null); // เกมที่กำลังจะเลิกขาย
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const list = await getAdminGames(token);
        if (!ignore) { setGames(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [token, reloadKey]);

  async function confirmStop() {
    setBusy(true);
    setActionError(null);
    try {
      await stopSellingGame(target.id, token);
      setGames(games.map((g) => (g.id === target.id ? { ...g, isActive: false } : g)));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
      setTarget(null);
    }
  }

  const q = query.trim().toLowerCase();
  const shown = games.filter((g) => q === '' || g.title.toLowerCase().includes(q) || String(g.id) === q);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-white">เกมทั้งหมด {status === 'success' && <span className="text-sm font-normal text-sian-muted">({games.length} เกม)</span>}</h2>
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นชื่อเกม หรือเลขเกม" aria-label="ค้นหาเกม" className={inputClass + ' md:w-64'} />
          <Link to="/admin/games/new" className={btnPrimary + ' whitespace-nowrap'}>+ เพิ่มเกม</Link>
        </div>
      </div>
      {actionError && <p role="alert" className="mb-3 text-sm text-red-300">{actionError}</p>}
      {status === 'loading' && <Loading />}
      {status === 'error' && <ErrorBox error={error} onRetry={() => setReloadKey((k) => k + 1)} />}
      {status === 'success' && shown.length === 0 && <Empty text="ไม่พบเกมที่ค้นหา" />}
      {status === 'success' && shown.length > 0 && (
        <div className="overflow-x-auto rounded bg-sian-panel">
          <table className="w-full text-sm">
            <thead className="bg-sian-raised text-left text-xs text-sian-muted">
              <tr>
                <th className="px-4 py-3">เกม</th>
                <th className="px-4 py-3">ราคา</th>
                <th className="px-4 py-3">ขายได้</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sian-line">
              {shown.map((g) => (
                <tr key={g.id}>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <img src={g.cover} alt="" className="h-9 w-20 rounded object-cover" />
                      <div className="min-w-0">
                        <p className="font-medium text-white">{g.title}</p>
                        <p className="text-xs text-sian-muted">#{g.id} · {g.genres.join(', ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">{baht(g.price)}</td>
                  <td className="px-4 py-2">{g.salesCount}</td>
                  <td className="whitespace-nowrap px-4 py-2">{g.isActive ? <span className="text-sian-price">ขายอยู่</span> : <span className="text-red-300">เลิกขายแล้ว</span>}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-right">
                    <Link to={`/admin/games/${g.id}`} className={btnGhost}>แก้ไข</Link>
                    {g.isActive && (
                      <button onClick={() => setTarget(g)} aria-label={`เลิกขาย ${g.title}`} className={btnGhost + ' ml-2'}>เลิกขาย</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmBox open={Boolean(target)} busy={busy} title={`เลิกขาย ${target?.title}?`} confirmText="ยืนยันเลิกขาย" onConfirm={confirmStop} onCancel={() => setTarget(null)}>
        <p>เกมจะหายจากร้าน แต่ยังอยู่ในคลังของคนที่ซื้อแล้ว นำกลับมาขายได้จากหน้าแก้ไข</p>
      </ConfirmBox>
    </div>
  );
}

export default AdminGames;
