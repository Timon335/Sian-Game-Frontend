import { useEffect, useState } from 'react';

// ชิ้นส่วนเล็ก ๆ ที่หลายหน้าใช้ซ้ำ: สถานะการโหลด ปุ่ม ช่องกรอก และกล่องยืนยัน
export function ErrorBox({ error, onRetry }) {
  return (
    <div role="alert" className="rounded border border-red-500/40 bg-red-950/40 p-6 text-center">
      <p className="font-semibold text-red-300">โหลดข้อมูลไม่สำเร็จ</p>
      <p className="mt-1 text-sm text-red-200/80">{error?.message}</p>
      {onRetry && (
        <button onClick={onRetry} className={btnGhost + ' mt-4'}>ลองใหม่</button>
      )}
    </div>
  );
}

const SLOW_MS = 5000;

// Render แบบฟรีหลับเมื่อไม่มีคนใช้ ถ้ารอนานให้บอกผู้ใช้ จะได้ไม่คิดว่าเว็บเสีย
export function Loading({ text = 'กำลังโหลด...' }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div role="status" className="py-16 text-center text-sian-muted">
      <p>{text}</p>
      {slow && <p className="mt-2 text-sm">กำลังเปิดระบบ อาจใช้เวลาประมาณ 1 นาที</p>}
    </div>
  );
}

export function Empty({ text, children }) {
  return (
    <div className="rounded border border-dashed border-sian-line p-10 text-center">
      <p className="text-sian-muted">{text}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export const btnPrimary =
  'inline-block rounded bg-sian-buy px-5 py-2 text-sm font-semibold text-white transition hover:bg-sian-buyhover disabled:cursor-not-allowed disabled:bg-sian-raised disabled:text-sian-muted';
export const btnGhost =
  'inline-block rounded border border-sian-line bg-sian-raised px-4 py-2 text-sm text-sian-text transition hover:border-sian-accent hover:text-white disabled:cursor-not-allowed disabled:text-sian-muted';
export const btnDanger =
  'inline-block rounded border border-red-500/50 bg-red-950/40 px-4 py-2 text-sm text-red-200 transition hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-50';
export const inputClass =
  'w-full rounded border border-sian-line bg-sian-deep px-3 py-2 text-sian-text placeholder:text-sian-muted/60 focus:border-sian-accent focus:outline-none';

// กล่องยืนยันก่อนทำสิ่งที่กระทบข้อมูล เช่น เลิกขาย ลบรีวิว เปลี่ยนสิทธิ์
export function ConfirmBox({ open, title, children, confirmText = 'ยืนยัน', busy, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded border border-sian-line bg-sian-panel p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="mt-2 text-sm text-sian-muted">{children}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} disabled={busy} className={btnGhost}>ยกเลิก</button>
          <button onClick={onConfirm} disabled={busy} className={btnDanger}>
            {busy ? 'กำลังทำ...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
