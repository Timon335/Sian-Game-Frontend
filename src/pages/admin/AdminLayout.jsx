import { NavLink, Outlet } from 'react-router-dom';

const tabClass = ({ isActive }) =>
  'rounded px-4 py-1.5 text-sm transition ' + (isActive ? 'bg-sian-accent font-medium text-sian-deep' : 'text-sian-text hover:bg-sian-raised');

function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-sian-line pb-4">
        <h1 className="mr-2 text-xl font-bold text-white">หลังบ้าน Sian Game</h1>
        <nav className="flex flex-wrap gap-1">
          <NavLink to="/admin" end className={tabClass}>ภาพรวม</NavLink>
          <NavLink to="/admin/games" className={tabClass}>เกม</NavLink>
          <NavLink to="/admin/members" className={tabClass}>สมาชิก</NavLink>
          <NavLink to="/admin/orders" className={tabClass}>คำสั่งซื้อ</NavLink>
          <NavLink to="/admin/reviews" className={tabClass}>รีวิว</NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}

export default AdminLayout;
