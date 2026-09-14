/* eslint-env node */
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// 1. GET /api/slots - ดึงรายการช่วงเวลาทั้งหมด
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. POST /api/slots - สร้างช่วงเวลาจองใหม่
router.post('/', async (req, res) => {
  const { start_time, end_time, capacity } = req.body;
  try {
    const { data, error } = await supabase
      .from('slots')
      .insert([{ start_time, end_time, capacity }])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, message: 'สร้าง Slot เรียบร้อยแล้ว', data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 3. PUT /api/slots/:id - แก้ไขข้อมูลช่วงเวลาจอง
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { start_time, end_time, capacity, status } = req.body;
  try {
    const { data, error } = await supabase
      .from('slots')
      .update({ start_time, end_time, capacity, status })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.status(200).json({ success: true, message: 'อัปเดต Slot เรียบร้อยแล้ว', data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 4. DELETE /api/slots/:id - ลบช่วงเวลาจอง
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('slots')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ success: true, message: 'ลบ Slot เรียบร้อยแล้ว' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;