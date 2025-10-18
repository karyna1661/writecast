# Farcaster Mini App Integration for Writecast (V1)

## Overview
Transform Writecast into a fully functional Farcaster mini app using the Farcaster SDK, while maintaining the beloved Mac OS CLI terminal aesthetic. The integration will be seamless - users will interact through terminal commands that trigger Farcaster SDK actions under the hood.

## Design Philosophy
**"Terminal First, Farcaster Enabled"**
- All Farcaster actions triggered via CLI commands
- No breaking of the terminal aesthetic
- SDK actions integrated into existing command flow
- Native Farcaster features feel like terminal utilities

## SDK Integration Strategy

### 1. Authentication & User Management

**Terminal Integration:**
```bash
> login              # Triggers sdk.actions.signIn
> auth               # Gets token via sdk.quickAuth.getToken
> profile @username  # Views profile via sdk.actions.viewProfile
```

**Implementation:**
- Replace `demo_player` and `demo_author` with real Farcaster users
- Store Farcaster ID, username, and display name from authentication
- Show login status in terminal header or prompt
- Seamless auth flow that feels like SSH login

### 2. Game Sharing & Social Features

**Terminal Integration:**
```bash
> share ABC123      # Composes cast with game code via sdk.actions.composeCast
> invite @friend    # Opens mini app for friend via sdk.actions.openMiniApp
> open-writecast    # Opens main app at writecast.vercel.app
```

**Implementation:**
- `share` command: Creates a cast with game code and play link
- Pre-filled cast text: "I just created a word game on Writecast! Can you guess my hidden word? Play: [game_code]"
- Direct link to play the specific game
- Track shares in game_shares table

### 3. Navigation & Deep Linking

**Terminal Integration:**
```bash
> open https://...  # Opens URL via sdk.actions.openUrl
> home              # Opens main Writecast mini app
> install           # Adds mini app via sdk.actions.addMiniApp
```

**Implementation:**
- Seamless navigation without leaving terminal experience
- Deep links to specific games: `writecast.vercel.app/play/ABC123`
- Share links open directly in mini app context

### 4. Enhanced UX Features

**Terminal Integration:**
- Haptic feedback on key terminal events via `sdk.haptics`:
  - Correct guess: success vibration
  - Wrong guess: error vibration
  - Game created: notification vibration
  - Command executed: light tap
  
**Primary Button Integration:**
```bash
When playing: Button shows "Submit Guess"
When creating: Button shows "Publish Game"
When idle: Button shows "Create Game" or "Browse Games"
```

**Implementation:**
- `sdk.actions.setPrimaryButton` updates based on game state
- Button triggers relevant terminal command
- Feels like a quick-action shortcut

### 5. Chain Integration (Future)

**Terminal Integration:**
```bash
> chains            # Shows available chains via sdk.getChains
> mint-nft          # Future: Mint game results as NFT
```

## Technical Implementation Plan

### Phase 1: Setup Farcaster SDK
1. Install `@farcaster/frame-sdk` package
2. Initialize SDK in app layout
3. Create Farcaster context provider
4. Add environment variables for Farcaster app config

### Phase 2: Authentication Flow
1. Replace demo users with real Farcaster authentication
2. Add `login` and `auth` commands
3. Update user creation to use Farcaster IDs
4. Show logged-in user in terminal prompt (e.g., `user@writecast:~$`)

### Phase 3: Social Features
1. Implement `share` command with composeCast
2. Add `invite` command with openMiniApp
3. Create shareable game URLs
4. Track social interactions in database

### Phase 4: Enhanced UX
1. Add haptic feedback to key interactions
2. Implement primary button that updates with context
3. Add `profile` command for viewing Farcaster profiles
4. Integrate deep linking for game codes

### Phase 5: Deployment & Polish
1. Deploy to Vercel (writecast.vercel.app)
2. Configure Farcaster mini app manifest
3. Add Frame metadata for social sharing
4. Test in Farcaster Warpcast client

## Preserving Terminal Aesthetic

### Visual Design Rules:
- ✅ Keep monospace font and green terminal text
- ✅ Maintain command-line interface
- ✅ All actions via typed commands
- ✅ Terminal header shows Farcaster user
- ✅ Haptics enhance but don't distract
- ✅ Primary button styled as terminal action

### Command Design:
- Short, unix-like commands (`share`, `login`, `auth`)
- Clear output messages
- Progress indicators in terminal style
- Error messages formatted as terminal errors

### Example User Flow:
```bash
> login
[Farcaster SDK] Authenticating...
✓ Logged in as @username (FID: 12345)

> create innovation
Hidden word set to: "innovation"
Now write your masterpiece using: write <your text here>

> write The future depends on innovation and creativity
Masterpiece saved! (45 characters)
Type 'preview' to see how it looks, or 'confirm' to publish.

> confirm
Creating game...
✓ Game published! (Game ID: XYZ890)

Share this game with your network?
> share XYZ890
[Composing cast...]
✓ Cast composed! Ready to share with Farcaster.
```

## Files to Create/Modify

### New Files:
- `lib/farcaster/sdk-client.ts` - SDK initialization
- `lib/farcaster/auth.ts` - Authentication helpers
- `lib/farcaster/actions.ts` - SDK action wrappers
- `hooks/use-farcaster.ts` - React hook for SDK
- `app/api/farcaster/route.ts` - API routes for Farcaster

### Modified Files:
- `lib/command-handler.ts` - Add new Farcaster commands
- `lib/command-parser.ts` - Parse new commands
- `lib/actions/game-actions.ts` - Use real Farcaster users
- `components/terminal-header.tsx` - Show Farcaster user
- `app/layout.tsx` - Initialize Farcaster SDK
- `package.json` - Add Farcaster SDK dependency

## Deployment Configuration

### Environment Variables:
```env
NEXT_PUBLIC_FARCASTER_APP_ID=your-app-id
NEXT_PUBLIC_APP_URL=https://writecast.vercel.app
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Vercel Configuration:
- Domain: writecast.vercel.app
- Frame metadata for social sharing
- Deep link routing: /play/[gameCode]
- API routes for Farcaster webhooks

## Success Criteria

✅ Users can authenticate with Farcaster
✅ Terminal aesthetic completely preserved
✅ Share games directly to Farcaster
✅ Haptic feedback on key actions
✅ Deep linking to specific games works
✅ Primary button updates contextually
✅ Deployed and accessible on Farcaster
✅ All existing terminal commands still work

## Next Steps After V1

Once mini app is live, we can discuss:
- Version 2 features (staking mechanism)
- Additional Farcaster integrations
- Monetization via chains/NFTs
- Tournament/leaderboard features
- Creator rewards and tokenomics

