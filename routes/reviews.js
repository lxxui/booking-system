const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// 1. ดึงรายการรีวิวทั้งหมด พร้อมชื่อบริการ (GET /api/reviews)
router.get('/', async (req, res) => {
  try {
    // ดึงรีวิวและ JOIN เอา service_name จากตาราง services
    const { data, error } = await supabase
      .from('reviews')
      .select('*, services(service_name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('Fetch Reviews Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. เพิ่มรีวิวใหม่ รองรับทั้ง tags และ comment (POST /api/reviews)
router.post('/', async (req, res) => {
  const { name, service_id, rating, tags, comment } = req.body;

  // ตรวจสอบความถูกต้องของข้อมูล (ต้องมีชื่อ และคะแนน)
  if (!name || !rating) {
    return res.status(400).json({ success: false, error: 'กรุณากรอกชื่อและให้คะแนนบริการ' });
  }

  try {
    let finalTags = Array.isArray(tags) ? [...tags] : [];
    let cleanComment = comment ? String(comment).trim() : '';

    // กรณีมี Tag ปะปนมาใน comment ในรูปแบบ [...] (เช่น [⚡ ตรงเวลา] ข้อความ...)
    // ทำการสกัดแท็กย้ายเข้า finalTags และลบออกจาก cleanComment
    if (cleanComment) {
      const tagRegex = /\[(.*?)\]/g;
      let match;
      while ((match = tagRegex.exec(cleanComment)) !== null) {
        if (match[1] && !finalTags.includes(match[1])) {
          finalTags.push(match[1]);
        }
      }
      cleanComment = cleanComment.replace(tagRegex, '').trim();
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([{ 
        name: String(name).trim(), 
        service_id: service_id || null, 
        rating: Number(rating), 
        tags: finalTags, 
        comment: cleanComment 
      }])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, message: 'ส่งรีวิวเรียบร้อยแล้ว', data: data[0] });
  } catch (err) {
    console.error('Create Review Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;