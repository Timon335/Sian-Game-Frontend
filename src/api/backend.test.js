import { apiFetch, placeOrder, setUnauthorizedHandler } from './backend';

function mockResponse(status, body) {
  return Promise.resolve({
    status,
    ok: status >= 200 && status < 300,
    json: () => (body === undefined ? Promise.reject(new Error('no json')) : Promise.resolve(body)),
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
  setUnauthorizedHandler(null);
});

test('ส่ง method, body และ Authorization ถูกต้อง', async () => {
  fetch.mockReturnValue(mockResponse(200, { ok: true }));
  const data = await apiFetch('/api/x', { method: 'POST', body: { a: 1 }, token: 'tok' });
  const [, init] = fetch.mock.calls[0];
  expect(data).toEqual({ ok: true });
  expect(init.method).toBe('POST');
  expect(init.body).toBe(JSON.stringify({ a: 1 }));
  expect(init.headers.Authorization).toBe('Bearer tok');
});

test('ไม่มี token ต้องไม่แนบ Authorization', async () => {
  fetch.mockReturnValue(mockResponse(200, {}));
  await apiFetch('/api/x');
  expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
});

test('204 คืน null', async () => {
  fetch.mockReturnValue(mockResponse(204));
  await expect(apiFetch('/api/x', { method: 'DELETE' })).resolves.toBeNull();
});

test('อ่านรหัสและข้อความไทยจาก error ของ server', async () => {
  fetch.mockReturnValue(mockResponse(409, { error: { code: 'ALREADY_OWNED', message: 'คุณมีเกมนี้ในคลังแล้ว' } }));
  await expect(apiFetch('/api/x')).rejects.toMatchObject({
    status: 409,
    code: 'ALREADY_OWNED',
    message: 'คุณมีเกมนี้ในคลังแล้ว',
  });
});

test('server ตอบไม่ใช่ JSON ยังได้ข้อความที่อ่านรู้เรื่อง', async () => {
  fetch.mockReturnValue(mockResponse(502));
  await expect(apiFetch('/api/x')).rejects.toMatchObject({ status: 502, message: expect.stringContaining('ระบบขัดข้อง') });
});

test('เน็ตหลุดได้ข้อความแจ้งให้ลองใหม่', async () => {
  fetch.mockReturnValue(Promise.reject(new TypeError('Failed to fetch')));
  await expect(apiFetch('/api/x')).rejects.toMatchObject({ status: 0, message: expect.stringContaining('เชื่อมต่อ') });
});

test('server ไม่ตอบจนหมดเวลาต้องยกเลิกและแจ้งให้ลองใหม่', async () => {
  jest.useFakeTimers();
  try {
    fetch.mockImplementation((_, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const pending = apiFetch('/api/games');
    jest.advanceTimersByTime(90000);
    await expect(pending).rejects.toMatchObject({ status: 0, code: 'TIMEOUT', message: expect.stringContaining('นานเกินไป') });
  } finally {
    jest.useRealTimers();
  }
});

test('ตอบ 200 แต่ไม่ใช่ JSON ต้องเป็น error ไม่ใช่ null', async () => {
  fetch.mockReturnValue(mockResponse(200));
  await expect(apiFetch('/api/games')).rejects.toMatchObject({ code: 'BAD_RESPONSE' });
});

test('401 บนคำขอที่มี token เรียกตัวจัดการให้ออกจากระบบ', async () => {
  const onUnauthorized = jest.fn();
  setUnauthorizedHandler(onUnauthorized);
  fetch.mockReturnValue(mockResponse(401, { error: { code: 'BAD_TOKEN', message: 'หมดอายุ' } }));
  await expect(apiFetch('/api/me', { token: 'old' })).rejects.toMatchObject({ status: 401 });
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
});

test('401 ตอนกรอกรหัสผิดโดยไม่มี token ต้องไม่เรียกตัวจัดการ', async () => {
  const onUnauthorized = jest.fn();
  setUnauthorizedHandler(onUnauthorized);
  fetch.mockReturnValue(mockResponse(401, { error: { code: 'BAD_CREDENTIALS', message: 'ผิด' } }));
  await expect(apiFetch('/api/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 401 });
  expect(onUnauthorized).not.toHaveBeenCalled();
});

test('placeOrder ไม่ส่ง body ใด ๆ ไป server', async () => {
  fetch.mockReturnValue(mockResponse(201, { id: 1 }));
  await placeOrder('tok');
  const [path, init] = fetch.mock.calls[0];
  expect(path).toMatch(/\/api\/me\/orders$/);
  expect(init.method).toBe('POST');
  expect(init.body).toBeUndefined();
});
