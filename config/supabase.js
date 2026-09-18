import { createClient } from '@supabase/supabase-js';
import process from 'node:process';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ กรุณาตรวจสอบค่า SUPABASE_URL และ SUPABASE_ANON_KEY ในไฟล์ .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;