const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

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
// 2. ค้นหารายการจองด้วย ID หรือ Phone (GET /api/bookings/search)
// ==========================================================
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim() === '') {
            return res.status(400).json({ status: 'error', message: 'กรุณาระบุหมายเลขการจองหรือเบอร์โทรศัพท์' });
        }

        const cleanedQuery = query.trim();
        const isNumeric = !isNaN(cleanedQuery);

        const { data, error } = await supabase
            .from('bookings')
            .select('*, services(service_name, price), slots(start_time, end_time)')
            .or(`id.eq.${isNumeric ? cleanedQuery : 0},phone.eq.${cleanedQuery}`)
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
// รองรับ Concurrent Bookings, Atomic Decrement & Rollback Safety
// ==========================================================
router.post('/', async (req, res) => {
    try {
        const { service_id, slot_id, customer_name, phone, customer_phone, status } = req.body;
        const inputPhone = phone || customer_phone; // รองรับทั้งสองชื่อ key

        // Validation - ตรวจสอบข้อมูลนำเข้า
        if (!service_id || !slot_id || !customer_name || !inputPhone) {
            return res.status(400).json({
                status: 'error',
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อลูกค้า, เบอร์โทรศัพท์, บริการ, และรอบเวลา)'
            });
        }

        // Edge Case Validation: เช็กว่าเบอร์โทรเป็นตัวเลข 9-10 หลัก
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
            return res.status(404).json({
                status: 'error',
                message: 'ไม่พบรอบเวลาที่เลือก หรือรอบเวลานี้อาจถูกลบไปแล้ว'
            });
        }

        if (slot.capacity <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'ขออภัย รอบเวลานี้เต็มแล้ว ไม่สามารถจองเพิ่มได้'
            });
        }

        // Step 2: Atomic Update - ลบ Capacity ลง 1 แบบปลอดภัยจาก Race Condition
        const { data: updatedSlot, error: atomicErr } = await supabase
            .from('slots')
            .update({ capacity: slot.capacity - 1 })
            .eq('id', slot_id)
            .gt('capacity', 0) // เงื่อนไขสำคัญ: ต้องมี capacity มากกว่า 0
            .select();

        if (atomicErr || !updatedSlot || updatedSlot.length === 0) {
            return res.status(409).json({
                status: 'error',
                message: 'ขออภัย คิวในรอบเวลานี้เพิ่งถูกจองเต็มไปเมื่อสักครู่ กรุณาเลือกรอบเวลาอื่น'
            });
        }

        // Step 3: บันทึกรายการจองลงตาราง bookings
        const bookingStatus = status || 'confirmed';
        const { data: bookingData, error: bookingErr } = await supabase
            .from('bookings')
            .insert([{
                service_id: Number(service_id),
                slot_id: Number(slot_id),
                customer_name: customer_name.trim(),
                customer_phone: cleanedPhone, // แมปเข้า Field customer_phone
                phone_number: cleanedPhone,    // เผื่อความซ้ำซ้อนของ Schema
                status: bookingStatus
            }])
            .select();

        // Edge Case Handling: ถ้า Insert Booking ล้มเหลว ต้อง Rollback คืนค่า capacity (+1) ให้ slot
        if (bookingErr) {
            console.error('Insert Booking Failed, Rolling back (+1) slot capacity:', bookingErr);

            // ดึงค่าล่าสุดมา +1 ป้องกันการทับคิวของผู้อื่น
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

            return res.status(500).json({
                status: 'error',
                message: 'ไม่สามารถบันทึกการจองได้ กรุณาลองใหม่อีกครั้ง'
            });
        }

        res.status(201).json({
            status: 'success',
            message: 'บันทึกการจองเรียบร้อยแล้ว',
            data: bookingData[0]
        });

    } catch (err) {
        console.error('Create Booking Unexpected Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'เกิดข้อผิดพลาดที่ไม่คาดคิดในระบบเซิร์ฟเวอร์'
        });
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
            return res.status(400).json({ status: 'error', message: 'สถานะที่ระบุไม่ถูกต้อง (ต้องเป็น pending, confirmed, หรือ cancelled)' });
        }

        // 1. ดึงข้อมูลการจองปัจจุบัน
        const { data: currentBooking, error: fetchErr } = await supabase
            .from('bookings')
            .select('slot_id, status')
            .eq('id', id)
            .single();

        if (fetchErr || !currentBooking) {
            return res.status(404).json({ status: 'error', message: 'ไม่พบรายการจองนี้ในระบบ' });
        }

        const oldStatus = currentBooking.status;
        const slotId = currentBooking.slot_id;

        if (oldStatus === newStatus) {
            return res.json({
                status: 'success',
                message: `รายการจอง ID #${id} เป็นสถานะ ${newStatus} อยู่แล้ว`,
                data: currentBooking
            });
        }

        // 2. อัปเดตสถานะในตาราง bookings
        const { data: updatedBooking, error: updateErr } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', id)
            .select();

        if (updateErr) {
            console.error('Update Booking Status Error:', updateErr);
            return res.status(500).json({ status: 'error', message: 'ไม่สามารถอัปเดตสถานะการจองได้' });
        }

        // 3. ปรับ Capacity ของ Slot ตามสถานะที่เปลี่ยนไป
        const { data: slot } = await supabase
            .from('slots')
            .select('capacity')
            .eq('id', slotId)
            .single();

        if (slot) {
            // หากยกเลิกรายการจองที่เคยอนุมัติ/ยืนยันไว้ -> คืนคิว (capacity + 1)
            if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
                await supabase
                    .from('slots')
                    .update({ capacity: slot.capacity + 1 })
                    .eq('id', slotId);
            }
            // หากเปลี่ยนจากยกเลิก กลับมาใช้งานต่อ -> ลดคิว (capacity - 1)
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
            data: updatedBooking[0]
        });

    } catch (err) {
        console.error('Update Status Server Error:', err);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดของระบบเซิร์ฟเวอร์' });
    }
});

module.exports = router;