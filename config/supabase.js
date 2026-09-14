require('dotenv').config(); // <-- เพิ่มบรรทัดนี้ไว้หัวไฟล์
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ กรุณาตรวจสอบค่า SUPABASE_URL และ SUPABASE_ANON_KEY ในไฟล์ .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;