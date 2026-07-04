import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bntnlzjcsievvooklaxh.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudG5sempjc2lldnZvb2tsYXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNTkwMzIsImV4cCI6MjA5ODYzNTAzMn0.-HWAiVdY-NMliS_E90QKdOso3LoU9zYixHU6a755log'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
