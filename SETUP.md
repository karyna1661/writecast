# Writecast Setup Guide

This guide will help you set up Writecast locally so you can test the terminal-based word game in your browser.

## Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** package manager
- **Supabase account** (free tier works fine)

## Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
pnpm install
```

## Step 2: Set Up Supabase Database

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `writecast-local` (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

### 2.2 Run Database Setup Scripts

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Run these scripts **in order**:

#### Script 1: Database Schema
Copy and paste the entire contents of `scripts/01-database-schema.sql` into the SQL Editor and click "Run".

#### Script 2: Demo Games
Copy and paste the entire contents of `scripts/02-seed-demo-games.sql` into the SQL Editor and click "Run".

#### Script 3: Waitlist Table
Copy and paste the entire contents of `scripts/03-add-waitlist-table.sql` into the SQL Editor and click "Run".

### 2.3 Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

## Step 3: Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Start the Development Server

Run this command in your terminal:

```bash
pnpm dev
```

You should see output like:
```
▲ Next.js 14.2.16
- Local:        http://localhost:3001
- ready in 2.3s
```

## Step 5: Test in Browser

1. Open your browser and go to `http://localhost:3001`
2. You should see a terminal interface with a welcome message
3. Try these commands to test the app:

### Basic Commands
```bash
help                    # See all available commands
games                   # List all demo games (should show 12 games)
clear                   # Clear the terminal
```

### Playing Games
```bash
play ABC123            # Play a fill-in-blank game
guess innovation       # Make a guess (this should be correct!)
play XYZ789            # Try another game
guess serendipity      # Another correct guess
```

### Creating Games
```bash
create myword          # Start creating a fill-in-blank game
write This is a test with myword in it
preview                # See how it looks
confirm                # Publish the game

frame                  # Start a frame-the-word game
write A beautiful sunset over the mountains
keyword serenity       # Set the framing word
preview                # Preview the game
confirm                # Publish it
```

### Other Features
```bash
leaderboard            # View top players and authors
reveal ABC123          # See game statistics
notify user@test.com   # Join the waitlist
```

## Expected Demo Games

After running the seed script, you should have these games available:

**Fill-in-Blank Games:**
- `ABC123` - Hidden word: "innovation"
- `XYZ789` - Hidden word: "serendipity" 
- `TECH42` - Hidden word: "blockchain"
- `WORD99` - Hidden word: "metamorphosis"
- `POET88` - Hidden word: "ephemeral"
- `SAGE77` - Hidden word: "wisdom"

**Frame-the-Word Games:**
- `FRAME1` - Framing word: "resilience"
- `FRAME2` - Framing word: "courage"
- `FRAME3` - Framing word: "solitude"
- `FRAME4` - Framing word: "nostalgia"
- `FRAME5` - Framing word: "ambition"
- `FRAME6` - Framing word: "melancholy"

## Troubleshooting

### Database Connection Issues
- Verify your `.env.local` file has the correct Supabase URL and key
- Make sure you ran all three SQL scripts in order
- Check that your Supabase project is active (not paused)

### Games Not Loading
- Run `games` command - if it shows "No games found", the seed script didn't run properly
- Re-run `scripts/02-seed-demo-games.sql` in Supabase SQL Editor

### Command Not Working
- Type `help` to see all available commands
- Make sure you're typing commands exactly as shown (case-sensitive)
- Some commands require you to be in the right game state (e.g., `guess` only works when playing a game)

### Port Conflicts
If you get "port already in use" errors or see a different project at `http://localhost:3001`:

**Option 1: Use a different port**
```bash
pnpm dev -p 3002    # Run on port 3002
pnpm dev -p 3003    # Run on port 3003
```

**Option 2: Stop conflicting processes**
```bash
# Find what's using the port
netstat -ano | findstr :3001

# Kill all node processes (Windows)
taskkill /F /IM node.exe

# Then restart Writecast
pnpm dev -p 3001
```

**Option 3: Check for other projects**
- Look for other terminal windows running `npm dev` or `pnpm dev`
- Close other development servers before starting Writecast

## What You Can Do

Once set up, you can:
- ✅ Play all 12 demo games
- ✅ Create your own games in both modes
- ✅ View leaderboards and statistics
- ✅ Join the waitlist
- ✅ Test the complete game flow

The app is fully functional with a real database backend!

## Next Steps

After testing locally, you can:
- Deploy to Vercel for a live demo
- Add real Farcaster authentication
- Customize the terminal styling
- Add more game features

Enjoy testing Writecast! 🎮
