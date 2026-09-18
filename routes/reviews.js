import express from 'express';
import supabase from '../config/supabase.js';

const router = express.Router();

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
    const finalTags = Array.isArray(tags) ? [...tags] : [];
    let cleanComment = comment ? String(comment).trim() : '';

    // กรณีมี Tag ปะปนมาใน comment ในรูปแบบ [...] (เช่น [⚡ ตรงเวลา] ข้อความ...)
    if (cleanComment) {
      const tagMatches = cleanComment.match(/\[(.*?)\]/g);
      if (tagMatches) {
        tagMatches.forEach(tagStr => {
          const extractedTag = tagStr.slice(1, -1).trim();
          if (extractedTag && !finalTags.includes(extractedTag)) {
            finalTags.push(extractedTag);
          }
        });
      }
      cleanComment = cleanComment.replace(/\[(.*?)\]/g, '').trim();
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

export default router;