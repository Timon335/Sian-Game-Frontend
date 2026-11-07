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

test('ไม่มีปุ่มกรอกบัญชีทดลองแล้ว', () => {
  renderAt('/login');
  expect(screen.queryByRole('button', { name: 'กรอกบัญชีทดลอง' })).not.toBeInTheDocument();
});

test('คลิกช่องอีเมลแล้วเติมบัญชีสมาชิกทดลองทั้งสองช่อง โดยยังไม่เข้าสู่ระบบ', async () => {
  const user = userEvent.setup();
  renderAt('/login');
  expect(screen.getByLabelText('อีเมล')).toHaveValue('');
  await user.click(screen.getByLabelText('อีเมล'));
  expect(screen.getByLabelText('อีเมล')).toHaveValue('demo@siangame.test');
  expect(screen.getByLabelText('รหัสผ่าน')).toHaveValue('demo1234');
  expect(login).not.toHaveBeenCalled();
});

test('คลิกช่องรหัสผ่านก็เติมให้เหมือนกัน และไม่ใช่บัญชี Admin', async () => {
  const user = userEvent.setup();
  renderAt('/login');
  await user.click(screen.getByLabelText('รหัสผ่าน'));
  expect(screen.getByLabelText('อีเมล')).toHaveValue('demo@siangame.test');
  expect(screen.getByLabelText('อีเมล')).not.toHaveValue('admin@siangame.test');
});

test('พิมพ์บัญชีตัวเองได้ ค่าที่แก้ไว้ไม่ถูกเติมทับตอนคลิกอีกช่อง', async () => {
  const user = userEvent.setup();
  renderAt('/login');
  const email = screen.getByLabelText('อีเมล');
  const password = screen.getByLabelText('รหัสผ่าน');
  await user.click(email);
  await user.clear(email);
  await user.type(email, 'me@x.test');
  await user.click(password);
  await user.clear(password);
  await user.click(email);
  expect(email).toHaveValue('me@x.test');
  expect(password).toHaveValue('');
});

test('ลบทั้งสองช่องแล้วคลิกใหม่ต้องไม่เติมซ้ำ จึงพิมพ์บัญชีตัวเองได้', async () => {
  const user = userEvent.setup();
  renderAt('/login');
  const email = screen.getByLabelText('อีเมล');
  const password = screen.getByLabelText('รหัสผ่าน');
  await user.click(email);
  await user.clear(email);
  await user.clear(password);
  await user.click(email);
  await user.type(email, 'me@x.test');
  await user.type(password, 'mypassword');
  expect(email).toHaveValue('me@x.test');
  expect(password).toHaveValue('mypassword');
});

test('กดปุ่มเข้าสู่ระบบตอนช่องว่างต้องไม่เติมบัญชีทดลอง', async () => {
  const user = userEvent.setup();
  renderAt('/login');
  await user.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));
  expect(screen.getByLabelText('อีเมล')).toHaveValue('');
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
