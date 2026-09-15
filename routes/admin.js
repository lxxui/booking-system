// GET /api/admin/stats - ดึงข้อมูลสถิติสำหรับ Dashboard (ต้องผ่าน Middleware verifyToken)
router.get('/stats', verifyToken, async (req, res) => {
    try {
        // ดึงข้อมูล bookings พร้อม join ตาราง slots และ services
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select(`
                *,
                slots (
                    start_time,
                    end_time
                ),
                services (
                    service_name
                )
            `);

        if (error) throw error;

        // หากไม่มีข้อมูล ให้ส่งค่าเริ่มต้นกลับทันที ป้องกันโค้ดค้าง
        const bookingList = bookings || [];

        // 1. สรุปภาพรวม (Overview Cards)
        const summary = {
            totalBookings: bookingList.length,
            confirmedBookings: bookingList.filter(b => b.status === 'confirmed').length,
            pendingBookings: bookingList.filter(b => b.status === 'pending').length,
            cancelledBookings: bookingList.filter(b => b.status === 'cancelled').length
        };

        // 2. จัดกลุ่มนับจำนวนคนตามรอบเวลา (Slot Breakdown)
        const slotStats = {};
        bookingList.forEach(b => {
            if (b.status !== 'cancelled' && b.slots && b.slots.start_time && b.slots.end_time) {
                try {
                    const startDate = new Date(b.slots.start_time);
                    const endDate = new Date(b.slots.end_time);

                    // ปรับ Format ให้เสถียร รองรับภาษาไทยและ Timezone
                    const start = startDate.toLocaleTimeString('th-TH', { 
                        timeZone: 'Asia/Bangkok', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: false 
                    });
                    const end = endDate.toLocaleTimeString('th-TH', { 
                        timeZone: 'Asia/Bangkok', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: false 
                    });

                    const timeKey = `${start} - ${end} น.`;
                    slotStats[timeKey] = (slotStats[timeKey] || 0) + 1;
                } catch (e) {
                    console.error('Slot formatting error:', e);
                }
            }
        });

        // ตอบกลับข้อมูลโครงสร้างที่ชัดเจน
        res.json({
            status: 'success',
            data: { 
                summary, 
                slotStats,
                recentBookings: bookingList // แนบรายการจองทั้งหมดกลับไปสำหรับวาด Table ด้วย
            }
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});