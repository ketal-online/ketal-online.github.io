import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type AuthContextType = {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  updateProfile: (data: { full_name?: string }) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
