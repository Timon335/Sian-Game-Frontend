import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import Login from './Login';
import Register from './Register';
import { login, register } from '../api/backend';

jest.mock('../api/backend');

function renderAt(entry) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/" element={<h1>หน้าแรก</h1>} />
          <Route path="/games/1" element={<h1>หน้าเกม</h1>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
});

test('รหัสผิดเห็นข้อความจาก server และยังอยู่หน้าเดิม', async () => {
  const user = userEvent.setup();
  login.mockRejectedValue(new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง'));
  renderAt('/login');
  await user.type(screen.getByLabelText('อีเมล'), 'a@x.test');
  await user.type(screen.getByLabelText('รหัสผ่าน'), 'wrong');
  await user.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  expect(localStorage.getItem('siangame.token')).toBeNull();
});

test('สำเร็จแล้วกลับหน้าเดิมที่ตั้งใจไป', async () => {
  const user = userEvent.setup();
  login.mockResolvedValue({ token: 't', member: { id: 1, displayName: 'เอ', role: 'member' } });
  renderAt({ pathname: '/login', state: { from: '/games/1' } });
  await user.type(screen.getByLabelText('อีเมล'), 'a@x.test');
  await user.type(screen.getByLabelText('รหัสผ่าน'), 'password1');
  await user.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));
  expect(await screen.findByRole('heading', { name: 'หน้าเกม' })).toBeInTheDocument();
  expect(localStorage.getItem('siangame.token')).toBe('t');
});

test('ปุ่มบัญชีทดลองกรอกเฉพาะบัญชีสมาชิก ไม่มีข้อมูล Admin', async () => {
  const user = userEvent.setup();
  renderAt('/login');
  await user.click(screen.getByRole('button', { name: 'กรอกบัญชีทดลอง' }));
  expect(screen.getByLabelText('อีเมล')).toHaveValue('demo@siangame.test');
  expect(screen.getByLabelText('รหัสผ่าน')).toHaveValue('demo1234');
  expect(document.body.textContent).not.toMatch(/admin@/i);
  expect(login).not.toHaveBeenCalled();
});

test('สมัครสมาชิกแล้วเข้าสู่ระบบให้ทันที', async () => {
  const user = userEvent.setup();
  register.mockResolvedValue({ id: 2 });
  login.mockResolvedValue({ token: 't2', member: { id: 2, displayName: 'บี', role: 'member' } });
  renderAt('/register');
  await user.type(screen.getByLabelText('ชื่อที่แสดง'), 'บี');
  await user.type(screen.getByLabelText('อีเมล'), 'b@x.test');
  await user.type(screen.getByLabelText('รหัสผ่าน'), 'password1');
  await user.type(screen.getByLabelText('ยืนยันรหัสผ่าน'), 'password1');
  await user.click(screen.getByRole('button', { name: 'สมัครสมาชิก' }));
  expect(await screen.findByRole('heading', { name: 'หน้าแรก' })).toBeInTheDocument();
  expect(register).toHaveBeenCalledWith('b@x.test', 'password1', 'บี');
});

test('สมัครสมาชิก รหัสยืนยันไม่ตรงไม่ยิง API', async () => {
  const user = userEvent.setup();
  renderAt('/register');
  await user.type(screen.getByLabelText('ชื่อที่แสดง'), 'บี');
  await user.type(screen.getByLabelText('อีเมล'), 'b@x.test');
  await user.type(screen.getByLabelText('รหัสผ่าน'), 'password1');
  await user.type(screen.getByLabelText('ยืนยันรหัสผ่าน'), 'password2');
  await user.click(screen.getByRole('button', { name: 'สมัครสมาชิก' }));
  expect(screen.getByRole('alert')).toHaveTextContent('ไม่ตรงกัน');
  expect(register).not.toHaveBeenCalled();
});
