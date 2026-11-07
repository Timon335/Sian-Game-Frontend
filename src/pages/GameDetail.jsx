import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { ErrorBox, Loading, btnGhost, btnPrimary } from '../components/admin/AdminStates';
import { Stars } from '../components/GameCard';
import ReviewSection from '../components/ReviewSection';
import { addToCart, addToWishlist, getCart, getGame, getLibrary, getWishlist, removeFromWishlist } from '../api/backend';
import { baht, dateTH } from '../utils/format';

function GameDetail() {
  const { id } = useParams();
  const gameId = Number(id);
  const { token, isLoggedIn } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [mine, setMine] = useState({ owned: false, inCart: false, wished: false });
  const [shot, setShot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      setShot(null);
      try {
        const data = await getGame(gameId);
        if (!ignore) { setGame(data); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [gameId, reloadKey]);

  // สถานะของสมาชิกเป็นข้อมูลเสริม โหลดพังก็ยังดูเกมได้ ฝั่ง Go จะตรวจซ้ำตอนกดซื้ออยู่แล้ว
  useEffect(() => {
    if (!token) { setMine({ owned: false, inCart: false, wished: false }); return undefined; }
    let ignore = false;
    Promise.all([getLibrary(token), getCart(token), getWishlist(token)])
      .then(([library, cart, wishlist]) => {
        if (ignore) return;
        const has = (list) => list.some((g) => g.id === gameId);
        setMine({ owned: has(library), inCart: has(cart), wished: has(wishlist) });
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, [token, gameId]);

  function goLogin() {
    navigate('/login', { state: { from: `/games/${gameId}` } });
  }

  async function handleBuy() {
    if (!isLoggedIn) { goLogin(); return; }
    setBusy(true);
    setActionError(null);
    try {
      await addToCart(gameId, token);
      refreshCart();
      navigate('/me/cart');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleWish() {
    if (!isLoggedIn) { goLogin(); return; }
    setBusy(true);
    setActionError(null);
    try {
      if (mine.wished) await removeFromWishlist(gameId, token);
      else await addToWishlist(gameId, token);
      setMine({ ...mine, wished: !mine.wished });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (status === 'loading') return <Loading />;
  if (status === 'error') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorBox error={error} onRetry={error?.status === 404 ? undefined : () => setReloadKey((k) => k + 1)} />
        <Link to="/games" className="mt-4 inline-block text-sian-accent hover:underline">กลับไปร้านค้า</Link>
      </div>
    );
  }

  const mainImage = shot ?? game.screenshots[0] ?? game.cover;

  return (
    <div className="sian-page">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="text-sm text-sian-muted">
          <Link to="/games" className="hover:text-white">ร้านค้า</Link> / {game.title}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">{game.title}</h1>

        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <img src={mainImage} alt={`ภาพจากเกม ${game.title}`} className="aspect-video w-full rounded object-cover" />
            <div className="mt-2 grid grid-cols-4 gap-2">
              {game.screenshots.map((url) => (
                <button key={url} onClick={() => setShot(url)} aria-label="ดูภาพตัวอย่าง" className={'overflow-hidden rounded border-2 ' + (url === mainImage ? 'border-sian-accent' : 'border-transparent')}>
                  <img src={url} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <aside className="rounded bg-sian-panel p-4">
            <img src={game.cover} alt="" className="w-full rounded" />
            <p className="mt-3 text-sm leading-relaxed">{game.description}</p>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-sian-muted">คะแนน</dt><dd>{game.ratingCount > 0 ? <><Stars value={game.ratingAverage} /> ({game.ratingCount})</> : 'ยังไม่มีรีวิว'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-sian-muted">ผู้พัฒนา</dt><dd className="text-right">{game.developer}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-sian-muted">วางจำหน่าย</dt><dd>{dateTH(game.releaseDate)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-sian-muted">แนวเกม</dt><dd className="text-right">{game.genres.join(', ')}</dd></div>
            </dl>
          </aside>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded bg-sian-raised p-4">
          <p className="font-semibold text-white">ซื้อ {game.title}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-lg font-semibold text-sian-price">{baht(game.price)}</span>
            {mine.owned ? (
              <Link to="/me/library" className={btnGhost}>มีในคลังแล้ว</Link>
            ) : !game.isActive ? (
              <span className="rounded bg-sian-deep px-4 py-2 text-sm text-sian-muted">เลิกจำหน่ายแล้ว</span>
            ) : mine.inCart ? (
              <Link to="/me/cart" className={btnGhost}>อยู่ในตะกร้าแล้ว</Link>
            ) : (
              <button onClick={handleBuy} disabled={busy} className={btnPrimary}>ใส่ตะกร้า</button>
            )}
            {!mine.owned && game.isActive && (
              <button onClick={toggleWish} disabled={busy} className={btnGhost}>{mine.wished ? 'เอาออกจากอยากได้' : 'เพิ่มในอยากได้'}</button>
            )}
          </div>
        </div>
        {actionError && <p role="alert" className="mt-2 text-sm text-red-300">{actionError}</p>}

        <ReviewSection gameId={gameId} onChanged={() => getGame(gameId).then(setGame).catch(() => {})} />
      </div>
    </div>
  );
}

export default GameDetail;
