import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'client' | 'admin'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  full_name?: string
  membership_tier?: 'basic' | 'pro' | 'elite'
  created_at: string
}