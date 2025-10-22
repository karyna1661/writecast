/**
 * Database Verification Script
 * 
 * Tests all critical database functions to ensure they're working in production
 * Run with: node scripts/verify-database.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

async function verifyDatabase() {
  log('\n🔍 Database Verification Script', colors.blue)
  log('=' .repeat(60), colors.blue)

  // Get Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    log('❌ ERROR: Missing Supabase credentials in .env.local', colors.red)
    process.exit(1)
  }

  log('✅ Supabase credentials found', colors.green)
  log(`📍 URL: ${supabaseUrl}`, colors.reset)

  const supabase = createClient(supabaseUrl, supabaseKey)
  let testsPassed = 0
  let testsFailed = 0

  // Test 1: Check if get_available_games function exists
  log('\n📋 Test 1: Checking get_available_games function...', colors.blue)
  try {
    const { data, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'get_available_games')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (data) {
      log('   ✅ get_available_games function exists', colors.green)
      testsPassed++
    } else {
      log('   ❌ get_available_games function NOT FOUND', colors.red)
      log('   💡 Run migration: scripts/06-add-get-available-games-function.sql', colors.yellow)
      testsFailed++
    }
  } catch (error) {
    log(`   ❌ Error checking function: ${error.message}`, colors.red)
    testsFailed++
  }

  // Test 2: Check if expires_at column exists
  log('\n📋 Test 2: Checking expires_at column...', colors.blue)
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'games')
      .eq('column_name', 'expires_at')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (data) {
      log('   ✅ expires_at column exists', colors.green)
      testsPassed++
    } else {
      log('   ❌ expires_at column NOT FOUND', colors.red)
      log('   💡 Run migration: scripts/07-add-game-expiry.sql', colors.yellow)
      testsFailed++
    }
  } catch (error) {
    log(`   ❌ Error checking column: ${error.message}`, colors.red)
    testsFailed++
  }

  // Test 3: Check if game_invites table exists
  log('\n📋 Test 3: Checking game_invites table...', colors.blue)
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'game_invites')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (data) {
      log('   ✅ game_invites table exists', colors.green)
      testsPassed++
    } else {
      log('   ❌ game_invites table NOT FOUND', colors.red)
      log('   💡 Run migration: scripts/05-add-invite-system.sql', colors.yellow)
      testsFailed++
    }
  } catch (error) {
    log(`   ❌ Error checking table: ${error.message}`, colors.red)
    testsFailed++
  }

  // Test 4: Test get_available_games function
  log('\n📋 Test 4: Testing get_available_games function...', colors.blue)
  try {
    const { data, error } = await supabase.rpc('get_available_games', {
      p_player_id: 'test_player'
    })

    if (error) {
      log(`   ❌ Function error: ${error.message}`, colors.red)
      testsFailed++
    } else {
      log(`   ✅ Function works! Returned ${data?.length || 0} games`, colors.green)
      testsPassed++
    }
  } catch (error) {
    log(`   ❌ Error testing function: ${error.message}`, colors.red)
    testsFailed++
  }

  // Test 5: Check create_game function
  log('\n📋 Test 5: Checking create_game function...', colors.blue)
  try {
    const { data, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'create_game')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (data) {
      log('   ✅ create_game function exists', colors.green)
      testsPassed++
    } else {
      log('   ❌ create_game function NOT FOUND', colors.red)
      testsFailed++
    }
  } catch (error) {
    log(`   ❌ Error checking function: ${error.message}`, colors.red)
    testsFailed++
  }

  // Summary
  log('\n' + '=' .repeat(60), colors.blue)
  log('📊 Verification Summary:', colors.blue)
  log(`   ✅ Passed: ${testsPassed}`, colors.green)
  if (testsFailed > 0) {
    log(`   ❌ Failed: ${testsFailed}`, colors.red)
  }
  log('=' .repeat(60), colors.blue)

  if (testsFailed > 0) {
    log('\n⚠️  Some database functions are missing!', colors.yellow)
    log('Please run the missing migrations in Supabase SQL Editor:', colors.yellow)
    log('   1. Go to https://supabase.com/dashboard', colors.reset)
    log('   2. Select your project', colors.reset)
    log('   3. Go to SQL Editor', colors.reset)
    log('   4. Run the migration files mentioned above\n', colors.reset)
  } else {
    log('\n🎉 All database functions are working!', colors.green)
    log('Your database is ready for production.\n', colors.green)
  }

  return testsFailed === 0
}

// Run verification
verifyDatabase().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red)
  process.exit(1)
})
