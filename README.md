# Writecast 🎮

**A terminal-style word game built as a Farcaster mini app**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://writecast.vercel.app)
[![Farcaster Mini App](https://img.shields.io/badge/Farcaster-Mini%20App-8B5CF6?style=for-the-badge)](https://farcaster.xyz)

---

## 🎯 Overview

Writecast is a unique word game that combines the nostalgic charm of terminal interfaces with modern social gaming on Farcaster. Players interact through typed commands to create and play word games, earning points and competing on leaderboards.

### ✨ Key Features

- **🖥️ Authentic Terminal Experience** - Mac OS CLI aesthetic with typewriter animations
- **🎮 Two Game Modes** - Fill-in-blank and Frame-the-word gameplay
- **🔗 Farcaster Integration** - Sign in, share games, and invite friends
- **📊 Leaderboards** - Compete with players and authors globally
- **📱 Mobile Optimized** - Responsive terminal that works on all devices
- **🎯 Deep Linking** - Direct game access via shareable URLs
- **📳 Haptic Feedback** - Tactile responses for key actions

---

## 🎮 Game Modes

### Fill-in-Blank Mode
Authors hide a word in their text, and players see blanks (`___`) where they need to guess the hidden word.

**Example:**
```
Text: "The future depends on ___"
Answer: "innovation"
```

### Frame-the-Word Mode
Authors write a piece and set a keyword that "frames" or defines it. Players read the text and guess the framing word.

**Example:**
```
Text: "A beautiful sunset over the mountains"
Framing word: "serenity"
```

---

## 💻 Terminal Commands

### Game Creation
```bash
create <word>       # Start fill-in-blank game
frame               # Start frame-the-word game
write <text>        # Write your masterpiece
keyword <word>      # Set framing word (frame mode only)
preview             # Preview your game
confirm             # Publish the game
```

### Gameplay
```bash
games               # List all available games
play <gameCode>     # Start playing a game
guess <word>        # Submit your guess
reveal <gameCode>   # View game statistics
leaderboard         # View top players and authors
```

### Farcaster Integration
```bash
login               # Authenticate with Farcaster
whoami              # View current user info
logout              # Sign out
share <gameCode>    # Share game to Farcaster
invite @username    # Invite a friend
profile @username   # View Farcaster profile
```

### Utility Commands
```bash
help                # Show all commands
clear               # Clear terminal
menu                # Return to main menu
notify <email>      # Join waitlist
```

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom terminal theme
- **UI Components:** Radix UI primitives
- **State Management:** React Context + useState

### Backend & Database
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Hybrid (Farcaster + anonymous users)
- **API:** Next.js API routes

### Farcaster Integration
- **SDK:** `@farcaster/miniapp-sdk` v0.2.1
- **Features:** Authentication, social sharing, haptics, deep linking

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- pnpm package manager
- Supabase account (free tier works fine)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd writecast-1
   pnpm install
   ```

2. **Set up Supabase database:**
   - Create a new Supabase project
   - Run the SQL scripts in order:
     - `scripts/01-database-schema.sql`
     - `scripts/02-seed-demo-games.sql`
     - `scripts/03-add-waitlist-table.sql`

3. **Configure environment variables:**
   ```bash
   # Create .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_APP_URL=https://writecast.vercel.app
   ```

4. **Start development server:**
   ```bash
   pnpm dev
   ```

5. **Open in browser:**
   ```
   http://localhost:3001
   ```

### Demo Games
After setup, try these demo games:
- `play ABC123` (hidden word: "innovation")
- `play XYZ789` (hidden word: "serendipity")
- `play FRAME1` (framing word: "resilience")

---

## 📊 Points System

### Player Points
- **First attempt correct:** 20 points (15 + 5 bonus)
- **Second attempt correct:** 10 points
- **Third attempt correct:** 5 points
- **Failed (3 wrong attempts):** 0 points

### Author Points
- **5 points per failed player**
- Incentivizes creating challenging but fair games

---

## 🗂️ Project Structure

```
writecast-1/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main terminal interface
│   ├── layout.tsx          # Root layout with Farcaster provider
│   ├── play/[gameCode]/    # Deep link game pages
│   └── api/                # API routes
├── components/             # React components
│   ├── cli-terminal.tsx    # Terminal UI with typewriter effect
│   ├── terminal-window.tsx # Terminal container
│   └── ...                 # Other terminal components
├── lib/                    # Core logic
│   ├── command-handler.ts  # Command processing
│   ├── farcaster/          # Farcaster SDK integration
│   ├── actions/            # Database operations
│   └── supabase/           # Database client
├── contexts/               # React contexts
│   └── FarcasterContext.tsx
├── scripts/                # Database setup scripts
└── docs/                   # Documentation
```

---

## 🔗 Farcaster Integration

### Features Implemented
- ✅ **Authentication:** Sign in with Farcaster ID
- ✅ **Social Sharing:** Compose casts with game links
- ✅ **Profile Viewing:** View Farcaster user profiles
- ✅ **Haptic Feedback:** Success/error vibrations
- ✅ **Deep Links:** Direct game access via URLs
- ✅ **Mini App Manifest:** PWA installation support

### SDK Actions
- `signIn()` - User authentication
- `composeCast()` - Share games to Farcaster
- `openMiniApp()` - Invite users
- `viewProfile()` - View user profiles
- `haptics.notification()` - Feedback on actions

---

## 📱 Deployment

### Vercel Deployment
The app is configured for automatic deployment on Vercel:

- **Live URL:** [https://writecast.vercel.app](https://writecast.vercel.app)
- **Auto-deploy:** Push to main branch triggers deployment
- **Environment:** Production environment variables configured

### Required Assets
For optimal social sharing, create these assets:
- `public/og-image.png` (1200x630px) - Social preview
- `public/icon-192.png` (192x192px) - App icon
- `public/icon-512.png` (512x512px) - App icon

See [FARCASTER_ASSETS_GUIDE.md](./FARCASTER_ASSETS_GUIDE.md) for detailed asset requirements.

---

## 📚 Documentation

### 🎯 Core Documentation
- **[SETUP.md](./SETUP.md)** - Detailed local setup instructions
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[docs/database-schema.md](./docs/database-schema.md)** - Database structure
- **[docs/v1-farcaster-miniapp-plan.md](./docs/v1-farcaster-miniapp-plan.md)** - Integration plan

### 🚀 Farcaster Mini App Guides
- **[Complete Guide](FARCASTER_MINIAPP_COMPLETE_GUIDE.md)** - Comprehensive Farcaster Mini App development guide
- **[Quick Reference](FARCASTER_QUICK_REFERENCE.md)** - One-page cheat sheet for quick setup
- **[Troubleshooting](docs/farcaster-troubleshooting.md)** - Common issues and solutions
- **[Code Templates](docs/farcaster-code-templates.md)** - Copy-paste ready code templates
- **[OG Image Fix](OG_IMAGE_FIX.md)** - Instructions for fixing preview image issues
- **[FARCASTER_ASSETS_GUIDE.md](./FARCASTER_ASSETS_GUIDE.md)** - Asset creation guide

---

## 🎯 Design Philosophy

**"Terminal First, Farcaster Enabled"**

- Authentic Mac OS CLI aesthetic
- Green terminal text on dark background
- Monospace font (Geist Mono)
- Typewriter text animation
- Command-line interaction only
- No visual buttons or forms (except input)
- Haptic feedback for key events
- Mobile-optimized responsive terminal

---

## 🚧 Development Status

### ✅ Completed (V1)
- Core game mechanics (both modes)
- Terminal UI with animations
- Farcaster SDK integration
- Database schema and operations
- Leaderboard system
- Waitlist functionality
- Deep linking support
- PWA manifest
- Vercel deployment

### 🔄 In Progress
- Asset creation (PNG versions)
- Production testing
- Farcaster client testing

### 🎯 Future (V2)
- Staking mechanism
- NFT minting for game results
- Tournament/challenge features
- Creator rewards/tokenomics
- Chain integration (Base, Optimism)
- Enhanced social features

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- Deployed on [Vercel](https://vercel.com/)
- Integrated with [Farcaster](https://farcaster.xyz/)
- UI components from [Radix UI](https://www.radix-ui.com/)

---

**Ready to play?** Visit [writecast.vercel.app](https://writecast.vercel.app) and start your terminal adventure! 🎮