import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import Profile from './Profile';
import { changePassword, updateMe } from '../api/backend';

jest.mock('../api/backend');

function NavName() {
  const { member } = useAuth();
  return <p data-testid="nav-name">{member?.displayName}</p>;
}

function renderProfile() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <NavName />
        <Profile />
      </MemoryRouter>
    </AuthProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
  localStorage.setItem('siangame.token', 't');
  localStorage.setItem('siangame.member', JSON.stringify({ id: 1, email: 'a@x.test', displayName: 'เอ', role: 'member' }));
});

test('แสดงอีเมล และแก้ชื่อแล้วชื่อบน Navbar เปลี่ยน', async () => {
  const user = userEvent.setup();
  updateMe.mockResolvedValue({ id: 1, email: 'a@x.test', displayName: 'ชื่อใหม่', role: 'member' });
  renderProfile();
  expect(screen.getByText('a@x.test')).toBeInTheDocument();
  const name = screen.getByLabelText('ชื่อที่แสดง');
  await user.clear(name);
  await user.type(name, 'ชื่อใหม่');
  await user.click(screen.getByRole('button', { name: 'บันทึกชื่อ' }));
  expect(await screen.findByText('บันทึกชื่อแล้ว')).toBeInTheDocument();
  expect(updateMe).toHaveBeenCalledWith('ชื่อใหม่', 't');
  expect(screen.getByTestId('nav-name')).toHaveTextContent('ชื่อใหม่');
});

test('ชื่อว่างไม่ยิง API', async () => {
  const user = userEvent.setup();
  renderProfile();
  await user.clear(screen.getByLabelText('ชื่อที่แสดง'));
  await user.click(screen.getByRole('button', { name: 'บันทึกชื่อ' }));
  expect(updateMe).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent('ต้องมีชื่อที่แสดง');
});

async function fillPassword(user, current, next, confirm) {
  await user.type(screen.getByLabelText('รหัสผ่านเดิม'), current);
  await user.type(screen.getByLabelText('รหัสผ่านใหม่'), next);
  await user.type(screen.getByLabelText('ยืนยันรหัสผ่านใหม่'), confirm);
  await user.click(screen.getByRole('button', { name: 'เปลี่ยนรหัสผ่าน' }));
}

test('รหัสใหม่กับยืนยันไม่ตรงไม่ยิง API', async () => {
  const user = userEvent.setup();
  renderProfile();
  await fillPassword(user, 'password1', 'password2', 'password3');
  expect(changePassword).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent('ไม่ตรงกัน');
});

test('เปลี่ยนรหัสสำเร็จแล้วล้างช่องกรอก', async () => {
  const user = userEvent.setup();
  changePassword.mockResolvedValue(null);
  renderProfile();
  await fillPassword(user, 'password1', 'password2', 'password2');
  expect(changePassword).toHaveBeenCalledWith('password1', 'password2', 't');
  expect(await screen.findByText('เปลี่ยนรหัสผ่านแล้ว')).toBeInTheDocument();
  expect(screen.getByLabelText('รหัสผ่านเดิม')).toHaveValue('');
});

test('รหัสเดิมผิดเห็นข้อความจาก server', async () => {
  const user = userEvent.setup();
  changePassword.mockRejectedValue(new Error('รหัสผ่านเดิมไม่ถูกต้อง'));
  renderProfile();
  await fillPassword(user, 'wrongpass', 'password2', 'password2');
  expect(await screen.findByRole('alert')).toHaveTextContent('รหัสผ่านเดิมไม่ถูกต้อง');
});
