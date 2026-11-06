import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import Cart from './Cart';
import { getCart, removeFromCart } from '../api/backend';

jest.mock('../api/backend');

const CART = [
  { id: 1, title: 'Alpha', price: 500, cover: 'a.jpg', isActive: true, genres: [] },
  { id: 2, title: 'Bravo', price: 250, cover: 'b.jpg', isActive: true, genres: [] },
];

function renderCart() {
  return render(
    <AuthProvider>
      <MemoryRouter><Cart /></MemoryRouter>
    </AuthProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
  localStorage.setItem('siangame.token', 't');
  localStorage.setItem('siangame.member', JSON.stringify({ id: 1, displayName: 'เอ', role: 'member' }));
});

test('ยอดรวมถูก และลบแล้วยอดเปลี่ยน', async () => {
  const user = userEvent.setup();
  getCart.mockResolvedValue(CART);
  removeFromCart.mockResolvedValue(null);
  renderCart();
  await screen.findByText('Alpha');
  expect(screen.getByTestId('cart-total')).toHaveTextContent('฿750');
  await user.click(screen.getByRole('button', { name: 'เอา Alpha ออก' }));
  expect(removeFromCart).toHaveBeenCalledWith(1, 't');
  expect(await screen.findByTestId('cart-total')).toHaveTextContent('฿250');
  expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
});

test('ตะกร้าว่างเห็นปุ่มไปร้านค้า', async () => {
  getCart.mockResolvedValue([]);
  renderCart();
  expect(await screen.findByText('ยังไม่มีเกมในตะกร้า')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'ไปที่ร้านค้า' })).toBeInTheDocument();
});

test('โหลดพังเห็นข้อผิดพลาดและลองใหม่ได้', async () => {
  getCart.mockRejectedValue(new Error('เชื่อมต่อ server ไม่ได้'));
  renderCart();
  expect(await screen.findByRole('alert')).toHaveTextContent('เชื่อมต่อ server ไม่ได้');
  expect(screen.getByRole('button', { name: 'ลองใหม่' })).toBeInTheDocument();
});

test('เกมเลิกขายในตะกร้าถูกแจ้ง และปิดการชำระเงิน', async () => {
  getCart.mockResolvedValue([{ ...CART[0], isActive: false }]);
  renderCart();
  expect(await screen.findByText('เลิกจำหน่ายแล้ว')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'ไปชำระเงิน' })).not.toBeInTheDocument();
});
