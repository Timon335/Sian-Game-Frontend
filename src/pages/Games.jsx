import { useEffect, useState } from 'react';
import GameGrid from '../components/GameGrid';
import { inputClass } from '../components/admin/AdminStates';
import { getGames } from '../api/backend';

const SORTERS = {
  bestseller: (a, b) => b.salesCount - a.salesCount,
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
};

function Games() {
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('bestseller');

  useEffect(() => {
    let ignore = false; // กันผลลัพธ์เก่ามาทับ ถ้าผู้ใช้ออกจากหน้าไปก่อน
    async function load() {
      setStatus('loading');
      try {
        const list = await getGames();
        if (!ignore) { setGames(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [reloadKey]);

  // ค้นหา กรอง และเรียงในเบราว์เซอร์ จึงไม่ต้องยิง API ซ้ำทุกครั้งที่พิมพ์
  const q = query.trim().toLowerCase();
  const genres = [...new Set(games.flatMap((g) => g.genres))].sort();
  const shown = games
    .filter((g) => q === '' || g.title.toLowerCase().includes(q))
    .filter((g) => genre === '' || g.genres.includes(genre))
    .filter((g) => minPrice === '' || g.price >= Number(minPrice))
    .filter((g) => maxPrice === '' || g.price <= Number(maxPrice))
    .sort(SORTERS[sort]);

  const chip = (active) =>
    'rounded px-3 py-1 text-sm transition ' + (active ? 'bg-sian-accent font-medium text-sian-deep' : 'bg-sian-raised text-sian-text hover:text-white');

  return (
    <div className="sian-page min-h-[60vh]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold text-white">ร้านค้า</h1>

        <div className="mt-4 grid gap-3 rounded bg-sian-panel p-4 md:grid-cols-4">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาชื่อเกม" aria-label="ค้นหาชื่อเกม" className={inputClass} />
          <input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="ราคาต่ำสุด" aria-label="ราคาต่ำสุด" className={inputClass} />
          <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="ราคาสูงสุด" aria-label="ราคาสูงสุด" className={inputClass} />
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="เรียงตาม" className={inputClass}>
            <option value="bestseller">ขายดี</option>
            <option value="newest">ใหม่ล่าสุด</option>
            <option value="priceAsc">ราคาต่ำไปสูง</option>
            <option value="priceDesc">ราคาสูงไปต่ำ</option>
          </select>
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2 md:col-span-4">
              <button onClick={() => setGenre('')} className={chip(genre === '')}>ทุกแนว</button>
              {genres.map((g) => (
                <button key={g} onClick={() => setGenre(g)} className={chip(genre === g)}>{g}</button>
              ))}
            </div>
          )}
        </div>

        {status === 'success' && <p className="mt-4 text-sm text-sian-muted">แสดง {shown.length} จาก {games.length} เกม</p>}
        <div className="mt-4">
          <GameGrid status={status} error={error} games={shown} onRetry={() => setReloadKey((k) => k + 1)} />
        </div>
      </div>
    </div>
  );
}

export default Games;
