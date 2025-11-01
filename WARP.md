# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Writecast is a terminal-style word game built as a Farcaster mini app using Next.js 14, TypeScript, Tailwind CSS, and Supabase. The project features two game modes (fill-in-blank and frame-the-word), Farcaster SDK integration for authentication and social features, and a CLI-based terminal interface aesthetic.

**Key Tech Stack:**
- **Framework:** Next.js 14 with App Router (ESM modules via `"type": "module"` in package.json)
- **Language:** TypeScript with strict mode enabled
- **Database:** Supabase (PostgreSQL) with comprehensive schema including triggers and views
- **Farcaster:** `@farcaster/miniapp-sdk` v0.2.1 for authentication, social sharing, and haptics
- **Styling:** Tailwind CSS v4 with Radix UI primitives and custom terminal theme
- **State:** React Context (`FarcasterContext`) + local state (no external state management)
- **Package Manager:** pnpm (required)

## Essential Commands

### Development
```bash
pnpm install           # Install dependencies
pnpm dev               # Start dev server on http://localhost:3001
pnpm build             # Build for production
pnpm start             # Start production server
pnpm lint              # Run ESLint
```

### Database Setup
```bash
pnpm db:setup          # Run setup-database.js script
pnpm db:fix            # Run fix-supabase-direct.js script
```

**Important:** Database schema must be initialized via Supabase SQL Editor by running these scripts in order:
1. `scripts/01-database-schema.sql` - Core schema with tables, indexes, triggers
2. `scripts/02-seed-demo-games.sql` - Demo game data (12 games)
3. `scripts/03-add-waitlist-table.sql` - Waitlist functionality

