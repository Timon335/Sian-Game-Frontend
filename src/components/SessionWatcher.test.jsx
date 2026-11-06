import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import SessionWatcher from './SessionWatcher';
import Login from '../pages/Login';
import { apiFetch } from '../api/backend';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('siangame.token', 'old');
  localStorage.setItem('siangame.member', JSON.stringify({ id: 1, displayName: 'เอ', role: 'member' }));
  global.fetch = jest.fn().mockResolvedValue({ status: 401, ok: false, json: async () => ({ error: { code: 'BAD_TOKEN', message: 'หมดอายุ' } }) });
});

test('token หมดอายุบนหน้าสาธารณะต้องพาไปเข้าสู่ระบบพร้อมแจ้งเหตุผล', async () => {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/games/1']}>
        <SessionWatcher />
        <Routes>
          <Route path="/games/1" element={<h1>หน้าเกม</h1>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByRole('heading', { name: 'หน้าเกม' })).toBeInTheDocument();

  await act(async () => {
    await apiFetch('/api/me/cart/1', { method: 'PUT', token: 'old' }).catch(() => {});
  });

  expect(screen.getByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument();
  expect(screen.getByText('การเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่')).toBeInTheDocument();
});
