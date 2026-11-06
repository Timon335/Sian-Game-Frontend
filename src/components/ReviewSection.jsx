import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ConfirmBox, Empty, ErrorBox, Loading, btnGhost } from './admin/AdminStates';
import ReviewForm from './ReviewForm';
import { deleteReview, getReviews, postReview, updateReview } from '../api/backend';
import { dateTH } from '../utils/format';

function Rating({ value }) {
  return <span className="text-sian-star" aria-label={`${value} ดาว`}>{'★'.repeat(value)}<span className="text-sian-line">{'★'.repeat(5 - value)}</span></span>;
}

// รีวิวของเกม ไม่ต้องซื้อก่อนก็รีวิวได้ แต่ต้องเข้าสู่ระบบ
function ReviewSection({ gameId, onChanged }) {
  const { token, member, isLoggedIn } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const list = await getReviews(gameId);
        if (!ignore) { setReviews(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [gameId, reloadKey]);

  const mine = reviews.find((r) => r.memberId === member?.id);

  async function handleCreate(review) {
    const saved = await postReview(gameId, review, token);
    setReviews((list) => [saved, ...list]);
    onChanged?.();
  }

  async function handleUpdate(review) {
    const saved = await updateReview(mine.id, review, token);
    setReviews((list) => list.map((r) => (r.id === saved.id ? saved : r)));
    setEditing(false);
    onChanged?.();
  }

  async function handleDelete() {
    setBusy(true);
    setActionError(null);
    try {
      await deleteReview(mine.id, token);
      setReviews((list) => list.filter((r) => r.id !== mine.id));
      setRemoving(false);
      onChanged?.();
    } catch (err) {
      setActionError(err.message);
      setRemoving(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-white">รีวิวจากผู้เล่น</h2>

      <div className="mt-3">
        {!isLoggedIn ? (
          <div className="rounded bg-sian-panel p-4 text-sm">
            <Link to="/login" state={{ from: `/games/${gameId}` }} className="text-sian-accent hover:underline">เข้าสู่ระบบ</Link> เพื่อเขียนรีวิว
          </div>
        ) : status === 'success' && !mine ? (
          <ReviewForm onSubmit={handleCreate} submitText="ส่งรีวิว" />
        ) : mine && editing ? (
          <ReviewForm initial={mine} onSubmit={handleUpdate} onCancel={() => setEditing(false)} submitText="บันทึกการแก้ไข" />
        ) : null}
      </div>
      {actionError && <p role="alert" className="mt-2 text-sm text-red-300">{actionError}</p>}

      <div className="mt-4 space-y-3">
        {status === 'loading' && <Loading text="กำลังโหลดรีวิว..." />}
        {status === 'error' && <ErrorBox error={error} onRetry={() => setReloadKey((k) => k + 1)} />}
        {status === 'success' && reviews.length === 0 && <Empty text="ยังไม่มีรีวิว เป็นคนแรกที่รีวิวเกมนี้ได้เลย" />}
        {status === 'success' && reviews.map((r) => (
          <article key={r.id} className="rounded bg-sian-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-white">{r.displayName}{r.memberId === member?.id && <span className="ml-2 text-xs text-sian-muted">(รีวิวของคุณ)</span>}</p>
              <p className="text-xs text-sian-muted">{dateTH(r.createdAt)}</p>
            </div>
            <Rating value={r.rating} />
            <p className="mt-2 whitespace-pre-line break-words text-sm">{r.text}</p>
            {r.memberId === member?.id && !editing && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditing(true)} className={btnGhost}>แก้ไข</button>
                <button onClick={() => setRemoving(true)} className={btnGhost}>ลบ</button>
              </div>
            )}
          </article>
        ))}
      </div>

      <ConfirmBox open={removing} busy={busy} title="ลบรีวิวนี้?" confirmText="ลบรีวิว" onConfirm={handleDelete} onCancel={() => setRemoving(false)}>
        <p>เมื่อลบแล้วจะกู้คืนไม่ได้ แต่คุณเขียนรีวิวใหม่ได้</p>
      </ConfirmBox>
    </section>
  );
}

export default ReviewSection;
