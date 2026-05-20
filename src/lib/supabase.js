import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || "https://coydyfllhpmiobhnjgsg.supabase.co";
const supabaseKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY || "sb_publishable_v0BGyR8opvlCDD2oGRbQfw_xCoM9JB5";

export const supabase = createClient(supabaseUrl, supabaseKey);
