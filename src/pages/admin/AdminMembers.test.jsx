import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../auth/AuthContext';
import AdminMembers from './AdminMembers';
import AdminReviews from './AdminReviews';
import { adminDeleteReview, getAdminMembers, getAdminReviews, setMemberRole } from '../../api/backend';

jest.mock('../../api/backend');

const MEMBERS = [
  { id: 1, email: 'admin@x.test', displayName: 'แอดมิน', role: 'admin', createdAt: '2026-01-01' },
  { id: 2, email: 'm@x.test', displayName: 'สมาชิก', role: 'member', createdAt: '2026-01-02' },
];

function renderPage(page) {
  return render(<AuthProvider><MemoryRouter>{page}</MemoryRouter></AuthProvider>);
}

beforeEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
  localStorage.setItem('siangame.token', 't');
  localStorage.setItem('siangame.member', JSON.stringify({ id: 1, displayName: 'แอดมิน', role: 'admin' }));
});

test('แถวของตัวเองกดเปลี่ยนสิทธิ์ไม่ได้', async () => {
  getAdminMembers.mockResolvedValue(MEMBERS);
  renderPage(<AdminMembers />);
  const row = (await screen.findByText('admin@x.test')).closest('tr');
  expect(within(row).getByRole('button')).toBeDisabled();
});

test('เปลี่ยนสิทธิ์คนอื่นต้องยืนยัน แล้วแถวอัปเดต', async () => {
  const user = userEvent.setup();
  getAdminMembers.mockResolvedValue(MEMBERS);
  setMemberRole.mockResolvedValue({ ...MEMBERS[1], role: 'admin' });
  renderPage(<AdminMembers />);
  await user.click(await screen.findByRole('button', { name: 'เลื่อนเป็น admin' }));
  expect(setMemberRole).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'ยืนยัน' }));
  expect(setMemberRole).toHaveBeenCalledWith(2, 'admin', 't');
  expect(await screen.findAllByRole('button', { name: 'ลดเป็น member' })).toHaveLength(2);
});

test('หน้าสมาชิกโหลดพังเห็น ErrorBox', async () => {
  getAdminMembers.mockRejectedValue(new Error('พัง'));
  renderPage(<AdminMembers />);
  expect(await screen.findByRole('alert')).toHaveTextContent('พัง');
});

test('ลบรีวิวต้องยืนยัน แล้วหายจากตาราง', async () => {
  const user = userEvent.setup();
  getAdminReviews.mockResolvedValue([{ id: 5, gameId: 1, gameTitle: 'Alpha', email: 'm@x.test', displayName: 'สมาชิก', rating: 4, text: 'รีวิวทดสอบ', createdAt: '2026-01-01' }]);
  adminDeleteReview.mockResolvedValue(null);
  renderPage(<AdminReviews />);
  await screen.findByText('รีวิวทดสอบ');
  await user.click(screen.getByRole('button', { name: 'ลบ' }));
  expect(adminDeleteReview).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'ลบรีวิว' }));
  expect(adminDeleteReview).toHaveBeenCalledWith(5, 't');
  expect(screen.queryByText('รีวิวทดสอบ')).not.toBeInTheDocument();
});
