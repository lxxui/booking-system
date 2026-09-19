import express from 'express';
import process from 'node:process';

const router = express.Router();

// POST /api/auth/login - ตรวจสอบรหัสผ่าน Admin
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // ดึงค่าจาก Environment Variables (กำหนดค่าสำรองไว้ใช้)
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || '123456';

  if (!username || !password) {
    return res.status(400).json({
      status: 'error',
      success: false,
      message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
    });
  }

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.status(200).json({
      status: 'success',
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token: 'admin-secret-token-12345',
      user: { username: ADMIN_USER, role: 'admin' }
    });
  }

  return res.status(401).json({
    status: 'error',
    success: false,
    message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
  });
});

// GET /api/auth/me - ตรวจสอบสถานะ Token ฝั่ง Client
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token === 'admin-secret-token-12345') {
    return res.status(200).json({
      status: 'success',
      success: true,
      user: { username: process.env.ADMIN_USER || 'admin', role: 'admin' }
    });
  }

  return res.status(401).json({
    status: 'error',
    success: false,
    message: 'Unauthorized: ไม่พบสิทธิ์การเข้าถึง'
  });
});

export default router;