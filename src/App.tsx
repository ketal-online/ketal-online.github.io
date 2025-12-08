import { Routes, Route, Navigate } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { AuthProvider } from '@/components/auth-provider'
import { ThemeProvider } from '@/lib/theme-context'
import { LanguageProvider } from '@/lib/language-context'
import { Toaster } from '@/components/ui/sonner'
import NewRoomPage from '@/pages/room/new-room'
import GameRoomPage from '@/pages/room/game-room'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <SiteHeader />
            <main className="pt-[var(--header-height)]">
              <Routes>
                <Route path="/" element={<NewRoomPage />} />
                <Route path="/room/:roomSlug" element={<GameRoomPage />} />
                {/* Redirect login, signup, and invalid routes to home */}
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/signup" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Toaster position="top-right" offset="calc(var(--header-height) + 8px)" />
          </div>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
