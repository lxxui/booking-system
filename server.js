/* eslint-env node */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// นำเข้า Routes Modules
const bookingRoutes = require('./routes/bookings');
const serviceRoutes = require('./routes/services');
const slotsRoute = require('./routes/slots');
const authRoutes = require('./routes/auth');
const reviewsRouter = require('./routes/reviews');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// ⚡ 1. API Routers
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/slots', slotsRoute);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewsRouter);

// 🌐 2. Clean Page Routes ( HTML Pages )
app.get(['/', '/index'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

//app.get('/admin-dashboard', (req, res) => {
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



// 📁 3. Static Files Middleware
app.use(express.static('public'));

// Global Error Handler
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'ไม่พบ Endpoint ที่เรียกใช้งาน' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});