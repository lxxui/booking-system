import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import dotenv from 'dotenv';

// นำเข้า Routes Modules
import bookingRoutes from './routes/bookings.js';
import serviceRoutes from './routes/services.js';
import slotsRoute from './routes/slots.js';
import authRoutes from './routes/auth.js';
import reviewsRouter from './routes/reviews.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// ⚡ เปลี่ยน Default Port เป็น 5000 เพื่อเลี่ยง Port 3000
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// ⚡ 1. API Routers
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/slots', slotsRoute);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewsRouter);

// 📁 2. Static Files (ย้ายมาไว้ตรงนี้เพื่อให้โหลดไฟล์ .css / .js ในโฟลเดอร์ public ได้ถูกต้อง)
app.use(express.static(path.join(__dirname, 'public')));

// 🌐 3. Clean Page Routes ( HTML Pages )
app.get(['/', '/index'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/bookings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bookings.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'services.html'));
});

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'ไม่พบ Endpoint ที่เรียกใช้งาน' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});