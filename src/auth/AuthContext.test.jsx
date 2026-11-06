import { act, render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { apiFetch } from '../api/backend';

function Probe() {
  const { isLoggedIn, isAdmin, member, updateMember } = useAuth();
  return (
    <div>
      <p>{isLoggedIn ? 'เข้าแล้ว' : 'ยังไม่เข้า'}</p>
      <p>{isAdmin ? 'admin' : 'ไม่ใช่ admin'}</p>
      <p>{member?.displayName}</p>
      <button onClick={() => updateMember({ ...member, displayName: 'ชื่อใหม่' })}>แก้ชื่อ</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn();
});

test('รีเฟรชแล้วยังจำการเข้าสู่ระบบจาก localStorage', () => {
  localStorage.setItem('siangame.token', 't');
  localStorage.setItem('siangame.member', JSON.stringify({ id: 1, displayName: 'เอ', role: 'admin' }));
  render(<AuthProvider><Probe /></AuthProvider>);
  expect(screen.getByText('เข้าแล้ว')).toBeInTheDocument();
  expect(screen.getByText('admin')).toBeInTheDocument();
});

test('localStorage เสียต้องไม่ทำให้หน้าเว็บพัง', () => {
  localStorage.setItem('siangame.member', '{เสีย');
  render(<AuthProvider><Probe /></AuthProvider>);
  expect(screen.getByText('ยังไม่เข้า')).toBeInTheDocument();
});

test('token หมดอายุแล้วได้ 401 ต้องล้างการเข้าสู่ระบบ', async () => {
  localStorage.setItem('siangame.token', 'old');
  localStorage.setItem('siangame.member', JSON.stringify({ id: 1, displayName: 'เอ', role: 'member' }));
  render(<AuthProvider><Probe /></AuthProvider>);
  fetch.mockResolvedValue({ status: 401, ok: false, json: async () => ({ error: { code: 'BAD_TOKEN', message: 'หมดอายุ' } }) });

  await act(async () => {
    await apiFetch('/api/me', { token: 'old' }).catch(() => {});
  });

  expect(screen.getByText('ยังไม่เข้า')).toBeInTheDocument();
  expect(localStorage.getItem('siangame.token')).toBeNull();
});

test('updateMember เปลี่ยนชื่อทั้งบนหน้าจอและ localStorage', () => {
  localStorage.setItem('siangame.token', 't');
  localStorage.setItem('siangame.member', JSON.stringify({ id: 1, displayName: 'เอ', role: 'member' }));
  render(<AuthProvider><Probe /></AuthProvider>);
  act(() => screen.getByRole('button', { name: 'แก้ชื่อ' }).click());
  expect(screen.getByText('ชื่อใหม่')).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('siangame.member')).displayName).toBe('ชื่อใหม่');
});
