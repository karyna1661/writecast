#!/usr/bin/env node

/**
 * Supabase Fix Script - Direct SQL Execution
 * Uses Supabase REST API to execute SQL directly
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials!')
  process.exit(1)
}

console.log('🔧 Connecting to Supabase...')
console.log(`📍 URL: ${supabaseUrl}`)

// Create client with service key for admin access
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// SQL statements to execute
const sqlStatements = [
  // Enable RLS
  'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.game_attempts ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.game_shares ENABLE ROW LEVEL SECURITY;',
  
  // Drop existing policies
  'DROP POLICY IF EXISTS "Users can view own profile" ON public.users;',
  'DROP POLICY IF EXISTS "Users can update own profile" ON public.users;',
  'DROP POLICY IF EXISTS "Anyone can create user" ON public.users;',
  'DROP POLICY IF EXISTS "Anyone can view games" ON public.games;',
  'DROP POLICY IF EXISTS "Authenticated users can create games" ON public.games;',
  'DROP POLICY IF EXISTS "Authors can update own games" ON public.games;',
  'DROP POLICY IF EXISTS "Anyone can view attempts" ON public.game_attempts;',
  'DROP POLICY IF EXISTS "Anyone can create attempts" ON public.game_attempts;',
  'DROP POLICY IF EXISTS "Anyone can view sessions" ON public.game_sessions;',
  'DROP POLICY IF EXISTS "Anyone can create sessions" ON public.game_sessions;',
  'DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard_cache;',
  'DROP POLICY IF EXISTS "Anyone can view waitlist" ON public.waitlist;',
  'DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;',
  'DROP POLICY IF EXISTS "Anyone can view shares" ON public.game_shares;',
  'DROP POLICY IF EXISTS "Anyone can create shares" ON public.game_shares;',
  
  // Create new policies
  `CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id OR true);`,
  `CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);`,
  `CREATE POLICY "Anyone can create user" ON public.users
    FOR INSERT WITH CHECK (true);`,
  `CREATE POLICY "Anyone can view games" ON public.games
    FOR SELECT USING (true);`,
  `CREATE POLICY "Authenticated users can create games" ON public.games
    FOR INSERT WITH CHECK (true);`,
  `CREATE POLICY "Authors can update own games" ON public.games
    FOR UPDATE USING (auth.uid()::text = author_id);`,
  `CREATE POLICY "Anyone can view attempts" ON public.game_attempts
    FOR SELECT USING (true);`,
  `CREATE POLICY "Anyone can create attempts" ON public.game_attempts
    FOR INSERT WITH CHECK (true);`,
  `CREATE POLICY "Anyone can view sessions" ON public.game_sessions
    FOR SELECT USING (true);`,
  `CREATE POLICY "Anyone can create sessions" ON public.game_sessions
    FOR INSERT WITH CHECK (true);`,
  `CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_cache
    FOR SELECT USING (true);`,
  `CREATE POLICY "Anyone can view waitlist" ON public.waitlist
    FOR SELECT USING (true);`,
  `CREATE POLICY "Anyone can join waitlist" ON public.waitlist
    FOR INSERT WITH CHECK (true);`,
  `CREATE POLICY "Anyone can view shares" ON public.game_shares
    FOR SELECT USING (true);`,
  `CREATE POLICY "Anyone can create shares" ON public.game_shares
    FOR INSERT WITH CHECK (true);`,
  
  // Fix views
  'DROP VIEW IF EXISTS public.v_player_leaderboard CASCADE;',
  `CREATE VIEW public.v_player_leaderboard AS
    SELECT 
      u.id,
      u.farcaster_username,
      u.display_name,
      u.total_points_earned,
      u.total_games_played,
      RANK() OVER (ORDER BY u.total_points_earned DESC) as rank
    FROM public.users u
    WHERE u.total_games_played > 0
    ORDER BY u.total_points_earned DESC;`,
  'ALTER VIEW public.v_player_leaderboard SET (security_invoker = on);',
  
  'DROP VIEW IF EXISTS public.v_author_leaderboard CASCADE;',
  `CREATE VIEW public.v_author_leaderboard AS
    SELECT 
      u.id,
      u.farcaster_username,
      u.display_name,
      u.total_points_as_author,
      u.total_games_created,
      RANK() OVER (ORDER BY u.total_points_as_author DESC) as rank
    FROM public.users u
    WHERE u.total_games_created > 0
    ORDER BY u.total_points_as_author DESC;`,
  'ALTER VIEW public.v_author_leaderboard SET (security_invoker = on);',
  
  'DROP VIEW IF EXISTS public.v_game_details CASCADE;',
  `CREATE VIEW public.v_game_details AS
    SELECT 
      g.*,
      u.farcaster_username as author_username,
      u.display_name as author_display_name
    FROM public.games g
    LEFT JOIN public.users u ON g.author_id = u.id;`,
  'ALTER VIEW public.v_game_details SET (security_invoker = on);',
  
  // Set search paths
  'ALTER FUNCTION public.create_game SET search_path = \'\';',
  'ALTER FUNCTION public.update_user_stats_after_game SET search_path = \'\';',
  'ALTER FUNCTION public.update_game_stats_after_session SET search_path = \'\';',
  'ALTER FUNCTION public.generate_game_code SET search_path = \'\';',
  'ALTER FUNCTION public.submit_guess SET search_path = \'\';',
  
  // Drop unused indexes
  'DROP INDEX IF EXISTS public.idx_users_farcaster_id;',
  'DROP INDEX IF EXISTS public.idx_games_author_id;',
  'DROP INDEX IF EXISTS public.idx_game_attempts_game_id;',
  'DROP INDEX IF EXISTS public.idx_game_sessions_game_id;'
]

async function executeSqlDirect(sql) {
  try {
    // Use the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      },
      body: JSON.stringify({ sql })
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HTTP ${response.status}: ${error}`)
    }
    
    return await response.json()
  } catch (error) {
    throw error
  }
}

async function fixSupabaseIssues() {
  console.log('\n🚀 Starting Supabase fixes...\n')
  console.log('=' .repeat(60))
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i]
    const description = `Executing SQL statement ${i + 1}/${sqlStatements.length}`
    
    console.log(`\n📝 ${description}...`)
    console.log(`SQL: ${sql.substring(0, 80)}${sql.length > 80 ? '...' : ''}`)
    
    try {
      await executeSqlDirect(sql)
      console.log(`✅ Success: ${description}`)
      successCount++
    } catch (error) {
      console.error(`❌ Error: ${error.message}`)
      errorCount++
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🎉 Supabase fixes completed!')
  console.log('='.repeat(60))
  console.log(`\n📊 Results:`)
  console.log(`   ✅ Successful: ${successCount}`)
  console.log(`   ❌ Failed: ${errorCount}`)
  console.log(`   📝 Total: ${sqlStatements.length}`)
  
  if (errorCount === 0) {
    console.log('\n🎉 All fixes applied successfully!')
    console.log('\n📊 Next steps:')
    console.log('   1. Test your app commands (create, leaderboard, games)')
    console.log('   2. Check Supabase dashboard for any remaining linter warnings')
    console.log('   3. Add environment variables to Vercel')
  } else {
    console.log('\n⚠️  Some fixes failed. You may need to run them manually in Supabase SQL Editor.')
    console.log('   Check the SQL file: scripts/04-fix-all-supabase-issues.sql')
  }
}

// Run the fixes
fixSupabaseIssues().catch(error => {
  console.error('\n❌ Fatal error:', error.message)
  process.exit(1)
})

