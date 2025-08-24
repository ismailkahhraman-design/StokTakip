import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// prod'da env gelmiyorsa hemen anlayalım
console.log("[ENV] VITE_SUPABASE_URL:", url);
console.log("[ENV] VITE_SUPABASE_ANON_KEY present:", !!key);

export const supabase = (url && key) ? createClient(url, key) : null;
