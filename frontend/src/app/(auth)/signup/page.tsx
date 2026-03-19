'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SignUpPage() {
  const router = useRouter()
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
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    
    if (error) {
      // エラーメッセージの日本語化
      let errorMessage = error.message
      if (error.message.includes('User already registered')) {
        errorMessage = 'このメールアドレスは既に登録されています。'
      } else if (error.message.includes('Password should be at least 6 characters')) {
        errorMessage = 'パスワードは6文字以上である必要があります。'
      } else if (error.message.includes('Signup disabled')) {
        errorMessage = '現在、新規登録は制限されています。'
      }
      toast.error(errorMessage)
    } else {
      toast.success('確認メールを送信しました。メールをご確認ください。')
      router.push('/login')
    }
    
    setLoading(false)
  }
  
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">アカウント作成</CardTitle>
          <p className="text-sm text-slate-500 text-center">
            メールアドレスを入力してアカウントを作成してください
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="パスワード（6文字以上）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
              {password && !isPasswordValid && (
                <p className="text-xs text-red-500">
                  パスワードは6文字以上である必要があります。
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={loading || (password.length > 0 && !isPasswordValid)} 
              className="w-full h-11 text-lg font-medium"
            >
              {loading ? '作成中...' : 'アカウント登録'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-slate-500 text-center">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              ログイン
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
