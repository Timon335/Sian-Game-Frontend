import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Empty, ErrorBox, Loading, btnGhost, btnPrimary } from '../components/admin/AdminStates';
import { getWishlist, removeFromWishlist } from '../api/backend';
import { baht } from '../utils/format';

function Wishlist() {
  const { token } = useAuth();
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const list = await getWishlist(token);
        if (!ignore) { setGames(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [token, reloadKey]);

  async function remove(id) {
    setActionError(null);
    try {
      await removeFromWishlist(id, token);
      setGames((list) => list.filter((g) => g.id !== id));
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white">เกมที่อยากได้</h1>
      <div className="mt-4">
        {status === 'loading' && <Loading />}
        {status === 'error' && <ErrorBox error={error} onRetry={() => setReloadKey((k) => k + 1)} />}
        {status === 'success' && games.length === 0 && (
          <Empty text="ยังไม่มีเกมที่อยากได้">
            <Link to="/games" className={btnPrimary}>ไปที่ร้านค้า</Link>
          </Empty>
        )}
        {status === 'success' && games.length > 0 && (
          <ul className="space-y-2">
            {games.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center gap-3 rounded bg-sian-panel p-3">
                <img src={g.cover} alt="" className="h-14 w-28 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to={`/games/${g.id}`} className="block truncate font-medium text-white hover:text-sian-accent">{g.title}</Link>
                  {!g.isActive && <p className="text-sm text-red-300">เลิกจำหน่ายแล้ว</p>}
                </div>
                <span className="font-semibold text-sian-price">{baht(g.price)}</span>
                <button onClick={() => remove(g.id)} aria-label={`เอา ${g.title} ออก`} className={btnGhost}>เอาออก</button>
              </li>
            ))}
          </ul>
        )}
        {actionError && <p role="alert" className="mt-2 text-sm text-red-300">{actionError}</p>}
      </div>
    </div>
  );
}

export default Wishlist;
