const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yvpzjukdfgpeairqtist.supabase.co';
// เอากุญแจ anon public key จากหน้า Supabase (Project Settings > API) มาวางที่นี่
const supabaseKey = 'sb_publishable_sHBQwPxWB7-IDz09zT7K6w_YGKepjKW';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;