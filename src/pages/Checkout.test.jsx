import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import Checkout from './Checkout';
import { getCart, placeOrder } from '../api/backend';

jest.mock('../api/backend');

const CART = [{ id: 1, title: 'Alpha', price: 500, cover: 'a.jpg', isActive: true, genres: [] }];

function renderCheckout() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/me/checkout']}>
        <Routes>
          <Route path="/me/checkout" element={<Checkout />} />
          <Route path="/me/library" element={<h1>คลังเกมของฉัน</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
  localStorage.setItem('siangame.token', 't');
  localStorage.setItem('siangame.member', JSON.stringify({ id: 1, displayName: 'เอ', role: 'member' }));
  getCart.mockResolvedValue(CART);
});

const cardNumber = () => screen.getByLabelText('หมายเลขบัตร');
const fields = () => [cardNumber(), screen.getByLabelText('ชื่อบนบัตร'), screen.getByLabelText('วันหมดอายุ'), screen.getByLabelText('CVV')];
const payButton = () => screen.getByRole('button', { name: /ชำระเงิน/ });

test('คลิกช่องใดก็ได้แล้วทุกช่องที่ว่างเติมค่าทดสอบ', async () => {
  const user = userEvent.setup();
  renderCheckout();
  await screen.findByText('Alpha');
  await user.click(screen.getByLabelText('CVV'));
  expect(cardNumber()).toHaveValue('4242 4242 4242 4242');
  fields().forEach((f) => expect(f).not.toHaveValue(''));
});

test('กดปุ่มจ่ายตอนช่องว่างต้องไม่เติมค่าทดสอบเอง', async () => {
  const user = userEvent.setup();
  renderCheckout();
  await screen.findByText('Alpha');
  await user.click(payButton());
  expect(cardNumber()).toHaveValue('');
  expect(screen.getByRole('alert')).toHaveTextContent('หมายเลขบัตร');
  expect(placeOrder).not.toHaveBeenCalled();
});

test('ค่าที่พิมพ์ไว้แล้วไม่ถูกทับ และพิมพ์แก้เองได้', async () => {
  const user = userEvent.setup();
  renderCheckout();
  await screen.findByText('Alpha');
  await user.click(screen.getByLabelText('ชื่อบนบัตร'));
  await user.clear(screen.getByLabelText('ชื่อบนบัตร'));
  await user.type(screen.getByLabelText('ชื่อบนบัตร'), 'MY NAME');
  await user.click(cardNumber());
  expect(screen.getByLabelText('ชื่อบนบัตร')).toHaveValue('MY NAME');
});

test('เลขบัตรรูปแบบผิดกดจ่ายไม่ได้', async () => {
  const user = userEvent.setup();
  renderCheckout();
  await screen.findByText('Alpha');
  await user.click(cardNumber());
  await user.clear(cardNumber());
  await user.type(cardNumber(), '1234');
  await user.click(payButton());
  expect(screen.getByRole('alert')).toHaveTextContent('หมายเลขบัตร');
  expect(placeOrder).not.toHaveBeenCalled();
});

test('จ่ายสำเร็จเรียก API ด้วย token อย่างเดียว ไม่มีข้อมูลบัตร แล้วไปหน้าคลัง', async () => {
  const user = userEvent.setup();
  placeOrder.mockResolvedValue({ id: 1 });
  renderCheckout();
  await screen.findByText('Alpha');
  await user.click(cardNumber());
  await user.click(payButton());
  expect(await screen.findByRole('heading', { name: 'คลังเกมของฉัน' })).toBeInTheDocument();
  expect(placeOrder).toHaveBeenCalledTimes(1);
  expect(placeOrder.mock.calls[0]).toEqual(['t']);
});

test('ข้อมูลบัตรไม่ถูกเก็บลง localStorage', async () => {
  const user = userEvent.setup();
  placeOrder.mockResolvedValue({ id: 1 });
  renderCheckout();
  await screen.findByText('Alpha');
  await user.click(cardNumber());
  await user.click(payButton());
  await screen.findByRole('heading', { name: 'คลังเกมของฉัน' });
  expect(JSON.stringify({ ...localStorage })).not.toMatch(/4242/);
});

test('กดซ้ำระหว่างส่งเรียก API ครั้งเดียว และปุ่มถูกปิด', async () => {
  const user = userEvent.setup();
  let finish;
  placeOrder.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  renderCheckout();
  await screen.findByText('Alpha');
  await user.click(cardNumber());
  await user.click(payButton());
  expect(screen.getByRole('button', { name: /กำลังชำระเงิน/ })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: /กำลังชำระเงิน/ }));
  expect(placeOrder).toHaveBeenCalledTimes(1);
  finish({ id: 1 });
  await screen.findByRole('heading', { name: 'คลังเกมของฉัน' });
});

test('409 เกมเลิกขาย แสดงชื่อเกมและลิงก์กลับตะกร้า', async () => {
  const user = userEvent.setup();
  placeOrder.mockRejectedValue(Object.assign(new Error('เกมเลิกจำหน่ายแล้ว: Alpha'), { status: 409, code: 'GAME_INACTIVE' }));
  renderCheckout();
  await screen.findByText('Alpha');
  await user.click(cardNumber());
  await user.click(payButton());
  expect(await screen.findByRole('alert')).toHaveTextContent('เกมเลิกจำหน่ายแล้ว: Alpha');
  expect(screen.getByRole('link', { name: 'กลับไปตะกร้า' })).toBeInTheDocument();
});

test('ตะกร้าว่างจ่ายไม่ได้', async () => {
  getCart.mockResolvedValue([]);
  renderCheckout();
  expect(await screen.findByText('ยังไม่มีเกมในตะกร้า')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('button', { name: /ชำระเงิน/ })).not.toBeInTheDocument());
});