### Environment Setup
Required environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://writecast.vercel.app
```

## Architecture & Code Structure

### Application Flow
1. **Entry Point:** `app/layout.tsx` initializes FarcasterProvider, loads SDK readiness script
2. **Main UI:** `app/page.tsx` renders the CLI terminal interface
3. **Command Processing:** User input → `lib/command-parser.ts` → `lib/command-handler.ts` → Database actions
4. **Database Layer:** `lib/actions/` contains all Supabase queries (game-actions.ts, waitlist-actions.ts)
5. **Farcaster Integration:** `lib/farcaster/` handles SDK interactions (auth, haptics, social features)

### Key Directories

**`app/`** - Next.js App Router structure
- `layout.tsx` - Root layout with Farcaster SDK initialization script, metadata for mini app
- `page.tsx` - Main terminal interface page
- `play/[gameCode]/page.tsx` - Deep link pages for direct game access
- `api/` - API routes (if any)

**`lib/`** - Core business logic
- `command-handler.ts` - Main command dispatcher (300+ lines, handles all CLI commands)
- `command-parser.ts` - Parses raw input into command + args
- `game-state.ts` - TypeScript types for game state, mock game data constants
- `actions/` - Database operations (client-side and server-side versions)
  - `game-actions.ts` - All game-related database queries
  - `game-actions-client.ts` - Client-safe wrappers
  - `waitlist-actions.ts` - Waitlist functionality
- `farcaster/` - Farcaster SDK integration
  - `sdk-client.ts` - SDK initialization and availability checks
  - `auth.ts` - Authentication helpers
  - `haptics.ts` - Haptic feedback utilities
  - `types.ts` - TypeScript types for Farcaster data
- `supabase/` - Database clients
  - `client.ts` - Client-side Supabase instance
  - `server.ts` - Server-side Supabase instance (SSR)

**`components/`** - React components
- `cli-terminal.tsx` - Core terminal UI with typewriter effect
- `terminal-window.tsx` - Terminal container component
- `ready-signal.tsx` - Farcaster SDK ready signal component
- `ui/` - Radix UI component wrappers (shadcn/ui pattern)

**`contexts/`** - React Context providers
- `FarcasterContext.tsx` - Manages Farcaster authentication state, SDK methods (login, logout, share, haptics)

**`scripts/`** - Database setup scripts (SQL files)

**`docs/`** - Project documentation
- `database-schema.md` - Comprehensive database structure documentation
- `v1-farcaster-miniapp-plan.md` - Integration planning document
- `farcaster-*.md` - Guides, templates, troubleshooting

### Important Architectural Patterns

**1. Hybrid Authentication Model**
- Supports both Farcaster-authenticated users (`farcaster_${fid}`) and anonymous users (`anonymous_user`)
- Helper functions in `command-handler.ts`: `requiresAuth()`, `getCurrentUserId()`, `getCurrentUserInfo()`
- Guests can play games; authenticated users can create, share, and appear on leaderboards

**2. Game State Management**
- Central `GameState` interface in `lib/game-state.ts` with game modes, creation/playing steps
- State flows: idle → creating → writing → preview → (confirm to database)
- Playing state tracks: currentGameId, currentGame, attempts, guess

**3. Command Pattern**
- All terminal commands route through `handleCommand()` switch statement
- Each command has dedicated handler function (e.g., `handleCreate()`, `handleGuess()`, `handleShare()`)
- Commands add messages to terminal via `addMessage()` callback with typed `CliMessage` objects

**4. Database Layer Separation**
- Server actions (`game-actions.ts`) use `lib/supabase/server.ts` for SSR-safe queries
- Client wrappers (`game-actions-client.ts`) call server actions or use client instance
- All database operations return structured result objects (not raw Supabase responses)

**5. Farcaster SDK Lifecycle**
- Inline script in `layout.tsx` calls `sdk.actions.ready()` as soon as SDK loads (polling mechanism)
- `FarcasterContext` waits for SDK with timeout, polls for context, falls back gracefully if unavailable
- Never assumes Farcaster environment - always checks `isAvailable` flag

**6. Points System (Database-Driven)**
- Player points: 1st attempt = 20pts, 2nd = 10pts, 3rd = 5pts, fail = 0pts
- Author points: 5pts per failed player (incentivizes challenging games)
- Points calculated via database triggers and `submit_guess()` function in SQL schema

### Database Schema Summary

**Core Tables:**
- `users` - User profiles (Farcaster ID, username, stats, points)
- `games` - Game definitions (game_code, masterpiece_text, hidden_word, game_type)
- `game_attempts` - Individual guess records (up to 3 per player per game)
- `game_sessions` - Complete player sessions (status: in_progress, won, lost)
- `leaderboard_cache` - Pre-calculated leaderboard data for performance
- `waitlist` - Email/Farcaster signup for notifications
- `game_shares` - Social sharing tracking

**Key Functions:**
- `generate_game_code()` - Creates unique 6-char alphanumeric codes
- `create_game()` - Game creation with automatic code generation
- `submit_guess()` - Handles guess logic, session updates, points calculation

**Triggers:**
- Auto-update user stats when games complete
- Auto-update game stats (players, success rate, difficulty) when sessions complete

**Views:**
- `v_player_leaderboard` - Player rankings with stats
- `v_author_leaderboard` - Author rankings with stats
- `v_game_details` - Comprehensive game info with author details

## Development Workflows

### Creating a New Terminal Command

1. Add command parsing logic in `lib/command-parser.ts` (HELP_TEXT constant)
2. Add case to switch statement in `lib/command-handler.ts` `handleCommand()`
3. Create handler function (e.g., `handleMyCommand()`) following existing patterns
4. If database access needed, add action to `lib/actions/game-actions.ts`
5. Test command flow: input → parse → handler → database → UI feedback

### Adding Database Functionality

1. Write SQL in Supabase SQL Editor first to test queries
2. Add server action to `lib/actions/game-actions.ts` using `createClient()` from `lib/supabase/server.ts`
3. If client-side call needed, create wrapper in `lib/actions/game-actions-client.ts`
4. Import and use in command handler or component
5. Update `docs/database-schema.md` if schema changes

### Farcaster SDK Integration

**Testing:** Farcaster SDK only works in production Farcaster client (Warpcast app, etc.). For local dev:
- SDK availability check will fail gracefully
- Use mock data or skip Farcaster-specific features
- Deploy to Vercel for real testing in Farcaster

**Adding New SDK Action:**
1. Check SDK method in `@farcaster/miniapp-sdk` docs
2. Add wrapper to `lib/farcaster/sdk-client.ts` or create new helper file
3. Expose via `FarcasterContext` if state/auth needed
4. Handle errors gracefully (SDK may not be available)
5. Add terminal command handler to expose to users

### UI/Component Changes

- Terminal styling in `app/globals.css` with custom terminal color scheme (green text on dark background)
- Typewriter effect in `components/cli-terminal.tsx` via character-by-character rendering
- Radix UI components in `components/ui/` follow shadcn/ui pattern (import from `@/components/ui/...`)
- Use Tailwind classes; theme configured for terminal aesthetic
- Monospace font: Geist Mono (loaded in layout)

## Testing & Debugging

### Local Testing Checklist
1. Run `pnpm install` after pulling changes
2. Verify `.env.local` has correct Supabase credentials
3. Check Supabase project is active (not paused)
4. Test basic commands: `help`, `games`, `play ABC123`, `guess innovation`
5. Verify demo games load (should see 12 games from seed script)

### Common Issues

**"No games found" when running `games` command:**
- Re-run `scripts/02-seed-demo-games.sql` in Supabase SQL Editor
- Check Supabase connection in browser console for errors

**Farcaster authentication not working:**
- SDK only works in production Farcaster clients (not local browser)
- Check `isAvailable` flag in `FarcasterContext` state
- Deploy to Vercel and test in Warpcast for real SDK access

**Database queries failing:**
- Check browser console for Supabase errors
- Verify RLS policies in Supabase (currently disabled for public access)
- Test SQL directly in Supabase SQL Editor

**Port 3001 conflict:**
- Check for other Next.js projects running: `netstat -ano | findstr :3001` (Windows)
- Use `pnpm dev -p 3002` to run on different port
- Kill conflicting process: `taskkill /F /IM node.exe` (Windows)

### Debugging Tools
- Browser console for client-side logs
- `FarcasterContext` logs SDK initialization steps (search "FarcasterContext:" in console)
- Supabase dashboard logs for database errors
- Next.js build errors shown in terminal during `pnpm dev`

## Code Style & Conventions

**TypeScript:**
- Strict mode enabled (`tsconfig.json`)
- Use `type` for simple types, `interface` for objects
- Explicit return types on exported functions
- No `any` types - use proper typing or `unknown`

**Imports:**
- Use `@/` path alias (maps to project root)
- Import order: external packages → `@/` absolute imports → relative imports
- Group related imports together

**Naming:**
- Components: PascalCase (e.g., `CliTerminal`, `FarcasterContext`)
- Functions: camelCase (e.g., `handleCommand`, `getCurrentUserId`)
- Constants: UPPER_SNAKE_CASE (e.g., `HELP_TEXT`, `MOCK_GAMES`)
- Database tables: snake_case (e.g., `game_sessions`, `leaderboard_cache`)

**File Structure:**
- One main export per file
- Keep files focused (e.g., `game-actions.ts` only has database actions)
- Co-locate types with usage when possible
- Shared types in `lib/game-state.ts` or `lib/farcaster/types.ts`

**Async Patterns:**
- Use `async/await` (not `.then()` chains)
- Wrap database calls in try/catch
- Return structured results: `{ success: boolean, data?: T, error?: string }`
- Always handle errors gracefully with user-friendly terminal messages

## Deployment

**Vercel (Production):**
- Auto-deploys from `main` branch
- Environment variables set in Vercel dashboard
- Production URL: https://writecast.vercel.app (update in `.env.local` for local dev)
- Mini app manifest in `public/manifest.json`

**Assets Required for Farcaster:**
- `public/icon-512.png` - App icon (512x512px)
- `public/icon-192.png` - App icon (192x192px)
- `public/og-image.png` - Social preview (1200x630px) - optional but recommended
- See `FARCASTER_ASSETS_GUIDE.md` for detailed specs

## Additional Resources

- `README.md` - Full project overview, features, game modes
- `SETUP.md` - Step-by-step local setup guide
- `DEPLOYMENT.md` - Production deployment instructions
- `docs/database-schema.md` - Comprehensive database documentation
- `FARCASTER_MINIAPP_COMPLETE_GUIDE.md` - Farcaster integration deep dive
- `FARCASTER_QUICK_REFERENCE.md` - One-page SDK cheat sheet
- `docs/farcaster-troubleshooting.md` - Common Farcaster issues and solutions

## Design Philosophy

"Terminal First, Farcaster Enabled" - Authentic Mac OS CLI aesthetic with green terminal text, monospace font (Geist Mono), typewriter animations, command-line interaction only, no visual buttons/forms (except input field), haptic feedback for key events, mobile-optimized responsive terminal.
