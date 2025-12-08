# Project Context & Tech Stack
- **Framework**: React (Vite) with TypeScript.
- **Styling**: Tailwind CSS.
- **UI Components**: Use `shadcn/ui` exclusively.
  - If a component is missing, suggest installing it via `npx shadcn@latest add <component>`.
  - Design must be mobile-responsive (e.g., Sidebar on desktop, Sheet/Drawer on mobile).
- **Routing**: Use `HashRouter` exclusively (compatibility with GitHub Pages).
- **Backend**: Supabase (using `@supabase/supabase-js`).
- **P2P/Multiplayer**: Trystero (using `trystero/nostr` strategy).

# Architecture & Patterns
- **Authentication**:
  - Managed via `src/components/auth-provider.tsx` and `src/lib/auth-context.ts`.
  - Access user state using `const { user } = useAuth()` from `src/hooks/use-auth.ts`.
- **Game Rooms (P2P)**:
  - Room metadata (ID, name, password) is stored in Supabase `rooms` table.
  - P2P connections are managed by `src/hooks/use-game-room.ts` using Trystero.
  - Room passwords are verified client-side (current implementation) or via RLS policies.
  - Do NOT encode passwords in URLs.
- **State Management**:
  - Prefer local state (`useState`) or Context for global features (Auth).
  - Avoid complex state libraries (Redux/Zustand) unless necessary.

# Coding Guidelines
- **Simplicity**: Prefer simple, pragmatic solutions over complex architecture. Avoid over-engineering. YAGNI.
- **Principles**: Always try to follow KISS and DRY principles and React best practices.

# Developer Workflows
- **New UI Components**: Always check `src/components/ui` first. If missing, use `npx shadcn@latest add`.
- **Supabase**:
  - Client initialization in `src/lib/supabase.ts`.
  - SQL schema changes should be documented in `supabase/schema.sql`.
- **Environment Variables**:
  - Required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
  - Stored in `.env`.

# Specific Constraints
- **GitHub Pages**: The app is hosted on GitHub Pages, hence the strict requirement for `HashRouter`.
- **Trystero**: Use the `supabase` strategy for signaling. Do not introduce other signaling servers.
