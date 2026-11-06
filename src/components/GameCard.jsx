import { Link } from 'react-router-dom';
import { baht } from '../utils/format';

export function Stars({ value }) {
  return <span className="text-sian-star" aria-label={`${value} จาก 5 ดาว`}>★ {Number(value).toFixed(1)}</span>;
}

function GameCard({ game }) {
  return (
    <Link to={`/games/${game.id}`} className="group block overflow-hidden rounded bg-sian-panel transition hover:-translate-y-0.5 hover:bg-sian-raised">
      <img src={game.cover} alt="" loading="lazy" className="aspect-[460/215] w-full object-cover" />
      <div className="p-3">
        <h3 className="truncate font-medium text-white group-hover:text-sian-accent">{game.title}</h3>
        <p className="mt-0.5 truncate text-xs text-sian-muted">{game.genres.join(', ')}</p>
        <div className="mt-2 flex items-center justify-between text-sm">
          {game.ratingCount > 0 ? <Stars value={game.ratingAverage} /> : <span className="text-xs text-sian-muted">ยังไม่มีรีวิว</span>}
          <span className="font-semibold text-sian-price">{baht(game.price)}</span>
        </div>
      </div>
    </Link>
  );
}

export default GameCard;
