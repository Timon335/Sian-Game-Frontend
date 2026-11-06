// ชั้นกลางคุยกับ Go ทุกหน้าเรียกผ่านไฟล์นี้ ไม่เรียก fetch เอง
const BASE = process.env.REACT_APP_API_URL || '';

let onUnauthorized = null;

// AuthProvider ลงทะเบียนไว้ เมื่อ token หมดอายุจะได้ออกจากระบบให้อัตโนมัติ
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

function apiError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw apiError(0, 'NETWORK', 'เชื่อมต่อ server ไม่ได้ กรุณาลองใหม่อีกครั้ง');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token && onUnauthorized) onUnauthorized();
    throw apiError(
      res.status,
      data?.error?.code ?? 'UNKNOWN',
      data?.error?.message ?? `ระบบขัดข้อง (รหัส ${res.status}) กรุณาลองใหม่อีกครั้ง`
    );
  }
  return data;
}

const items = (promise) => promise.then((data) => data.items);

// ---------- สมาชิก ----------
export const register = (email, password, displayName) =>
  apiFetch('/api/auth/register', { method: 'POST', body: { email, password, displayName } });
export const login = (email, password) => apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
export const updateMe = (displayName, token) => apiFetch('/api/me', { method: 'PUT', body: { displayName }, token });
export const changePassword = (currentPassword, newPassword, token) =>
  apiFetch('/api/me/password', { method: 'PUT', body: { currentPassword, newPassword }, token });

// ---------- หน้าร้าน ----------
export const getGenres = () => items(apiFetch('/api/genres'));
export const getGames = () => items(apiFetch('/api/games'));
export const getGame = (id) => apiFetch(`/api/games/${id}`);
export const getReviews = (gameId) => items(apiFetch(`/api/games/${gameId}/reviews`));

// ---------- รีวิว ----------
export const postReview = (gameId, review, token) =>
  apiFetch(`/api/games/${gameId}/reviews`, { method: 'POST', body: review, token });
export const updateReview = (id, review, token) => apiFetch(`/api/reviews/${id}`, { method: 'PUT', body: review, token });
export const deleteReview = (id, token) => apiFetch(`/api/reviews/${id}`, { method: 'DELETE', token });

// ---------- ตะกร้า คำสั่งซื้อ คลัง และรายการอยากได้ ----------
export const getCart = (token) => items(apiFetch('/api/me/cart', { token }));
export const addToCart = (gameId, token) => apiFetch(`/api/me/cart/${gameId}`, { method: 'PUT', token });
export const removeFromCart = (gameId, token) => apiFetch(`/api/me/cart/${gameId}`, { method: 'DELETE', token });
export const getWishlist = (token) => items(apiFetch('/api/me/wishlist', { token }));
export const addToWishlist = (gameId, token) => apiFetch(`/api/me/wishlist/${gameId}`, { method: 'PUT', token });
export const removeFromWishlist = (gameId, token) => apiFetch(`/api/me/wishlist/${gameId}`, { method: 'DELETE', token });
export const getLibrary = (token) => items(apiFetch('/api/me/library', { token }));
export const getOrders = (token) => items(apiFetch('/api/me/orders', { token }));
// ไม่ส่ง body: ข้อมูลบัตรอยู่แค่ในฟอร์ม และราคาให้ server อ่านจากฐานข้อมูล
export const placeOrder = (token) => apiFetch('/api/me/orders', { method: 'POST', token });

// ---------- หลังบ้าน ถ้าเป็นสมาชิกธรรมดา Go ตอบ 403 ----------
export const getAdminStats = (token) => apiFetch('/api/admin/stats', { token });
export const getAdminGames = (token) => items(apiFetch('/api/admin/games', { token }));
export const getAdminGame = (id, token) => apiFetch(`/api/admin/games/${id}`, { token });
export const createGame = (game, token) => apiFetch('/api/admin/games', { method: 'POST', body: game, token });
export const updateGame = (id, game, token) => apiFetch(`/api/admin/games/${id}`, { method: 'PUT', body: game, token });
export const stopSellingGame = (id, token) => apiFetch(`/api/admin/games/${id}`, { method: 'DELETE', token });
export const getAdminMembers = (token) => items(apiFetch('/api/admin/members', { token }));
export const setMemberRole = (id, role, token) =>
  apiFetch(`/api/admin/members/${id}/role`, { method: 'PUT', body: { role }, token });
export const getAdminOrders = (token) => items(apiFetch('/api/admin/orders', { token }));
export const getAdminReviews = (token) => items(apiFetch('/api/admin/reviews', { token }));
export const adminDeleteReview = (id, token) => apiFetch(`/api/admin/reviews/${id}`, { method: 'DELETE', token });
