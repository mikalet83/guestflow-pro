import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gvhivabmiaopualpgmft.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2aGl2YWJtaWFvcHVhbHBnbWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzA2MTEsImV4cCI6MjA5MzA0NjYxMX0.nFgCRO-dDIdoDf4-PObqQ-jGYabEhE_5UW8Z52yydgE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);