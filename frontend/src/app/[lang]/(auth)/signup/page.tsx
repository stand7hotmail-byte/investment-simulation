'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/useI18n'

export default function SignUpPage() {
  const router = useRouter()
  const { t, lang } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const isPasswordValid = password.length >= 6
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPasswordValid) return
    
    setLoading(true)
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/${lang}/login`,
      },
    })
    
    if (error) {
      let errorMessage = error.message
      if (error.message.includes('User already registered')) {
        errorMessage = t('auth.alreadyRegistered')
      } else if (error.message.includes('Password should be at least 6 characters')) {
        errorMessage = t('auth.passwordTooShort')
      } else if (error.message.includes('Signup disabled')) {
        errorMessage = t('auth.signupDisabled')
      }
      toast.error(errorMessage)
    } else {
      toast.success(t('auth.signupSuccess'))
      router.push(`/${lang}/login`)
    }
    
    setLoading(false)
  }
  
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t('auth.signupTitle')}</CardTitle>
          <p className="text-sm text-slate-500 text-center">
            {t('auth.signupSubtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder={t('auth.emailLabel')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder={`${t('auth.passwordLabel')}（${t('auth.passwordTooShort')}）`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
              {password && !isPasswordValid && (
                <p className="text-xs text-red-500">
                  {t('auth.passwordTooShort')}
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={loading || (password.length > 0 && !isPasswordValid)} 
              className="w-full h-11 text-lg font-medium"
            >
              {loading ? t('auth.signingUp') : t('auth.signupButton')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-slate-500 text-center">
            {t('auth.hasAccount')}{' '}
            <Link href={`/${lang}/login`} className="text-blue-600 hover:underline font-medium">
              {t('auth.loginTitle')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
