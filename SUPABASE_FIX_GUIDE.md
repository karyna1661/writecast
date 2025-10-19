# Supabase Issues Fix Guide

## Quick Fix (Recommended)

1. **Go to your Supabase dashboard**: https://supabase.com/dashboard
2. **Navigate to**: SQL Editor (left sidebar)
3. **Copy and paste** the contents of `scripts/04-fix-all-supabase-issues.sql`
4. **Click "Run"** to execute all fixes at once

This will fix ALL the linter issues in one go:
- ✅ Enable RLS on all tables
- ✅ Create RLS policies
- ✅ Fix security definer views
- ✅ Set immutable search paths
- ✅ Drop unused indexes

## What Gets Fixed

### 1. Row Level Security (RLS)
- Enables RLS on: users, games, game_attempts, game_sessions, leaderboard_cache, waitlist, game_shares
- Creates policies that allow:
  - Anyone to view and create games
  - Users to update their own profiles
  - Public read access to leaderboards

### 2. Security Definer Views
- Fixes v_player_leaderboard
- Fixes v_author_leaderboard  
- Fixes v_game_details
- Changes from SECURITY DEFINER to SECURITY INVOKER

### 3. Function Search Paths
- Makes search paths immutable on:
  - create_game
  - update_user_stats_after_game
  - update_game_stats_after_session
  - generate_game_code
  - submit_guess

### 4. Unused Indexes
- Drops unused indexes to improve write performance

## After Running the Script

1. **Verify in Supabase Dashboard**:
   - Go to Database > Advisors
   - Check that all errors are resolved

2. **Test Your App**:
   ```bash
   # Try these commands in your app:
   create wisdom
   leaderboard
   games
   ```

3. **Add Environment Variables to Vercel**:
   - Go to your Vercel project settings
   - Add these variables:
     - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your anon key

## Troubleshooting

If you get errors when running the SQL:

1. **"function does not exist"**: The function might not be created yet. Run `scripts/01-database-schema.sql` first.

2. **"table does not exist"**: Run the database setup scripts in order:
   ```bash
   # In Supabase SQL Editor, run these in order:
   scripts/01-database-schema.sql
   scripts/02-seed-demo-games.sql
   scripts/03-add-waitlist-table.sql
   scripts/04-fix-all-supabase-issues.sql
   ```

3. **"policy already exists"**: The script includes `DROP POLICY IF EXISTS` so this shouldn't happen. If it does, manually drop the policy first.

## Security Notes

- The RLS policies allow public read access for games and leaderboards (needed for the app to work)
- User profiles can only be updated by their owners
- All write operations are logged and can be audited
- The service key should never be exposed to the frontend

## Next Steps

After fixing these issues:
1. Deploy your app to Vercel
2. Add the Supabase environment variables
3. Test all commands (create, play, leaderboard)
4. Monitor the Supabase dashboard for any new issues
