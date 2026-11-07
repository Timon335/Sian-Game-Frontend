import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';

const linkClass = ({ isActive }) =>
  'text-sm font-medium uppercase tracking-wide transition ' + (isActive ? 'text-white' : 'text-sian-muted hover:text-white');

function Navbar() {
  const { isLoggedIn, isAdmin, member, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="bg-sian-deep">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link to="/" className="text-xl font-bold tracking-tight text-white">
          SIAN <span className="text-sian-accent">GAME</span>
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <NavLink to="/" end className={linkClass}>หน้าแรก</NavLink>
          <NavLink to="/games" className={linkClass}>ร้านค้า</NavLink>
          {isLoggedIn && <NavLink to="/me/library" className={linkClass}>คลังเกม</NavLink>}
          {isLoggedIn && <NavLink to="/me/wishlist" className={linkClass}>อยากได้</NavLink>}
          {isLoggedIn && <NavLink to="/me/orders" className={linkClass}>คำสั่งซื้อ</NavLink>}
          {isAdmin && <NavLink to="/admin" className={linkClass}>หลังบ้าน</NavLink>}
        </div>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {isLoggedIn ? (
            <>
              <Link to="/me/cart" className="rounded bg-sian-buy px-3 py-1.5 font-semibold text-white hover:bg-sian-buyhover">
                ตะกร้า
                {count > 0 && <span data-testid="cart-count" className="ml-1.5 rounded bg-white/25 px-1.5">{count}</span>}
              </Link>
              <Link to="/me/profile" className="text-sian-text hover:text-white">{member?.displayName}</Link>
              <button onClick={handleLogout} className="text-sian-muted hover:text-white">ออกจากระบบ</button>
            </>
          ) : (
            <Link to="/login" className="rounded bg-sian-raised px-3 py-1.5 text-sian-text hover:text-white">เข้าสู่ระบบ</Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
