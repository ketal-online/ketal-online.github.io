import { Routes, Route } from 'react-router-dom'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AuthProvider } from '@/components/auth-provider'
import { LayoutProvider } from '@/lib/layout-context'
import LoginPage from '@/pages/login'
import SignupPage from '@/pages/signup'
import NewRoomPage from '@/pages/room/new-room'
import GameRoomPage from '@/pages/room/game-room'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <LayoutProvider>
        <SidebarProvider
          style={
            {
              "--header-height": "3.5rem",
            } as React.CSSProperties
          }
          className="pt-[var(--header-height)]"
        >
          <SiteHeader />
          <AppSidebar />
          <main className="flex flex-1 flex-col min-h-[calc(100vh-var(--header-height))] transition-[margin] duration-300 ease-in-out">
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  <Routes>
                    <Route path="/" element={<NewRoomPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/room/:roomId" element={<GameRoomPage />} />
                  </Routes>
                </div>
              </div>
            </div>
          </main>
        </SidebarProvider>
      </LayoutProvider>
    </AuthProvider>
  )
}

export default App
