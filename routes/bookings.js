import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// ฟังก์ชันสำหรับสร้างรหัสจองแบบสุ่ม (เช่น BK-7K9A2X)
function generateBookingCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomStr = "";
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BK-${randomStr}`;
}

// ==========================================================
// 1. ดึงรายการจองทั้งหมด (GET /api/bookings)
// ==========================================================
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
                *,
                services (*),
                slots (*)
            `,
      )
      .order("id", { ascending: false });

    if (error) {
      console.error("Fetch Bookings Supabase Error:", error);
      return res.status(500).json({
        status: "error",
        message: "เกิดข้อผิดพลาดในการดึงข้อมูลจาก Database",
      });
    }

    res.json({ status: "success", data: data || [] });
  } catch (err) {
    console.error("Fetch Bookings Server Error:", err);
    res
      .status(500)
      .json({ status: "error", message: "เกิดข้อผิดพลาดของระบบเซิร์ฟเวอร์" });
  }
});

// ==========================================================
// 2. ค้นหารายการจองด้วย Phone เท่านั้น (GET /api/bookings/search)
// ==========================================================
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res
        .status(400)
        .json({ status: "error", message: "กรุณาระบุหมายเลขเบอร์โทรศัพท์" });
    }

    const cleanPhone = query.trim().replace(/[^0-9]/g, "");

    if (!cleanPhone) {
      return res
        .status(400)
        .json({ status: "error", message: "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง" });
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("*, services(service_name, price), slots(start_time, end_time)")
      .eq("customer_phone", cleanPhone)
      .order("id", { ascending: false });

    if (error) {
      console.error("Search Bookings Supabase Error:", error);
      return res
        .status(500)
        .json({ status: "error", message: "ไม่สามารถค้นหาข้อมูลได้" });
    }

    res.json({ status: "success", data: data || [] });
  } catch (err) {
    console.error("Search Bookings Server Error:", err);
    res
      .status(500)
      .json({ status: "error", message: "เกิดข้อผิดพลาดของระบบเซิร์ฟเวอร์" });
  }
});

// ==========================================================
// 3. สร้างรายการจองใหม่ (POST /api/bookings)
// ==========================================================
router.post("/", async (req, res) => {
  try {
    const {
      service_id,
      slot_id,
      customer_name,
      phone,
      customer_phone,
      status,
    } = req.body;
    const inputPhone = phone || customer_phone;

    if (!service_id || !slot_id || !customer_name || !inputPhone) {
      return res.status(400).json({
        status: "error",
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      });
    }

    const cleanedPhone = inputPhone.toString().trim();
    if (!/^[0-9]{9,10}$/.test(cleanedPhone)) {
      return res.status(400).json({
        status: "error",
        message: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (ตัวเลข 9-10 หลัก)",
      });
    }

    const { data: slot, error: slotErr } = await supabase
      .from("slots")
      .select("id, capacity")
      .eq("id", slot_id)
      .single();

    if (slotErr || !slot) {
      return res
        .status(404)
        .json({ status: "error", message: "ไม่พบรอบเวลาที่เลือก" });
    }

    if (slot.capacity <= 0) {
      return res
        .status(400)
        .json({ status: "error", message: "ขออภัย รอบเวลานี้เต็มแล้ว" });
    }

    const { data: updatedSlot, error: atomicErr } = await supabase
      .from("slots")
      .update({ capacity: slot.capacity - 1 })
      .eq("id", slot_id)
      .gt("capacity", 0)
      .select();

    if (atomicErr || !updatedSlot || updatedSlot.length === 0) {
      return res.status(409).json({
        status: "error",
        message: "ขออภัย คิวในรอบเวลานี้เพิ่งถูกจองเต็มไปเมื่อสักครู่",
      });
    }

    const bookingCode = generateBookingCode();
    const bookingStatus = status || "pending";

    const { data: bookingData, error: bookingErr } = await supabase
      .from("bookings")
      .insert([
        {
          booking_code: bookingCode,
          service_id: Number(service_id),
          slot_id: Number(slot_id),
          customer_name: customer_name.trim(),
          customer_phone: cleanedPhone,
          status: bookingStatus,
        },
      ])
      .select();

    if (bookingErr) {
      console.error(
        "Insert Booking Failed, Rolling back slot capacity:",
        bookingErr,
      );
      const { data: currentSlot } = await supabase
        .from("slots")
        .select("capacity")
        .eq("id", slot_id)
        .single();

      if (currentSlot) {
        await supabase
          .from("slots")
          .update({ capacity: currentSlot.capacity + 1 })
          .eq("id", slot_id);
      }

      return res
        .status(500)
        .json({ status: "error", message: "ไม่สามารถบันทึกการจองได้" });
    }

    res.status(201).json({
      status: "success",
      message: "บันทึกการจองเรียบร้อยแล้ว",
      data: bookingData[0],
    });
  } catch (err) {
    console.error("Create Booking Unexpected Error:", err);
    res
      .status(500)
      .json({ status: "error", message: "เกิดข้อผิดพลาดของระบบเซิร์ฟเวอร์" });
  }
});

// ==========================================================
// 4. อัปเดตสถานะการจอง (PATCH /api/bookings/:id/status)
// ==========================================================
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    const validStatuses = ["pending", "confirmed", "cancelled"];
    if (!newStatus || !validStatuses.includes(newStatus)) {
      return res
        .status(400)
        .json({ status: "error", message: "สถานะไม่ถูกต้อง" });
    }

    // แปลง id เป็นตัวเลขชัวร์ๆ (แปลง string "33" เป็น number 33)
    const bookingId = parseInt(id, 10);
    if (isNaN(bookingId)) {
      return res
        .status(400)
        .json({ status: "error", message: "ID การจองต้องเป็นตัวเลขเท่านั้น" });
    }

    // สั่ง Update ตรงๆ เข้า Database
    const { data: updatedBooking, error: updateErr } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId)
      .select();

    if (updateErr) {
      console.error("Update Error:", updateErr);
      return res
        .status(500)
        .json({ status: "error", message: updateErr.message });
    }

    // ถ้า Supabase คืนค่าเป็น array ว่าง แสดงว่าสิทธิ์ RLS บล็อกไว้ หรือหา ID ไม่เจอจริงๆ
    if (!updatedBooking || updatedBooking.length === 0) {
      return res.status(404).json({
        status: "error",
        message: `ไม่สามารถอัปเดตได้: อาจติดสิทธิ์ RLS หรือไม่พบ ID: ${bookingId}`,
      });
    }

    return res.json({
      status: "success",
      success: true,
      message: "อัปเดตสถานะเรียบร้อยแล้ว",
      data: updatedBooking[0],
    });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});


export default router;
