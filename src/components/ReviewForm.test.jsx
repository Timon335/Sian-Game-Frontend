import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import ReviewForm from './ReviewForm';
import ReviewSection from './ReviewSection';
import { deleteReview, getReviews, postReview } from '../api/backend';

jest.mock('../api/backend');

const textbox = () => screen.getByLabelText('รีวิวของคุณ');

describe('ReviewForm', () => {
  test('ไม่เลือกดาวส่งไม่ได้', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<ReviewForm onSubmit={onSubmit} submitText="ส่งรีวิว" />);
    await user.type(textbox(), 'สนุก');
    await user.click(screen.getByRole('button', { name: 'ส่งรีวิว' }));
    expect(screen.getByRole('alert')).toHaveTextContent('กรุณาเลือกคะแนน');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('ข้อความมีแต่ช่องว่างส่งไม่ได้', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<ReviewForm onSubmit={onSubmit} submitText="ส่งรีวิว" />);
    await user.click(screen.getByRole('button', { name: '5 ดาว' }));
    await user.type(textbox(), '   ');
    await user.click(screen.getByRole('button', { name: 'ส่งรีวิว' }));
    expect(screen.getByRole('alert')).toHaveTextContent('กรุณาเขียนรีวิว');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('ส่งสำเร็จได้คะแนนกับข้อความที่ตัดช่องว่างแล้ว', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue();
    render(<ReviewForm onSubmit={onSubmit} submitText="ส่งรีวิว" />);
    await user.click(screen.getByRole('button', { name: '4 ดาว' }));
    await user.type(textbox(), ' สนุก ');
    await user.click(screen.getByRole('button', { name: 'ส่งรีวิว' }));
    expect(onSubmit).toHaveBeenCalledWith({ rating: 4, text: 'สนุก' });
  });

  test('server ตอบ 409 แสดงข้อความจาก server', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockRejectedValue(new Error('คุณรีวิวเกมนี้แล้ว'));
    render(<ReviewForm onSubmit={onSubmit} submitText="ส่งรีวิว" />);
    await user.click(screen.getByRole('button', { name: '4 ดาว' }));
    await user.type(textbox(), 'สนุก');
    await user.click(screen.getByRole('button', { name: 'ส่งรีวิว' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('คุณรีวิวเกมนี้แล้ว');
  });
});

describe('ReviewSection', () => {
  const REVIEWS = [
    { id: 1, memberId: 1, displayName: 'ฉันเอง', gameId: 9, rating: 5, text: 'ของฉัน', createdAt: '2026-01-01' },
    { id: 2, memberId: 2, displayName: 'คนอื่น', gameId: 9, rating: 3, text: 'ของคนอื่น', createdAt: '2026-01-02' },
  ];

  function renderSection() {
    return render(
      <AuthProvider>
        <MemoryRouter><ReviewSection gameId={9} /></MemoryRouter>
      </AuthProvider>
    );
  }

  function loginAs(id) {
    localStorage.setItem('siangame.token', 't');
    localStorage.setItem('siangame.member', JSON.stringify({ id, displayName: 'ฉันเอง', role: 'member' }));
  }

  beforeEach(() => {
    localStorage.clear();
    jest.resetAllMocks();
  });

  test('Guest เห็นลิงก์เข้าสู่ระบบแทนฟอร์ม', async () => {
    getReviews.mockResolvedValue(REVIEWS);
    renderSection();
    await screen.findByText('ของฉัน');
    expect(screen.getByRole('link', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument();
    expect(screen.queryByLabelText('รีวิวของคุณ')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'แก้ไข' })).not.toBeInTheDocument();
  });

  test('รีวิวของตัวเองมีปุ่มแก้และลบ ของคนอื่นไม่มี และไม่แสดงฟอร์มซ้ำ', async () => {
    loginAs(1);
    getReviews.mockResolvedValue(REVIEWS);
    renderSection();
    await screen.findByText('ของฉัน');
    expect(screen.getAllByRole('button', { name: 'แก้ไข' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'ลบ' })).toHaveLength(1);
    expect(screen.queryByLabelText('รีวิวของคุณ')).not.toBeInTheDocument();
  });

  test('ยังไม่เคยรีวิว ส่งแล้วรีวิวขึ้นในรายการ', async () => {
    const user = userEvent.setup();
    loginAs(5);
    getReviews.mockResolvedValue([]);
    postReview.mockResolvedValue({ id: 7, memberId: 5, displayName: 'ฉันเอง', gameId: 9, rating: 4, text: 'ใหม่', createdAt: '2026-01-03' });
    renderSection();
    await screen.findByText(/ยังไม่มีรีวิว/);
    await user.click(screen.getByRole('button', { name: '4 ดาว' }));
    await user.type(screen.getByLabelText('รีวิวของคุณ'), 'ใหม่');
    await user.click(screen.getByRole('button', { name: 'ส่งรีวิว' }));
    expect(await screen.findByText('ใหม่')).toBeInTheDocument();
    expect(postReview).toHaveBeenCalledWith(9, { rating: 4, text: 'ใหม่' }, 't');
  });

  test('ลบต้องยืนยันก่อน', async () => {
    const user = userEvent.setup();
    loginAs(1);
    getReviews.mockResolvedValue(REVIEWS);
    deleteReview.mockResolvedValue(null);
    renderSection();
    await screen.findByText('ของฉัน');
    await user.click(screen.getByRole('button', { name: 'ลบ' }));
    expect(deleteReview).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'ลบรีวิว' }));
    expect(deleteReview).toHaveBeenCalledWith(1, 't');
    expect(screen.queryByText('ของฉัน')).not.toBeInTheDocument();
  });
});
