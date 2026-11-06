import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import GameDetail from './pages/GameDetail';
import Games from './pages/Games';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/:id" element={<GameDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
