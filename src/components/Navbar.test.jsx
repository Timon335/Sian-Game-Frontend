import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { CartProvider, useCart } from '../cart/CartContext';
import Navbar from './Navbar';
import { getCart } from '../api/backend';

jest.mock('../api/backend');

function RefreshButton() {
  const { refreshCart } = useCart();
  return <button onClick={refreshCart}>รีเฟรช</button>;
}

function renderNavbar() {
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter>
          <Navbar />
          <RefreshButton />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );
}

function login() {
  localStorage.setItem('siangame.token', 't');
  localStorage.setItem('siangame.member', JSON.stringify({ id: 1, displayName: 'เอ', role: 'member' }));
}

beforeEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
});

test('Guest ไม่ยิงโหลดตะกร้า', () => {
  renderNavbar();
  expect(getCart).not.toHaveBeenCalled();
  expect(screen.queryByTestId('cart-count')).not.toBeInTheDocument();
});

test('สมาชิกเห็นจำนวนเกมในตะกร้า', async () => {
  login();
  getCart.mockResolvedValue([{ id: 1 }, { id: 2 }]);
  renderNavbar();
  expect(await screen.findByTestId('cart-count')).toHaveTextContent('2');
  expect(getCart).toHaveBeenCalledWith('t');
});

test('ตะกร้าว่างไม่แสดงตัวเลข', async () => {
  login();
  getCart.mockResolvedValue([]);
  renderNavbar();
  await waitFor(() => expect(getCart).toHaveBeenCalled());
  expect(screen.queryByTestId('cart-count')).not.toBeInTheDocument();
});

test('refreshCart อัปเดตตัวเลข', async () => {
  const user = userEvent.setup();
  login();
  getCart.mockResolvedValueOnce([{ id: 1 }]).mockResolvedValueOnce([{ id: 1 }, { id: 2 }, { id: 3 }]);
  renderNavbar();
  await screen.findByTestId('cart-count');
  await user.click(screen.getByRole('button', { name: 'รีเฟรช' }));
  await waitFor(() => expect(screen.getByTestId('cart-count')).toHaveTextContent('3'));
});

test('โหลดตะกร้าพังหน้าเว็บยังทำงานได้', async () => {
  login();
  getCart.mockRejectedValue(new Error('พัง'));
  renderNavbar();
  await waitFor(() => expect(getCart).toHaveBeenCalled());
  expect(screen.getByRole('link', { name: 'ตะกร้า' })).toBeInTheDocument();
});
