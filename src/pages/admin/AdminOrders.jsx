import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Empty, ErrorBox, Loading } from '../../components/admin/AdminStates';
import { getAdminOrders } from '../../api/backend';
import { baht, dateTH } from '../../utils/format';

// คำสั่งซื้อดูอย่างเดียว เพราะซื้อแล้วเกมเข้าคลังทันที ไม่มีขั้นตอนให้ Admin ยืนยัน
function AdminOrders() {
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
        const list = await getAdminOrders(token);
        if (!ignore) { setOrders(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [token, reloadKey]);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-white">คำสั่งซื้อ {status === 'success' && <span className="text-sm font-normal text-sian-muted">({orders.length} ใบ)</span>}</h2>
      {status === 'loading' && <Loading />}
      {status === 'error' && <ErrorBox error={error} onRetry={() => setReloadKey((k) => k + 1)} />}
      {status === 'success' && orders.length === 0 && <Empty text="ยังไม่มีคำสั่งซื้อ" />}
      {status === 'success' && orders.length > 0 && (
        <div className="overflow-x-auto rounded bg-sian-panel">
          <table className="w-full text-sm">
            <thead className="bg-sian-raised text-left text-xs text-sian-muted">
              <tr>
                <th className="px-4 py-3">เลขที่</th>
                <th className="px-4 py-3">สมาชิก</th>
                <th className="px-4 py-3">เกม</th>
                <th className="px-4 py-3">ยอดรวม</th>
                <th className="px-4 py-3">วันที่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sian-line">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-2">#{o.id}</td>
                  <td className="px-4 py-2">
                    <p className="font-medium text-white">{o.member.displayName}</p>
                    <p className="text-xs text-sian-muted">{o.member.email}</p>
                  </td>
                  <td className="px-4 py-2">{o.items.map((it) => it.title).join(', ')}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-sian-price">{baht(o.total)}</td>
                  <td className="whitespace-nowrap px-4 py-2">{dateTH(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
