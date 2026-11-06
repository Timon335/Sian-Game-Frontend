import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FeaturedCarousel from '../components/FeaturedCarousel';
import GameGrid from '../components/GameGrid';
import { ErrorBox, Loading } from '../components/admin/AdminStates';
import { getGames } from '../api/backend';

function Home() {
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
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

  if (status === 'loading') return <Loading />;
  if (status === 'error') {
    return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorBox error={error} onRetry={() => setReloadKey((k) => k + 1)} /></div>;
  }

  const byRating = [...games].sort((a, b) => b.ratingAverage - a.ratingAverage || b.salesCount - a.salesCount).slice(0, 5);
  const bestsellers = [...games].sort((a, b) => b.salesCount - a.salesCount).slice(0, 4);
  const newest = [...games].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

  return (
    <div className="sian-page">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        {byRating.length > 0 && <FeaturedCarousel games={byRating} />}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">เกมขายดี</h2>
            <Link to="/games" className="text-sm text-sian-accent hover:underline">ดูทั้งหมด</Link>
          </div>
          <GameGrid status="success" games={bestsellers} emptyText="ยังไม่มีเกมในร้าน" />
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">เกมใหม่</h2>
          <GameGrid status="success" games={newest} emptyText="ยังไม่มีเกมในร้าน" />
        </section>
      </div>
    </div>
  );
}

export default Home;
