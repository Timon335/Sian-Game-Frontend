import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { Empty, ErrorBox, Loading, btnPrimary, inputClass } from '../components/admin/AdminStates';
import { getCart, placeOrder } from '../api/backend';
import { baht } from '../utils/format';

// ค่าทดสอบ: เติมอัตโนมัติเมื่อคลิกช่องใดก็ได้ เพื่อให้เทสต์ได้เร็ว
const TEST_CARD = { number: '4242 4242 4242 4242', name: 'SIAN TESTER', expiry: '12/30', cvv: '123' };
const EMPTY_CARD = { number: '', name: '', expiry: '', cvv: '' };

function cardProblem(card) {
  if (!/^\d{16}$/.test(card.number.replace(/\s/g, ''))) return 'หมายเลขบัตรต้องเป็นตัวเลข 16 หลัก';
  if (!card.name.trim()) return 'กรุณากรอกชื่อบนบัตร';
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) return 'วันหมดอายุต้องอยู่ในรูปแบบ MM/YY';
  if (!/^\d{3,4}$/.test(card.cvv)) return 'CVV ต้องเป็นตัวเลข 3 หรือ 4 หลัก';
  return null;
}

function Checkout() {
  const { token } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  // ข้อมูลบัตรอยู่แค่ใน state นี้ ไม่ส่งไป Backend และไม่เก็บลงเบราว์เซอร์
  const [card, setCard] = useState(EMPTY_CARD);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const submitting = useRef(false); // กันกดซ้ำเร็วจน state ยังไม่ทันเปลี่ยน

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const list = await getCart(token);
        if (!ignore) { setItems(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [token, reloadKey]);

  // คลิกช่องใดก็ได้ เติมเฉพาะช่องที่ยังว่าง ค่าที่ผู้ใช้พิมพ์ไว้จะไม่ถูกทับ
  function fillTestCard(e) {
    if (e.target.tagName !== 'INPUT') return;
    setCard((c) => ({
      number: c.number || TEST_CARD.number,
      name: c.name || TEST_CARD.name,
      expiry: c.expiry || TEST_CARD.expiry,
      cvv: c.cvv || TEST_CARD.cvv,
    }));
  }

  const setField = (key) => (e) => setCard({ ...card, [key]: e.target.value });

  async function handlePay(e) {
    e.preventDefault();
    if (submitting.current) return;
    const problem = cardProblem(card);
    if (problem) { setPayError(problem); return; }
    submitting.current = true;
    setPaying(true);
    setPayError(null);
    try {
      await placeOrder(token); // ส่งแค่ token ราคาและรายการเกมให้ Go อ่านจากฐานข้อมูล
      refreshCart();
      navigate('/me/library', { replace: true });
    } catch (err) {
      setPayError(err.message);
      setPaying(false);
      submitting.current = false;
    }
  }

  const total = items.reduce((sum, g) => sum + g.price, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white">ชำระเงิน</h1>
      <div className="mt-4">
        {status === 'loading' && <Loading />}
        {status === 'error' && <ErrorBox error={error} onRetry={() => setReloadKey((k) => k + 1)} />}
        {status === 'success' && items.length === 0 && (
          <Empty text="ยังไม่มีเกมในตะกร้า">
            <Link to="/games" className={btnPrimary}>ไปที่ร้านค้า</Link>
          </Empty>
        )}
        {status === 'success' && items.length > 0 && (
          <div className="grid gap-4 md:grid-cols-5">
            <form onSubmit={handlePay} autoComplete="off" onFocus={fillTestCard} className="rounded bg-sian-panel p-5 md:col-span-3">
              <h2 className="text-lg font-semibold text-white">บัตรเครดิต</h2>
              <label className="mt-3 block text-sm text-sian-muted" htmlFor="cardNumber">หมายเลขบัตร</label>
              <input id="cardNumber" inputMode="numeric" autoComplete="off" value={card.number} onChange={setField('number')} className={inputClass + ' mt-1'} />
              <label className="mt-3 block text-sm text-sian-muted" htmlFor="cardName">ชื่อบนบัตร</label>
              <input id="cardName" autoComplete="off" value={card.name} onChange={setField('name')} className={inputClass + ' mt-1'} />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-sian-muted" htmlFor="cardExpiry">วันหมดอายุ</label>
                  <input id="cardExpiry" placeholder="MM/YY" autoComplete="off" value={card.expiry} onChange={setField('expiry')} className={inputClass + ' mt-1'} />
                </div>
                <div>
                  <label className="block text-sm text-sian-muted" htmlFor="cardCvv">CVV</label>
                  <input id="cardCvv" inputMode="numeric" autoComplete="off" value={card.cvv} onChange={setField('cvv')} className={inputClass + ' mt-1'} />
                </div>
              </div>
              {payError && (
                <div role="alert" className="mt-3 text-sm text-red-300">
                  <p>{payError}</p>
                  {(payError.includes('เลิกจำหน่าย') || payError.includes('ในคลัง') || payError.includes('ตะกร้า')) && (
                    <Link to="/me/cart" className="text-sian-accent hover:underline">กลับไปตะกร้า</Link>
                  )}
                </div>
              )}
              <button type="submit" disabled={paying} className={btnPrimary + ' mt-4 w-full'}>
                {paying ? 'กำลังชำระเงิน...' : `ชำระเงิน ${baht(total)}`}
              </button>
            </form>

            <aside className="rounded bg-sian-panel p-5 md:col-span-2">
              <h2 className="text-lg font-semibold text-white">สรุปคำสั่งซื้อ</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {items.map((g) => (
                  <li key={g.id} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">{g.title}</span>
                    <span className="text-sian-price">{baht(g.price)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex justify-between border-t border-sian-line pt-3 font-semibold text-white">
                <span>รวม</span><span>{baht(total)}</span>
              </p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default Checkout;
