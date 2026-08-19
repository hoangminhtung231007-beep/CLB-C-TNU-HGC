import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://trzfaxozbfdrznmcjhom.supabase.co';
const supabaseKey = 'sb_publishable_eA7WCbD9Rcj_WdFoxo-cgg_jj_d6wTH';

export const supabase = createClient(supabaseUrl, supabaseKey);

if (typeof window !== 'undefined') {
  window.supabase = supabase;
  console.log("🟢 Đã kết nối Supabase thành công");
}
