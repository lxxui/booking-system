// ประกาศตัวแปร Supabase Client (ถ้ายังไม่มี)
// const supabase = supabase.createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

// --- Realtime Subscriptions ---
supabase
  .channel('public:bookings')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (payload) => {
    console.log('มีการจองใหม่เข้ามา:', payload.new);
    if (typeof fetchSlots === 'function') fetchSlots(); 
  })
  .subscribe();

supabase
  .channel('public:reviews')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, (payload) => {
    console.log('มีรีวิวใหม่เข้ามา:', payload.new);
    if (typeof fetchReviews === 'function') fetchReviews();
  })
  .subscribe();