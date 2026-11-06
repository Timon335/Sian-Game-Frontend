import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../auth/AuthContext';
import AdminGames from './AdminGames';
import AdminGameForm from './AdminGameForm';
import { createGame, getAdminGames, getGenres, stopSellingGame } from '../../api/backend';

jest.mock('../../api/backend');

const GAMES = [
  { id: 1, title: 'Alpha', developer: 'ทีม', price: 500, cover: 'a.jpg', genres: ['RPG'], salesCount: 2, isActive: true },
  { id: 2, title: 'Bravo', developer: 'ทีม', price: 100, cover: 'b.jpg', genres: ['RPG'], salesCount: 0, isActive: false },
];

function renderAt(path) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/games" element={<AdminGames />} />
          <Route path="/admin/games/new" element={<AdminGameForm />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
  localStorage.setItem('siangame.token', 't');
  localStorage.setItem('siangame.member', JSON.stringify({ id: 1, displayName: 'แอดมิน', role: 'admin' }));
  getAdminGames.mockResolvedValue(GAMES);
  getGenres.mockResolvedValue([{ id: 1, name: 'RPG' }]);
});

test('เลิกขายต้องผ่านกล่องยืนยันก่อน', async () => {
  const user = userEvent.setup();
  stopSellingGame.mockResolvedValue(null);
  renderAt('/admin/games');
  await screen.findByText('Alpha');
  await user.click(screen.getByRole('button', { name: 'เลิกขาย Alpha' }));
  expect(stopSellingGame).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'ยืนยันเลิกขาย' }));
  expect(stopSellingGame).toHaveBeenCalledWith(1, 't');
  expect(await screen.findAllByText('เลิกขายแล้ว')).toHaveLength(2);
});

test('เกมที่เลิกขายแล้วมีป้ายบอกสถานะ', async () => {
  renderAt('/admin/games');
  await screen.findByText('Bravo');
  expect(screen.getByText('เลิกขายแล้ว')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'เลิกขาย Bravo' })).not.toBeInTheDocument();
});

test('หน้าโหลดพังเห็น ErrorBox', async () => {
  getAdminGames.mockRejectedValue(new Error('ไม่มีสิทธิ์'));
  renderAt('/admin/games');
  expect(await screen.findByRole('alert')).toHaveTextContent('ไม่มีสิทธิ์');
});

test('ฟอร์มราคา 0 ไม่ยิง API', async () => {
  const user = userEvent.setup();
  renderAt('/admin/games/new');
  await screen.findByRole('checkbox', { name: 'RPG' });
  await user.type(screen.getByLabelText('ชื่อเกม'), 'ใหม่');
  await user.type(screen.getByLabelText('คำอธิบาย'), 'ดี');
  await user.type(screen.getByLabelText('ผู้พัฒนา'), 'ทีม');
  await user.type(screen.getByLabelText('ลิงก์รูปหลัก'), 'https://x.test/c.jpg');
  await user.click(screen.getByRole('checkbox', { name: 'RPG' }));
  await user.type(screen.getByLabelText('ราคา (บาท)'), '0');
  await user.click(screen.getByRole('button', { name: 'บันทึก' }));
  expect(screen.getByText('ราคาต้องมากกว่า 0')).toBeInTheDocument();
  expect(createGame).not.toHaveBeenCalled();
});

test('ฟอร์มถูกต้องส่งข้อมูลที่แปลงแล้วไป API', async () => {
  const user = userEvent.setup();
  createGame.mockResolvedValue({ id: 3 });
  renderAt('/admin/games/new');
  await screen.findByRole('checkbox', { name: 'RPG' });
  await user.type(screen.getByLabelText('ชื่อเกม'), 'ใหม่');
  await user.type(screen.getByLabelText('คำอธิบาย'), 'ดี');
  await user.type(screen.getByLabelText('ผู้พัฒนา'), 'ทีม');
  await user.type(screen.getByLabelText('ลิงก์รูปหลัก'), 'https://x.test/c.jpg');
  await user.click(screen.getByRole('checkbox', { name: 'RPG' }));
  await user.type(screen.getByLabelText('ราคา (บาท)'), '290');
  await user.type(screen.getByLabelText('ลิงก์ภาพตัวอย่าง (บรรทัดละ 1 ลิงก์)'), 'https://x.test/1.jpg\n\nhttps://x.test/2.jpg');
  await user.click(screen.getByRole('button', { name: 'บันทึก' }));
  expect(createGame).toHaveBeenCalledWith({
    title: 'ใหม่', description: 'ดี', developer: 'ทีม', releaseDate: null, price: 290,
    cover: 'https://x.test/c.jpg', genreIds: [1], screenshots: ['https://x.test/1.jpg', 'https://x.test/2.jpg'],
  }, 't');
});
