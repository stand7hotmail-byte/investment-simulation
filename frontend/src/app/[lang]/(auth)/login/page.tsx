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

export default function LoginPage() {
  const router = useRouter()
  const { t, lang } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      let errorMessage = error.message
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = t('auth.invalidCredentials')
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = t('auth.emailNotConfirmed')
      }
      toast.error(errorMessage)
    } else {
      toast.success(t('auth.loginSuccess'))
      router.push(`/${lang}/dashboard`)
      router.refresh()
    }
    
    setLoading(false)
  }
  
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t('auth.loginTitle')}</CardTitle>
          <p className="text-sm text-slate-500 text-center">
            {t('auth.loginSubtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder={t('auth.passwordLabel')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 text-lg font-medium">
              {loading ? t('auth.loggingIn') : t('auth.loginButton')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-slate-500 text-center">
            {t('auth.noAccount')}{' '}
            <Link href={`/${lang}/signup`} className="text-blue-600 hover:underline font-medium">
              {t('auth.signupTitle')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
