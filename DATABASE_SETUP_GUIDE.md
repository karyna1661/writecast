# Database Setup Instructions

## Quick Setup (Recommended)

1. **Get your Supabase credentials:**
   - Go to [supabase.com](https://supabase.com) and sign in
   - Create a new project or use existing one
   - Go to Project Settings > API
   - Copy your Project URL and API keys

2. **Create .env.local file:**
   ```bash
   # Copy the template
   cp SUPABASE_SETUP.md .env.local
   
   # Edit with your actual values
   nano .env.local  # or use your preferred editor
   ```

3. **Set up the database:**
   ```bash
   # Install dependencies (if not already done)
   npm install
   
   # Run the setup script
   node scripts/setup-database.js
   ```

4. **Add to Vercel:**
   - Go to your Vercel project settings
   - Add Environment Variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (optional, for admin operations)

## Manual Setup (Alternative)

If the script doesn't work, you can run the SQL files manually in your Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each file in order:
   - `scripts/01-database-schema.sql`
   - `scripts/02-seed-demo-games.sql`
   - `scripts/03-add-waitlist-table.sql`

## Testing

Once setup is complete, test these commands in your app:
- `create wisdom` - Should create a game
- `leaderboard` - Should show top players
- `games` - Should list available games
- `play ABC123` - Should work with demo games

## Troubleshooting

If you get "Database connection failed" errors:
1. Check your environment variables are correct
2. Ensure your Supabase project is active
3. Verify the service key has admin permissions
4. Check Vercel environment variables are set

## Security Notes

- Never commit `.env.local` to git
- The service key has admin access - keep it secret
- Use the anon key for client-side operations
- Use the service key only for server-side admin operations
