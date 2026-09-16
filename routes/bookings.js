const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// 1. ดึงรายการจองทั้งหมด (GET /api/bookings)
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                services (*),
                slots (*)
            `)
            .order('id', { ascending: false });

        if (error) throw error;

        res.json({ status: 'success', data });
    } catch (err) {
        console.error('Fetch Bookings Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// 2. ดึงข้อมูลการจองด้วย Booking ID หรือ เบอร์โทร (GET /api/bookings/search)
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query; // รับค่า phone หรือ booking_id

        if (!query) {
            return res.status(400).json({ status: 'error', message: 'กรุณาระบุหมายเลขการจองหรือเบอร์โทรศัพท์' });
        }

        // ค้นหาจาก ID หรือ Phone
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

// 3. สร้างรายการจองใหม่ และตัด Slot ทันที (POST /api/bookings)
router.post('/', async (req, res) => {
    try {
        const { service_id, slot_id, customer_name, phone, status } = req.body;

        if (!service_id || !slot_id || !customer_name || !phone) {
            return res.status(400).json({
                status: 'error',
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, เบอร์โทร, บริการ, และรอบเวลา)'
            });
        }

        // 3.1 ตรวจสอบความพร้อมของ Slot ก่อนทำการจอง
        const { data: slot, error: slotErr } = await supabase
            .from('slots')
            .select('capacity')
            .eq('id', slot_id)
            .single();

        if (slotErr || !slot) {
            return res.status(404).json({ status: 'error', message: 'ไม่พบรอบเวลาที่เลือก' });
        }

        if (slot.capacity <= 0) {
            return res.status(400).json({ status: 'error', message: 'รอบเวลานี้เต็มแล้ว ไม่สามารถจองเพิ่มได้' });
        }

        // 3.2 บันทึกการจองลงตาราง bookings
        const bookingStatus = status || 'confirmed'; // หรือใส่เป็น 'pending' ตาม Logic ร้าน
        const { data, error } = await supabase
            .from('bookings')
            .insert([{
                service_id,
                slot_id,
                customer_name,
                phone,
                status: bookingStatus
            }])
            .select();

        if (error) throw error;

        // 3.3 ลดจำนวน capacity ในตาราง slots ลง 1 ทันที
        const { error: updateSlotErr } = await supabase
            .from('slots')
            .update({ capacity: slot.capacity - 1 })
            .eq('id', slot_id);

        if (updateSlotErr) {
            console.error('Update Slot Capacity Error:', updateSlotErr);
        }

        res.status(201).json({
            status: 'success',
            message: 'บันทึกการจองเรียบร้อยแล้ว',
            data: data[0]
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// 4. อัปเดตสถานะการจอง (PATCH /api/bookings/:id/status)
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status: newStatus } = req.body;

        if (!newStatus) {
            return res.status(400).json({ status: 'error', message: 'กรุณาระบุ status ที่ต้องการเปลี่ยน' });
        }

        // 4.1 ดึงข้อมูลการจองปัจจุบันเพื่อตรวจสอบสถานะเดิม
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

        // 4.2 อัปเดตสถานะในตาราง bookings
        const { data, error } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', id)
            .select();

        if (error) throw error;

        // 4.3 ปรับคืนค่า capacity หากมีการยกเลิกคิว (cancelled)
        const { data: slot } = await supabase
            .from('slots')
            .select('capacity')
            .eq('id', slotId)
            .single();

        if (slot) {
            // หากยกเลิกรายการจองที่เคยจองไว้ -> คืนคิวเพิ่ม capacity + 1
            if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
                await supabase
                    .from('slots')
                    .update({ capacity: slot.capacity + 1 })
                    .eq('id', slotId);
            }
            // หากเปลี่ยนจากยกเลิก กลับมาใช้งานต่อ -> ลด capacity - 1
            else if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
                if (slot.capacity > 0) {
                    await supabase
                        .from('slots')
                        .update({ capacity: slot.capacity - 1 })
                        .eq('id', slotId);
                }
            }
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

module.exports = router;