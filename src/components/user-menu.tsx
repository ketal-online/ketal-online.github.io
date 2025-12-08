import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/lib/theme-context'
import { useLanguage, type Language } from '@/lib/language-context'
import { getAvatarUrl } from '@/lib/dicebear'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThreeStateToggle } from '@/components/ui/three-state-toggle'
import { AuthDialog } from '@/components/auth-dialog'
import { LogIn, LogOut, UserPlus, User } from 'lucide-react'
import { cn } from '@/lib/utils'

function LanguageToggle({ value, onChange }: { value: Language; onChange: (v: Language) => void }) {
  return (
    <div className="inline-flex rounded-md border border-input overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('en')}
        className={cn(
          "px-2.5 py-1 text-xs font-medium transition-colors",
          value === 'en' 
            ? "bg-primary text-primary-foreground" 
            : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange('fr')}
        className={cn(
          "px-2.5 py-1 text-xs font-medium transition-colors border-l border-input",
          value === 'fr' 
            ? "bg-primary text-primary-foreground" 
            : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        FR
      </button>
    </div>
  )
}

export function UserMenu() {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authDialogMode, setAuthDialogMode] = useState<'login' | 'signup'>('login')

  const openAuthDialog = (mode: 'login' | 'signup') => {
    setAuthDialogMode(mode)
    setAuthDialogOpen(true)
  }

  if (!user) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t('user.settings')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Theme selector */}
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm">{t('user.theme')}</span>
              <ThreeStateToggle value={theme} onChange={setTheme} />
            </div>
            
            {/* Language selector */}
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm">{t('user.language')}</span>
              <LanguageToggle value={language} onChange={setLanguage} />
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => openAuthDialog('login')} className="cursor-pointer">
              <LogIn className="mr-2 h-4 w-4" />
              {t('user.login')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openAuthDialog('signup')} className="cursor-pointer">
              <UserPlus className="mr-2 h-4 w-4" />
              {t('user.signup')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <AuthDialog 
          open={authDialogOpen} 
          onOpenChange={setAuthDialogOpen} 
          defaultTab={authDialogMode}
        />
      </>
    )
  }

  const displayName = user.user_metadata?.full_name || user.email || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getAvatarUrl(displayName)} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {user.email && (
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Theme selector */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm">{t('user.theme')}</span>
          <ThreeStateToggle value={theme} onChange={setTheme} />
        </div>
        
        {/* Language selector */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm">{t('user.language')}</span>
          <LanguageToggle value={language} onChange={setLanguage} />
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('user.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
