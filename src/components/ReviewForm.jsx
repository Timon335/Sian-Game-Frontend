import { useState } from 'react';
import { btnGhost, btnPrimary, inputClass } from './admin/AdminStates';

// ฟอร์มรีวิว ใช้ทั้งเขียนใหม่และแก้ไข ตรวจชั้นแรกที่นี่ และ Go ตรวจซ้ำเสมอ
function ReviewForm({ initial, onSubmit, onCancel, submitText }) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [text, setText] = useState(initial?.text ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) { setError('กรุณาเลือกคะแนน'); return; }
    if (!text.trim()) { setError('กรุณาเขียนรีวิว'); return; }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ rating, text: text.trim() });
      if (!initial) { setRating(0); setText(''); }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded bg-sian-panel p-4">
      <fieldset>
        <legend className="text-sm text-sian-muted">ให้คะแนน</legend>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} ดาว`} aria-pressed={rating === n}
              className={'text-2xl leading-none transition ' + (n <= rating ? 'text-sian-star' : 'text-sian-line hover:text-sian-star')}>★</button>
          ))}
        </div>
      </fieldset>
      <label className="mt-3 block text-sm text-sian-muted" htmlFor="review-text">รีวิวของคุณ</label>
      <textarea id="review-text" rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} className={inputClass + ' mt-1'} />
      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'กำลังส่ง...' : submitText}</button>
        {onCancel && <button type="button" onClick={onCancel} disabled={busy} className={btnGhost}>ยกเลิก</button>}
      </div>
    </form>
  );
}

export default ReviewForm;
