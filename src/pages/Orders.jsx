import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Empty, ErrorBox, Loading, btnPrimary } from '../components/admin/AdminStates';
import { getOrders } from '../api/backend';
import { baht, dateTH } from '../utils/format';

function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const list = await getOrders(token);
        if (!ignore) { setOrders(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [token, reloadKey]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white">ประวัติคำสั่งซื้อ</h1>
      <div className="mt-4 space-y-3">
        {status === 'loading' && <Loading />}
        {status === 'error' && <ErrorBox error={error} onRetry={() => setReloadKey((k) => k + 1)} />}
        {status === 'success' && orders.length === 0 && (
          <Empty text="ยังไม่มีคำสั่งซื้อ">
            <Link to="/games" className={btnPrimary}>ไปที่ร้านค้า</Link>
          </Empty>
        )}
        {status === 'success' && orders.map((o) => (
          <article key={o.id} className="rounded bg-sian-panel p-4">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <p className="font-medium text-white">คำสั่งซื้อ #{o.id}</p>
              <p className="text-sian-muted">{dateTH(o.createdAt)}</p>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {o.items.map((it) => (
                <li key={it.gameId} className="flex justify-between gap-3">
                  <Link to={`/games/${it.gameId}`} className="min-w-0 truncate hover:text-sian-accent">{it.title}</Link>
                  <span>{baht(it.price)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t border-sian-line pt-2 text-right font-semibold text-sian-price">รวม {baht(o.total)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default Orders;
