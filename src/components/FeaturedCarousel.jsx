import { useState } from 'react';
import { Link } from 'react-router-dom';
import { baht } from '../utils/format';

// แถบเกมแนะนำเลื่อนซ้ายขวาบนหน้าแรก
function FeaturedCarousel({ games }) {
  const [index, setIndex] = useState(0);
  const count = games.length;
  const game = games[index % count];
  const image = game.screenshots[0] ?? game.cover;

  return (
    <section aria-label="เกมแนะนำ" className="relative">
      <Link to={`/games/${game.id}`} className="grid overflow-hidden rounded bg-sian-panel shadow-lg transition hover:shadow-sian-accent/20 md:grid-cols-3">
        <img src={image} alt="" className="aspect-video h-full w-full object-cover md:col-span-2" />
        <div className="flex flex-col p-5">
          <p className="text-xs uppercase tracking-widest text-sian-accent">เกมแนะนำ</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{game.title}</h2>
          <p className="mt-2 line-clamp-4 text-sm text-sian-muted">{game.description}</p>
          <p className="mt-auto pt-4 text-lg font-semibold text-sian-price">{baht(game.price)}</p>
        </div>
      </Link>
      <div className="mt-3 flex items-center justify-center gap-3">
        <button aria-label="เกมก่อนหน้า" onClick={() => setIndex((index - 1 + count) % count)} className="rounded bg-sian-raised px-3 py-1 hover:text-white">‹</button>
        <span className="text-sm text-sian-muted">{(index % count) + 1} / {count}</span>
        <button aria-label="เกมถัดไป" onClick={() => setIndex((index + 1) % count)} className="rounded bg-sian-raised px-3 py-1 hover:text-white">›</button>
      </div>
    </section>
  );
}

export default FeaturedCarousel;
