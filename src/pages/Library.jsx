import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import GameGrid from '../components/GameGrid';
import { btnPrimary } from '../components/admin/AdminStates';
import { getLibrary } from '../api/backend';

function Library() {
  const { token } = useAuth();
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const list = await getLibrary(token);
        if (!ignore) { setGames(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [token, reloadKey]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white">คลังเกมของฉัน</h1>
      <div className="mt-4">
        <GameGrid status={status} error={error} games={games} onRetry={() => setReloadKey((k) => k + 1)}
          emptyText="ยังไม่มีเกมในคลัง" emptyAction={<Link to="/games" className={btnPrimary}>ไปที่ร้านค้า</Link>} />
      </div>
    </div>
  );
}

export default Library;
