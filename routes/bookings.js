const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// 1. ดึงรายการจองทั้งหมด (GET /api/bookings)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, services(service_name, price)')
      .order('id', { ascending: false });

    if (error) throw error;

    res.json({ status: 'success', data });
  } catch (err) {
    console.error('Fetch Bookings Error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2. สร้างรายการจองใหม่ (POST /api/bookings)
router.post('/', async (req, res) => {
  try {
    const { service_id, slot_id, status } = req.body;

    if (!service_id || !slot_id) {
      return res.status(400).json({
        status: 'error',
        message: 'กรุณากรอก service_id และ slot_id ให้ครบถ้วน'
      });
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        service_id,
        slot_id,
        status: status || 'pending'
      }])
      .select();

    if (error) throw error;

    res.status(201).json({
      status: 'success',
      message: 'บันทึกการจองเรียบร้อยแล้ว',
      data: data[0]
    });
  } catch (err) {
    console.error('Create Booking Error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 3. อัปเดตสถานะการจอง (PATCH /api/bookings/:id/status)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ status: 'error', message: 'กรุณาระบุ status ที่ต้องการเปลี่ยน' });
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json({
      status: 'success',
      message: `อัปเดตสถานะการจอง ID #${id} เป็น ${status} แล้ว`,
      data: data[0]
    });
  } catch (err) {
    console.error('Update Status Error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;