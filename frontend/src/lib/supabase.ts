import { createClient } from '@supabase/supabase-js'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabaseUrl = rawUrl.trim() || 'https://placeholder.supabase.co'
const supabaseAnonKey = rawKey.trim() || 'placeholder-key'

if (typeof window !== 'undefined') {
  const mask = (str: string) => str ? `${str.substring(0, 5)}...${str.substring(str.length - 3)}` : 'MISSING'
  console.log('[Supabase Config] URL:', mask(supabaseUrl))
  console.log('[Supabase Config] Key Length:', supabaseAnonKey.length)

  // Connectivity probe
  fetch(supabaseUrl, { method: 'HEAD', mode: 'no-cors' })
    .then(() => console.log('[Supabase Probe] Basic connectivity: OK'))
    .catch((err) => console.warn('[Supabase Probe] Basic connectivity: FAILED. Check AdBlocker or Network Firewall.', err))

  if (!rawUrl || supabaseUrl.includes('placeholder')) {
    console.warn('[Supabase] Warning: NEXT_PUBLIC_SUPABASE_URL is not set or using placeholder.')
  }
  if (!rawKey || supabaseAnonKey.includes('placeholder')) {
    console.warn('[Supabase] Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or using placeholder.')
  }
  
  if (supabaseUrl.startsWith('http://') && !supabaseUrl.includes('localhost')) {
    console.warn('[Supabase] Security Warning: Using insecure HTTP for production Supabase URL.')
  }

  try {
    new URL(supabaseUrl)
  } catch (e) {
    console.error('[Supabase] Invalid URL configuration:', supabaseUrl)
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
