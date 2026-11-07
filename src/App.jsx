import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { CartProvider } from './cart/CartContext';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RequireRole from './components/RequireRole';
import SessionWatcher from './components/SessionWatcher';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import GameDetail from './pages/GameDetail';
import Games from './pages/Games';
import Home from './pages/Home';
import Library from './pages/Library';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Wishlist from './pages/Wishlist';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGameForm from './pages/admin/AdminGameForm';
import AdminGames from './pages/admin/AdminGames';
import AdminLayout from './pages/admin/AdminLayout';
import AdminMembers from './pages/admin/AdminMembers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReviews from './pages/admin/AdminReviews';

const member = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

function App() {
  return (
    // AuthProvider ครอบทั้งแอป ทุกหน้าข้างในจึงเรียก useAuth() ได้
    <AuthProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <SessionWatcher />
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/games" element={<Games />} />
              <Route path="/games/:id" element={<GameDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/me/cart" element={member(<Cart />)} />
              <Route path="/me/checkout" element={member(<Checkout />)} />
              <Route path="/me/orders" element={member(<Orders />)} />
              <Route path="/me/library" element={member(<Library />)} />
              <Route path="/me/wishlist" element={member(<Wishlist />)} />
              <Route path="/me/profile" element={member(<Profile />)} />
              {/* หลังบ้าน: ครอบทั้งกิ่งด้วย RequireRole ครั้งเดียว หน้าลูกทุกหน้าได้รับการป้องกัน */}
              <Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
                <Route index element={<AdminDashboard />} />
                <Route path="games" element={<AdminGames />} />
                <Route path="games/new" element={<AdminGameForm />} />
                <Route path="games/:id" element={<AdminGameForm />} />
                <Route path="members" element={<AdminMembers />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="reviews" element={<AdminReviews />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
