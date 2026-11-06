import GameCard from './GameCard';
import { Empty, ErrorBox, Loading } from './admin/AdminStates';

// วาดตามสถานะการโหลด: กำลังโหลด, พัง, ว่าง หรือสำเร็จ
function GameGrid({ status, error, games, onRetry, emptyText = 'ไม่พบเกมที่ค้นหา', emptyAction }) {
  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorBox error={error} onRetry={onRetry} />;
  if (games.length === 0) return <Empty text={emptyText}>{emptyAction}</Empty>;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {games.map((game) => <GameCard key={game.id} game={game} />)}
    </div>
  );
}

export default GameGrid;
