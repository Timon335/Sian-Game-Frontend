import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import RequireRole from './RequireRole';

function renderAt(path) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<h1>หน้าเข้าสู่ระบบ</h1>} />
          <Route path="/me/cart" element={<ProtectedRoute><h1>ตะกร้า</h1></ProtectedRoute>} />
          <Route path="/admin" element={<RequireRole role="admin"><h1>หลังบ้าน</h1></RequireRole>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

function loginAs(role) {
  localStorage.setItem('siangame.token', 't');
  localStorage.setItem('siangame.member', JSON.stringify({ id: 1, displayName: 'เอ', role }));
}

beforeEach(() => localStorage.clear());

test('Guest เข้าหน้าสมาชิกถูกพาไปหน้าเข้าสู่ระบบ', () => {
  renderAt('/me/cart');
  expect(screen.getByRole('heading', { name: 'หน้าเข้าสู่ระบบ' })).toBeInTheDocument();
  expect(screen.queryByText('ตะกร้า')).not.toBeInTheDocument();
});

test('สมาชิกเข้าหน้าสมาชิกได้', () => {
  loginAs('member');
  renderAt('/me/cart');
  expect(screen.getByRole('heading', { name: 'ตะกร้า' })).toBeInTheDocument();
});

test('Guest เข้าหลังบ้านถูกพาไปหน้าเข้าสู่ระบบ', () => {
  renderAt('/admin');
  expect(screen.getByRole('heading', { name: 'หน้าเข้าสู่ระบบ' })).toBeInTheDocument();
});

test('สมาชิกธรรมดาเข้าหลังบ้านเห็นหน้า 403', () => {
  loginAs('member');
  renderAt('/admin');
  expect(screen.getByText('403')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'หลังบ้าน' })).not.toBeInTheDocument();
});

test('Admin เข้าหลังบ้านได้', () => {
  loginAs('admin');
  renderAt('/admin');
  expect(screen.getByRole('heading', { name: 'หลังบ้าน' })).toBeInTheDocument();
});
