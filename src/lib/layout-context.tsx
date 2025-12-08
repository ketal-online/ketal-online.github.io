import React, { createContext, useContext, useState } from 'react'

type LayoutContextType = {
  rightSidebarOpen: boolean
  setRightSidebarOpen: (open: boolean) => void
  toggleRightSidebar: () => void
  showRightSidebarTrigger: boolean
  setShowRightSidebarTrigger: (show: boolean) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [showRightSidebarTrigger, setShowRightSidebarTrigger] = useState(false)

  const toggleRightSidebar = () => setRightSidebarOpen(prev => !prev)

  return (
    <LayoutContext.Provider value={{ 
      rightSidebarOpen, 
      setRightSidebarOpen, 
      toggleRightSidebar,
      showRightSidebarTrigger,
      setShowRightSidebarTrigger
    }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}
