import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Games from './Games';
import { getGames } from '../api/backend';

jest.mock('../api/backend');

const FAKE = [
  { id: 1, title: 'Alpha', genres: ['RPG'], price: 500, ratingAverage: 4, ratingCount: 2, salesCount: 1, cover: 'a.jpg', createdAt: '2026-01-01' },
  { id: 2, title: 'Bravo', genres: ['แอ็กชัน'], price: 100, ratingAverage: 0, ratingCount: 0, salesCount: 9, cover: 'b.jpg', createdAt: '2026-03-01' },
  { id: 3, title: 'Charlie', genres: ['RPG', 'แอ็กชัน'], price: 900, ratingAverage: 5, ratingCount: 1, salesCount: 4, cover: 'c.jpg', createdAt: '2026-02-01' },
];

function renderGames() {
  return render(<MemoryRouter><Games /></MemoryRouter>);
}

const titles = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

test('แสดงกำลังโหลดก่อน แล้วเห็นการ์ดครบ', async () => {
  getGames.mockResolvedValue(FAKE);
  renderGames();
  expect(screen.getByRole('status')).toHaveTextContent('กำลังโหลด');
  expect(await screen.findByText('Alpha')).toBeInTheDocument();
  expect(screen.getAllByRole('link')).toHaveLength(3);
});

test('ไม่มีเกมในร้านเห็นข้อความว่าง', async () => {
  getGames.mockResolvedValue([]);
  renderGames();
  expect(await screen.findByText('ไม่พบเกมที่ค้นหา')).toBeInTheDocument();
});

test('โหลดพังเห็นข้อความ และกดลองใหม่แล้วโหลดสำเร็จ', async () => {
  const user = userEvent.setup();
  getGames.mockRejectedValueOnce(new Error('เชื่อมต่อ server ไม่ได้'));
  getGames.mockResolvedValueOnce(FAKE);
  renderGames();
  expect(await screen.findByRole('alert')).toHaveTextContent('เชื่อมต่อ server ไม่ได้');
  await user.click(screen.getByRole('button', { name: 'ลองใหม่' }));
  expect(await screen.findByText('Alpha')).toBeInTheDocument();
  expect(getGames).toHaveBeenCalledTimes(2);
});

test('ค้นหาชื่อและกรองแนวโดยไม่เรียก API ซ้ำ', async () => {
  const user = userEvent.setup();
  getGames.mockReset();
  getGames.mockResolvedValue(FAKE);
  renderGames();
  await screen.findByText('Alpha');

  await user.type(screen.getByPlaceholderText('ค้นหาชื่อเกม'), 'br');
  expect(titles()).toEqual(['Bravo']);

  await user.clear(screen.getByPlaceholderText('ค้นหาชื่อเกม'));
  await user.click(screen.getByRole('button', { name: 'RPG' }));
  expect(titles().sort()).toEqual(['Alpha', 'Charlie']);
  expect(getGames).toHaveBeenCalledTimes(1);
});

test('กรองช่วงราคาได้', async () => {
  const user = userEvent.setup();
  getGames.mockResolvedValue(FAKE);
  renderGames();
  await screen.findByText('Alpha');
  await user.type(screen.getByLabelText('ราคาต่ำสุด'), '200');
  await user.type(screen.getByLabelText('ราคาสูงสุด'), '600');
  expect(titles()).toEqual(['Alpha']);
});

test('เรียงตามราคาและยอดขายถูกต้อง', async () => {
  const user = userEvent.setup();
  getGames.mockResolvedValue(FAKE);
  renderGames();
  await screen.findByText('Alpha');
  await waitFor(() => expect(titles()).toEqual(['Bravo', 'Charlie', 'Alpha'])); // ค่าเริ่มต้นคือขายดี
  await user.selectOptions(screen.getByLabelText('เรียงตาม'), 'priceAsc');
  expect(titles()).toEqual(['Bravo', 'Alpha', 'Charlie']);
  await user.selectOptions(screen.getByLabelText('เรียงตาม'), 'priceDesc');
  expect(titles()).toEqual(['Charlie', 'Alpha', 'Bravo']);
  await user.selectOptions(screen.getByLabelText('เรียงตาม'), 'newest');
  expect(titles()).toEqual(['Bravo', 'Charlie', 'Alpha']);
});
