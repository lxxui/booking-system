/* eslint-env node */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// นำเข้า Routes Modules
const bookingRoutes = require('./routes/bookings');
const serviceRoutes = require('./routes/services');
const app = express();
const PORT = process.env.PORT || 3000;
const slotsRoute = require('./routes/slots');
const authRoutes = require('./routes/auth');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// เรียกใช้งาน Routers โดยกำหนด Prefix API
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/slots', slotsRoute);
app.use('/api/auth', authRoutes);

// Global Error Handler สำหรับกรณี Route ไม่พบ
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'ไม่พบ Endpoint ที่เรียกใช้งาน' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});