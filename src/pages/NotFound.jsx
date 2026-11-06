import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-6xl font-bold text-sian-accent">404</p>
      <h1 className="mt-4 text-xl font-semibold text-white">ไม่พบหน้านี้</h1>
      <Link to="/" className="mt-6 inline-block text-sian-accent hover:underline">กลับหน้าแรก</Link>
    </div>
  );
}

export default NotFound;
