import express from 'express';
import supabase from '../config/supabase.js';

const router = express.Router();

// 1. ดึงรายการบริการทั้งหมด (GET /api/services)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    res.json({ status: 'success', data });
  } catch (err) {
    console.error('Fetch Services Error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2. เพิ่มบริการใหม่ (POST /api/services)
router.post('/', async (req, res) => {
  try {
    const { service_name, price, duration_minutes } = req.body;

    if (!service_name || !price || !duration_minutes) {
      return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลบริการให้ครบถ้วน' });
    }

    const { data, error } = await supabase
      .from('services')
      .insert([{ service_name, price, duration_minutes }])
      .select();

    if (error) throw error;

    res.status(201).json({
      status: 'success',
      message: 'เพิ่มบริการใหม่เรียบร้อยแล้ว',
      data: data[0]
    });
  } catch (err) {
    console.error('Create Service Error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 3. ลบบริการ (DELETE /api/services/:id)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      status: 'success',
      message: `ลบบริการ ID #${id} เรียบร้อยแล้ว`
    });
  } catch (err) {
    console.error('Delete Service Error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

export default router;