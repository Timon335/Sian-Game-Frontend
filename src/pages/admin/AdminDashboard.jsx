import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Empty, ErrorBox, Loading } from '../../components/admin/AdminStates';
import { getAdminStats } from '../../api/backend';
import { baht, dateTH } from '../../utils/format';

function StatCard({ label, value, to }) {
  const body = (
    <>
      <p className="text-sm text-sian-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </>
  );
  const cls = 'rounded bg-sian-panel p-4';
  return to ? <Link to={to} className={cls + ' block hover:bg-sian-raised'}>{body}</Link> : <div className={cls}>{body}</div>;
}

function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const data = await getAdminStats(token); // ยิงครั้งเดียว ได้ทุกตัวเลขของหน้านี้
        if (!ignore) { setStats(data); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [token, reloadKey]);

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorBox error={error} onRetry={() => setReloadKey((k) => k + 1)} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="เกมที่ขายอยู่" value={stats.games} to="/admin/games" />
        <StatCard label="สมาชิก" value={stats.members} to="/admin/members" />
        <StatCard label="Admin" value={stats.admins} />
        <StatCard label="คำสั่งซื้อ" value={stats.orders} to="/admin/orders" />
        <StatCard label="ยอดขาย" value={baht(stats.revenue)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded bg-sian-panel p-4">
          <h2 className="font-semibold text-white">เกมขายดี</h2>
          {stats.topSelling.length === 0 ? <div className="mt-3"><Empty text="ยังไม่มียอดขาย" /></div> : (
            <ol className="mt-3 divide-y divide-sian-line">
              {stats.topSelling.map((g, i) => (
                <li key={g.id} className="flex items-center gap-3 py-2">
                  <span className="w-5 text-sm text-sian-muted">{i + 1}</span>
                  <img src={g.cover} alt="" className="h-9 w-20 rounded object-cover" />
                  <Link to={`/games/${g.id}`} className="min-w-0 flex-1 truncate text-sm hover:text-sian-accent">{g.title}</Link>
                  <span className="text-sm text-sian-muted">ขายได้ {g.salesCount}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="rounded bg-sian-panel p-4">
          <h2 className="font-semibold text-white">สมาชิกใหม่ล่าสุด</h2>
          <ul className="mt-3 divide-y divide-sian-line">
            {stats.newestMembers.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{m.displayName}</p>
                  <p className="truncate text-xs text-sian-muted">{m.email}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-sian-muted">{dateTH(m.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
