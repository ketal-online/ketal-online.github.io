import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/lib/language-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

type AuthDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: 'login' | 'signup'
}

export function AuthDialog({ open, onOpenChange, defaultTab = 'login' }: AuthDialogProps) {
  const { t } = useLanguage()
  const [mode, setMode] = useState<'login' | 'signup'>(defaultTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setSuccess(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onOpenChange(false)
      resetForm()
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError(null)
    setSuccess(false)
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('auth.check_email')}</DialogTitle>
            <DialogDescription>
              {t('auth.confirmation_sent')} <strong>{email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => { onOpenChange(false); resetForm(); setMode('login'); }}>
            {t('auth.back_to_login')}
          </Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) resetForm(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? t('auth.login') : t('auth.signup')}</DialogTitle>
          <DialogDescription>
            {mode === 'login' ? t('auth.enter_credentials') : t('auth.create_account')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'login' 
              ? (loading ? t('auth.logging_in') : t('auth.login'))
              : (loading ? t('auth.creating_account') : t('auth.signup'))
            }
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? t('auth.no_account') : t('auth.have_account')}{' '}
            <button 
              type="button"
              className="text-primary hover:underline"
              onClick={switchMode}
            >
              {mode === 'login' ? t('auth.signup') : t('auth.login')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
