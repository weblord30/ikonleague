import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bcmsmhxmyjnftfthgtka.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbXNtaHhteWpuZnRmdGhndGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NTk1NTUsImV4cCI6MjEwMTUzNTU1NX0.D0gWi134RR7u7rHGCovL03HOZqwgGgX6bbtd2TSmZHY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
export const ADMIN_EMAIL = 'at.trials00@gmail.com'
