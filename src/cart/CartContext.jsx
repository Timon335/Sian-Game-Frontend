import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getCart } from '../api/backend';

// จำนวนเกมในตะกร้าที่ Navbar แสดง ค่าเริ่มต้นทำให้หน้าที่ไม่มี Provider ยังเรียก useCart ได้
const CartContext = createContext({ count: 0, refreshCart: () => {} });

export function CartProvider({ children }) {
  const { token } = useAuth();
  const [count, setCount] = useState(0);

  const refreshCart = useCallback(async () => {
    if (!token) { setCount(0); return; }
    try {
      const items = await getCart(token);
      setCount(items.length);
    } catch {
      // ตัวเลขเป็นข้อมูลเสริม โหลดไม่ได้ก็ยังใช้เว็บต่อได้
    }
  }, [token]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return <CartContext.Provider value={{ count, refreshCart }}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
