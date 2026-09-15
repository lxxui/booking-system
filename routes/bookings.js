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
        const { service_id, slot_id, customer_name, phone, status } = req.body;

        if (!service_id || !slot_id || !customer_name || !phone) {
            return res.status(400).json({
                status: 'error',
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, เบอร์โทร, บริการ, และรอบเวลา)'
            });
        }

        // บันทึกการจอง
        const { data, error } = await supabase
            .from('bookings')
            .insert([{
                service_id,
                slot_id,
                customer_name,
                phone,
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
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// 3. อัปเดตสถานะการจอง (PATCH /api/bookings/:id/status)
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status: newStatus } = req.body;

        if (!newStatus) {
            return res.status(400).json({ status: 'error', message: 'กรุณาระบุ status ที่ต้องการเปลี่ยน' });
        }

        // 1. ดึงข้อมูลการจองปัจจุบันเพื่อตรวจสอบสถานะเดิม
        const { data: currentBooking, error: fetchErr } = await supabase
            .from('bookings')
            .select('slot_id, status')
            .eq('id', id)
            .single();

        if (fetchErr || !currentBooking) {
            return res.status(404).json({ status: 'error', message: 'ไม่พบรายการจอง' });
        }

        const oldStatus = currentBooking.status;
        const slotId = currentBooking.slot_id;

        // ป้องกันการกดเปลี่ยนเป็นสถานะเดิมซ้ำ
        if (oldStatus === newStatus) {
            return res.json({
                status: 'success',
                message: `รายการจอง ID #${id} เป็นสถานะ ${newStatus} อยู่แล้ว`,
                data: currentBooking
            });
        }

        // 2. อัปเดตสถานะในตาราง bookings
        const { data, error } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', id)
            .select();

        if (error) throw error;

        // 3. ปรับ capacity ตามเงื่อนไขสถานะที่เปลี่ยนจริงเท่านั้น
        const { data: slot } = await supabase
            .from('slots')
            .select('capacity')
            .eq('id', slotId)
            .single();

        if (slot) {
            // Case A: รับคิว (pending/cancelled -> confirmed) : ลด capacity ลง 1
            if (newStatus === 'confirmed' && oldStatus !== 'confirmed') {
                if (slot.capacity > 0) {
                    await supabase
                        .from('slots')
                        .update({ capacity: slot.capacity - 1 })
                        .eq('id', slotId);
                }
            }
            // Case B: ยกเลิกคิวที่เคยอนุมัติแล้ว (confirmed -> cancelled) : คืน capacity เพิ่ม 1
            else if (newStatus === 'cancelled' && oldStatus === 'confirmed') {
                await supabase
                    .from('slots')
                    .update({ capacity: slot.capacity + 1 })
                    .eq('id', slotId);
            }
            // Note: หากเป็นการยกเลิกรายการที่ยังเป็น pending อยู่ จะไม่เพิ่ม capacity เพิ่มขึ้นมามั่วๆ
        }

        res.json({
            status: 'success',
            message: `อัปเดตสถานะการจอง ID #${id} เป็น ${newStatus} เรียบร้อย`,
            data: data[0]
        });
    } catch (err) {
        console.error('Update Status Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ดึงข้อมูลการจองด้วย Booking ID หรือ เบอร์โทร
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query; // รับค่า phone หรือ booking_id

        if (!query) {
            return res.status(400).json({ status: 'error', message: 'กรุณาระบุหมายเลขการจองหรือเบอร์โทรศัพท์' });
        }

        // ค้นหาจาก ID หรือ Phone (ถ้ามีคอลัมน์ phone)
        const { data, error } = await supabase
            .from('bookings')
            .select('*, services(service_name, price), slots(start_time, end_time)')
            .or(`id.eq.${isNaN(query) ? 0 : query},phone.eq.${query}`)
            .order('id', { ascending: false });

        if (error) throw error;

        res.json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});


// ไฟล์ server.js หรือ routes/bookings.js
router.get('/api/bookings', async (req, res) => {
    try {
        // 🟢 แก้ไขตรงนี้: เพิ่ม services (*) และ slots (*) เข้าไปใน select
        const { data, error } = await supabase
            .from('bookings')
            .select(`
        *,
        services (*),
        slots (*)
      `);

        if (error) throw error;

        // ส่งข้อมูลกลับไปยัง Frontend
        res.json({ data: data });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;