import { act, render, screen } from '@testing-library/react';
import { Loading } from './AdminStates';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('รอไม่นานแสดงแค่ข้อความกำลังโหลด', () => {
  render(<Loading />);
  act(() => jest.advanceTimersByTime(4000));
  expect(screen.getByRole('status')).toHaveTextContent('กำลังโหลด');
  expect(screen.queryByText(/กำลังเปิดระบบ/)).not.toBeInTheDocument();
});

test('รอเกิน 5 วินาทีบอกว่า server กำลังเปิดระบบ', () => {
  render(<Loading />);
  act(() => jest.advanceTimersByTime(5000));
  expect(screen.getByText('กำลังเปิดระบบ อาจใช้เวลาประมาณ 1 นาที')).toBeInTheDocument();
});

test('โหลดเสร็จก่อนต้องไม่มี timer ค้าง', () => {
  const { unmount } = render(<Loading />);
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});
