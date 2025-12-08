import React, { createContext, useContext, useState } from 'react'

export type Language = 'en' | 'fr'

type Translations = {
  [key: string]: {
    en: string
    fr: string
  }
}

// Translation dictionary
const translations: Translations = {
  // Navigation
  'nav.home': { en: 'Home', fr: 'Accueil' },
  'nav.rooms': { en: 'Rooms', fr: 'Salons' },
  
  // User menu
  'user.login': { en: 'Login', fr: 'Connexion' },
  'user.logout': { en: 'Logout', fr: 'Déconnexion' },
  'user.signup': { en: 'Sign Up', fr: 'Inscription' },
  'user.profile': { en: 'Profile', fr: 'Profil' },
  'user.settings': { en: 'Settings', fr: 'Paramètres' },
  'user.theme': { en: 'Theme', fr: 'Thème' },
  'user.language': { en: 'Language', fr: 'Langue' },
  
  // Theme
  'theme.light': { en: 'Light', fr: 'Clair' },
  'theme.dark': { en: 'Dark', fr: 'Sombre' },
  'theme.system': { en: 'System', fr: 'Système' },
  
  // Rooms
  'room.create': { en: 'Create Room', fr: 'Créer un salon' },
  'room.join': { en: 'Join Room', fr: 'Rejoindre' },
  'room.delete': { en: 'Delete', fr: 'Supprimer' },
  'room.name': { en: 'Room Name', fr: 'Nom du salon' },
  'room.password': { en: 'Password', fr: 'Mot de passe' },
  'room.password.optional': { en: 'Password (Optional)', fr: 'Mot de passe (Optionnel)' },
  'room.password.placeholder': { en: 'Leave empty for public room', fr: 'Laisser vide pour un salon public' },
  'room.id': { en: 'Room ID', fr: 'ID du salon' },
  'room.your_rooms': { en: 'Your Rooms', fr: 'Vos salons' },
  'room.no_rooms': { en: 'No rooms created yet.', fr: 'Aucun salon créé.' },
  'room.creating': { en: 'Creating...', fr: 'Création...' },
  'room.loading': { en: 'Loading room...', fr: 'Chargement du salon...' },
  'room.enter_password': { en: 'Enter Room Password', fr: 'Entrer le mot de passe' },
  'room.join_room': { en: 'Join Room', fr: 'Rejoindre le salon' },
  'room.waiting_for_players': { en: 'Waiting for players...', fr: 'En attente de joueurs...' },
  'room.share_link_hint': { en: 'Share this link with your friends to start playing.', fr: 'Partagez ce lien avec vos amis pour commencer à jouer.' },
  'room.listening_for_peers': { en: 'Listening for peers...', fr: 'Recherche de pairs...' },
  'room.game_board': { en: 'Game Board', fr: 'Plateau de jeu' },
  'room.game_content': { en: 'Game content will appear here', fr: 'Le contenu du jeu apparaîtra ici' },
  
  // Chat
  'chat.placeholder': { en: 'Type a message...', fr: 'Tapez un message...' },
  'chat.posting_as': { en: 'Posting as', fr: 'Postant en tant que' },
  'chat.change_name': { en: 'Change Name', fr: 'Changer de nom' },
  'chat.new_message': { en: 'New message', fr: 'Nouveau message' },
  'chat.save': { en: 'Save', fr: 'Enregistrer' },
  
  // Players
  'players.title': { en: 'Players', fr: 'Joueurs' },
  'players.me': { en: 'Me', fr: 'Moi' },
  'players.name_changed': { en: 'Player {0} is now called {1}', fr: 'Le joueur {0} s\'appelle maintenant {1}' },
  
  // Voice
  'voice.join': { en: 'Voice', fr: 'Vocal' },
  'voice.leave': { en: 'Leave call', fr: 'Quitter l\'appel' },
  'voice.mute': { en: 'Mute', fr: 'Couper le micro' },
  'voice.unmute': { en: 'Unmute', fr: 'Activer le micro' },
  'voice.muted': { en: 'Muted', fr: 'Muet' },
  'voice.live': { en: 'Live', fr: 'En direct' },
  
  // Auth
  'auth.email': { en: 'Email', fr: 'Email' },
  'auth.password': { en: 'Password', fr: 'Mot de passe' },
  'auth.login': { en: 'Login', fr: 'Connexion' },
  'auth.logging_in': { en: 'Logging in...', fr: 'Connexion...' },
  'auth.signup': { en: 'Sign Up', fr: 'Inscription' },
  'auth.creating_account': { en: 'Creating account...', fr: 'Création du compte...' },
  'auth.no_account': { en: "Don't have an account?", fr: "Pas de compte ?" },
  'auth.have_account': { en: 'Already have an account?', fr: 'Déjà un compte ?' },
  'auth.forgot_password': { en: 'Forgot password?', fr: 'Mot de passe oublié ?' },
  'auth.check_email': { en: 'Check your email', fr: 'Vérifiez votre email' },
  'auth.confirmation_sent': { en: "We've sent you a confirmation link to", fr: 'Nous vous avons envoyé un lien de confirmation à' },
  'auth.back_to_login': { en: 'Back to Login', fr: 'Retour à la connexion' },
  'auth.enter_credentials': { en: 'Enter your credentials to access your account', fr: 'Entrez vos identifiants pour accéder à votre compte' },
  'auth.create_account': { en: 'Create a new account to get started', fr: 'Créez un nouveau compte pour commencer' },
  
  // Welcome
  'welcome.title': { en: 'Welcome!', fr: 'Bienvenue !' },
  'welcome.description': { en: 'Log in to create and manage your own rooms.', fr: 'Connectez-vous pour créer et gérer vos propres salons.' },
  
  // Common
  'common.loading': { en: 'Loading...', fr: 'Chargement...' },
  'common.save': { en: 'Save', fr: 'Enregistrer' },
  'common.cancel': { en: 'Cancel', fr: 'Annuler' },
  'common.close': { en: 'Close', fr: 'Fermer' },
  'common.guest': { en: 'Guest', fr: 'Invité' },
}

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('language') as Language
      if (stored) return stored
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0]
      return browserLang === 'fr' ? 'fr' : 'en'
    }
    return 'en'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    const translation = translations[key]
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`)
      return key
    }
    return translation[language]
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
