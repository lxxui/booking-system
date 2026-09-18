const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// ฟังก์ชันสำหรับสร้างรหัสจองแบบสุ่ม (เช่น BK-7K9A2X)
function generateBookingCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    for (let i = 0; i < 6; i++) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `BK-${randomStr}`;
}

// ==========================================================
// 1. ดึงรายการจองทั้งหมด (GET /api/bookings)
// ==========================================================
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

        if (error) {
            console.error('Fetch Bookings Supabase Error:', error);
            return res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Database' });
        }

        res.json({ status: 'success', data: data || [] });
    } catch (err) {
        console.error('Fetch Bookings Server Error:', err);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดของระบบเซิร์ฟเวอร์' });
    }
});

// ==========================================================
// 2. ค้นหารายการจองด้วย Phone เท่านั้น (GET /api/bookings/search)
// ==========================================================
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim() === '') {
            return res.status(400).json({ status: 'error', message: 'กรุณาระบุหมายเลขเบอร์โทรศัพท์' });
        }

        // Clean ข้อมูล: ตัดขีด (-) ช่องว่าง หรือตัวอักษรออก ให้เหลือเฉพาะตัวเลข
        const cleanPhone = query.trim().replace(/[^0-9]/g, '');

        if (!cleanPhone) {
            return res.status(400).json({ status: 'error', message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' });
        }

        // ค้นหาเจาะจงเฉพาะคอลัมน์ customer_phone
        const { data, error } = await supabase
            .from('bookings')
            .select('*, services(service_name, price), slots(start_time, end_time)')
            .eq('customer_phone', cleanPhone)
            .order('id', { ascending: false });

        if (error) {
            console.error('Search Bookings Supabase Error:', error);
            return res.status(500).json({ status: 'error', message: 'ไม่สามารถค้นหาข้อมูลได้' });
        }

        res.json({ status: 'success', data: data || [] });
    } catch (err) {
        console.error('Search Bookings Server Error:', err);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดของระบบเซิร์ฟเวอร์' });
    }
});

// ==========================================================
// 3. สร้างรายการจองใหม่ (POST /api/bookings)
// ==========================================================
router.post('/', async (req, res) => {
    try {
        const { service_id, slot_id, customer_name, phone, customer_phone, status } = req.body;
        const inputPhone = phone || customer_phone;

        if (!service_id || !slot_id || !customer_name || !inputPhone) {
            return res.status(400).json({
                status: 'error',
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
            });
        }

        const cleanedPhone = inputPhone.toString().trim();
        if (!/^[0-9]{9,10}$/.test(cleanedPhone)) {
            return res.status(400).json({
                status: 'error',
                message: 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (ตัวเลข 9-10 หลัก)'
            });
        }

        // Step 1: ตรวจสอบความมีอยู่และคิวคงเหลือของ Slot
        const { data: slot, error: slotErr } = await supabase
            .from('slots')
            .select('id, capacity')
            .eq('id', slot_id)
            .single();

        if (slotErr || !slot) {
            return res.status(404).json({ status: 'error', message: 'ไม่พบรอบเวลาที่เลือก' });
        }

        if (slot.capacity <= 0) {
            return res.status(400).json({ status: 'error', message: 'ขออภัย รอบเวลานี้เต็มแล้ว' });
        }

        // Step 2: Atomic Update - ลบ Capacity ลง 1
        const { data: updatedSlot, error: atomicErr } = await supabase
            .from('slots')
            .update({ capacity: slot.capacity - 1 })
            .eq('id', slot_id)
            .gt('capacity', 0)
            .select();

        if (atomicErr || !updatedSlot || updatedSlot.length === 0) {
            return res.status(409).json({ status: 'error', message: 'ขออภัย คิวในรอบเวลานี้เพิ่งถูกจองเต็มไปเมื่อสักครู่' });
        }

        // Step 3: สุ่มรหัส booking_code
        const bookingCode = generateBookingCode();
        const bookingStatus = status || 'pending';

        const { data: bookingData, error: bookingErr } = await supabase
            .from('bookings')
            .insert([{
                booking_code: bookingCode,
                service_id: Number(service_id),
                slot_id: Number(slot_id),
                customer_name: customer_name.trim(),
                customer_phone: cleanedPhone,
                status: bookingStatus
            }])
            .select();

        // Rollback Safety
        if (bookingErr) {
            console.error('Insert Booking Failed, Rolling back slot capacity:', bookingErr);
            const { data: currentSlot } = await supabase
                .from('slots')
                .select('capacity')
                .eq('id', slot_id)
                .single();

            if (currentSlot) {
                await supabase
                    .from('slots')
                    .update({ capacity: currentSlot.capacity + 1 })
                    .eq('id', slot_id);
            }

            return res.status(500).json({ status: 'error', message: 'ไม่สามารถบันทึกการจองได้' });
        }

        res.status(201).json({
            status: 'success',
            message: 'บันทึกการจองเรียบร้อยแล้ว',
            data: bookingData[0]
        });

    } catch (err) {
        console.error('Create Booking Unexpected Error:', err);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดของระบบเซิร์ฟเวอร์' });
    }
});

// ==========================================================
// 4. อัปเดตสถานะการจอง (PATCH /api/bookings/:id/status)
// ==========================================================
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status: newStatus } = req.body;

        const validStatuses = ['pending', 'confirmed', 'cancelled'];
        if (!newStatus || !validStatuses.includes(newStatus)) {
            return res.status(400).json({ status: 'error', message: 'สถานะไม่ถูกต้อง' });
        }

        // 📌 ปรับปรุงจุดนี้: ค้นหาทั้งรหัส BK-C3UXVS หรือ ID เพียวๆ
        const { data: currentBooking, error: fetchErr } = await supabase
            .from('bookings')
            .select('*')
            .or(`id.eq.${id},booking_code.eq.${id},booking_code.eq.BK-${id}`)
            .maybeSingle();

        if (fetchErr || !currentBooking) {
            console.error('Fetch Booking Error:', fetchErr);
            return res.status(404).json({ status: 'error', message: `ไม่พบรายการจอง #${id}` });
        }

        const realId = currentBooking.id;

        // อัปเดตข้อมูลด้วย Primary Key จริงที่เจอในฐานข้อมูล
        const { data: updatedBooking, error: updateErr } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', realId)
            .select();

        if (updateErr) {
            console.error('Update Error:', updateErr);
            return res.status(500).json({ status: 'error', message: updateErr.message });
        }

        return res.json({
            status: 'success',
            success: true,
            message: 'อัปเดตสถานะเรียบร้อยแล้ว',
            data: updatedBooking ? updatedBooking[0] : null
        });

    } catch (err) {
        console.error('Server Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;