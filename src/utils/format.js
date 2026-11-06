// แสดงราคาเป็นเงินบาท เช่น ฿1,590
export function baht(value) {
  return `฿${Number(value).toLocaleString('th-TH', { maximumFractionDigits: 2 })}`;
}

// แสดงวันที่แบบไทย ถ้าไม่มีค่าแสดงขีด
export function dateTH(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}
