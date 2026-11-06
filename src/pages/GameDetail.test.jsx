import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import GameDetail from './GameDetail';
import { addToCart, getCart, getGame, getLibrary, getReviews, getWishlist } from '../api/backend';

jest.mock('../api/backend');

const GAME = {
  id: 1, title: 'Alpha', description: 'คำอธิบาย', developer: 'ทีม', releaseDate: '2026-01-15', price: 500,
  cover: 'a.jpg', genres: ['RPG'], screenshots: ['s1.jpg', 's2.jpg'], ratingAverage: 4.5, ratingCount: 2, salesCount: 1, isActive: true,
};

function renderDetail() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/games/1']}>
        <Routes>
          <Route path="/games/:id" element={<GameDetail />} />
          <Route path="/login" element={<h1>หน้าเข้าสู่ระบบ</h1>} />
          <Route path="/me/cart" element={<h1>หน้าตะกร้า</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

function loginAsMember() {
  localStorage.setItem('siangame.token', 't');
  localStorage.setItem('siangame.member', JSON.stringify({ id: 1, displayName: 'เอ', role: 'member' }));
}

beforeEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
  getGame.mockResolvedValue(GAME);
  getReviews.mockResolvedValue([]);
  getLibrary.mockResolvedValue([]);
  getCart.mockResolvedValue([]);
  getWishlist.mockResolvedValue([]);
});

test('แสดงรายละเอียดเกม', async () => {
  renderDetail();
  expect(await screen.findByRole('heading', { name: 'Alpha' })).toBeInTheDocument();
  expect(screen.getByText('คำอธิบาย')).toBeInTheDocument();
  expect(screen.getAllByText('฿500').length).toBeGreaterThan(0);
});

test('Guest กดซื้อแล้วไปหน้าเข้าสู่ระบบ', async () => {
  const user = userEvent.setup();
  renderDetail();
  await user.click(await screen.findByRole('button', { name: 'ใส่ตะกร้า' }));
  expect(await screen.findByRole('heading', { name: 'หน้าเข้าสู่ระบบ' })).toBeInTheDocument();
  expect(addToCart).not.toHaveBeenCalled();
});

test('สมาชิกกดซื้อแล้วเกมเข้าตะกร้าและไปหน้าตะกร้า', async () => {
  const user = userEvent.setup();
  loginAsMember();
  addToCart.mockResolvedValue(null);
  renderDetail();
  await user.click(await screen.findByRole('button', { name: 'ใส่ตะกร้า' }));
  expect(addToCart).toHaveBeenCalledWith(1, 't');
  expect(await screen.findByRole('heading', { name: 'หน้าตะกร้า' })).toBeInTheDocument();
});

test('เกมเลิกขายไม่มีปุ่มซื้อ และแจ้งสถานะ', async () => {
  getGame.mockResolvedValue({ ...GAME, isActive: false });
  renderDetail();
  expect(await screen.findByText('เลิกจำหน่ายแล้ว')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'ใส่ตะกร้า' })).not.toBeInTheDocument();
});

test('เกมที่มีในคลังแล้วแสดงว่ามีแล้วแทนปุ่มซื้อ', async () => {
  loginAsMember();
  getLibrary.mockResolvedValue([{ id: 1 }]);
  renderDetail();
  expect(await screen.findByText('มีในคลังแล้ว')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'ใส่ตะกร้า' })).not.toBeInTheDocument();
});

test('ไม่พบเกมเห็นข้อความ', async () => {
  getGame.mockRejectedValue(Object.assign(new Error('ไม่พบเกมนี้'), { status: 404 }));
  renderDetail();
  expect(await screen.findByRole('alert')).toHaveTextContent('ไม่พบเกมนี้');
});
