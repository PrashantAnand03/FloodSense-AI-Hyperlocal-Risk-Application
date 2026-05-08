import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://grnvhcucltemvbxiklls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybnZoY3VjbHRlbXZieGlrbGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDg0NDIsImV4cCI6MjA5MzI4NDQ0Mn0.edf2fe5sLu3Q8NzjP07_OOb8uekenL4-ZYI4UnymgiI';

/**
 * Supabase public client for frontend
 * Only uses the ANON key — safe to use in browser
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
});
