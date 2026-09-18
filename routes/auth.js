import express from 'express';
import process from 'node:process';

const router = express.Router();

// POST /api/auth/login - ตรวจสอบรหัสผ่าน Admin
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // กำหนด Username / Password สำหรับทดสอบ (หรือเก็บใน .env)
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || '123456';

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.status(200).json({
      status: 'success',
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token: 'admin-secret-token-12345'
    });
  } else {
    res.status(401).json({
      status: 'error',
      success: false,
      message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
    });
  }
});

export default router;