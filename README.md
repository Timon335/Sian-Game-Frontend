# Sian Game Frontend

หน้าเว็บของร้านเกม Sian Game เขียนด้วย React (Create React App), React Router, Fetch API และ Tailwind CSS deploy บน Vercel และเรียก API จาก [Sian-Game-Backend](https://github.com/Timon335/Sian-Game-Backend)

- เว็บ: https://sian-game-frontend.vercel.app
- API: https://sian-game-api.onrender.com

Render แบบฟรีจะหลับเมื่อไม่มีคนใช้ คำขอแรกอาจรอประมาณ 1 นาที

## โครงสร้าง

| โฟลเดอร์ | หน้าที่ |
|---|---|
| `src/api/backend.js` | ชั้นกลางคุยกับ Go ทุกหน้าเรียกผ่านไฟล์นี้ |
| `src/auth/` | สถานะการเข้าสู่ระบบด้วย Context |
| `src/components/` | การ์ดเกม, รีวิว, Navbar และ ProtectedRoute |
| `src/pages/` | หน้าร้านและหน้าสมาชิก |
| `src/pages/admin/` | หลังบ้าน |

## รันในเครื่อง

ต้องรัน Backend ก่อน

```bash
cp .env.example .env
npm install
npm start
```

## เทสต์

```bash
npm test -- --watchAll=false
```
