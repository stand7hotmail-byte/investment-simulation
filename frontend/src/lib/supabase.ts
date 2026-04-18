import { createClient } from '@supabase/supabase-js'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabaseUrl = rawUrl.trim() || 'https://placeholder.supabase.co'
const supabaseAnonKey = rawKey.trim() || 'placeholder-key'

if (typeof window !== 'undefined') {
  if (!rawUrl || supabaseUrl.includes('placeholder')) {
    console.warn('[Supabase] Warning: NEXT_PUBLIC_SUPABASE_URL is not set or using placeholder.')
  }
  if (!rawKey || supabaseAnonKey.includes('placeholder')) {
    console.warn('[Supabase] Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or using placeholder.')
  }
  
  try {
    new URL(supabaseUrl)
  } catch (e) {
    console.error('[Supabase] Invalid URL configuration:', supabaseUrl.substring(0, 10) + '...')
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
