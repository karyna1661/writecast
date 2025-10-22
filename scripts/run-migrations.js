/**
 * Supabase Migration Runner
 * 
 * This script reads SQL migration files and executes them against your Supabase database
 * using the connection credentials from .env.local
 * 
 * Usage: node scripts/run-migrations.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

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

async function runMigrations() {
  // Get Supabase credentials from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    log('❌ ERROR: Missing Supabase credentials in .env.local', colors.red)
    log('Please ensure you have:', colors.yellow)
    log('  - NEXT_PUBLIC_SUPABASE_URL', colors.yellow)
    log('  - SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)', colors.yellow)
    process.exit(1)
  }

  log('\n🚀 Starting Supabase Migration Runner', colors.blue)
  log('=' .repeat(60), colors.blue)

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // List of migration files to run (in order)
  const migrations = [
    '06-add-get-available-games-function.sql',
    '07-add-game-expiry.sql',
  ]

  let successCount = 0
  let failCount = 0

  for (const migrationFile of migrations) {
    const filePath = path.join(__dirname, migrationFile)
    
    log(`\n📄 Running migration: ${migrationFile}`, colors.blue)
    
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        log(`   ⚠️  File not found: ${filePath}`, colors.yellow)
        failCount++
        continue
      }

      // Read SQL file
      const sql = fs.readFileSync(filePath, 'utf8')
      
      log('   📖 Reading SQL file...', colors.reset)
      log(`   📊 File size: ${sql.length} characters`, colors.reset)

      // Execute SQL using Supabase RPC
      // Note: For complex migrations, we use the raw SQL execution
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
        // If exec_sql doesn't exist, try direct execution via postgrest
        // Split SQL into individual statements
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'))

        for (const statement of statements) {
          if (statement.length === 0) continue
          
          // For DDL/function creation, we need to use the raw query method
          const result = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ query: statement })
          })

          if (!result.ok) {
            throw new Error(`Failed to execute statement: ${await result.text()}`)
          }
        }

        return { data: true, error: null }
      })

      if (error) {
        log(`   ❌ Migration failed: ${error.message}`, colors.red)
        log(`   💡 Tip: You may need to run this migration manually in Supabase SQL Editor`, colors.yellow)
        failCount++
        continue
      }

      log(`   ✅ Migration completed successfully!`, colors.green)
      successCount++

    } catch (error) {
      log(`   ❌ Error: ${error.message}`, colors.red)
      log(`   💡 Tip: Try running this migration manually in Supabase SQL Editor`, colors.yellow)
      failCount++
    }
  }

  // Summary
  log('\n' + '=' .repeat(60), colors.blue)
  log('📊 Migration Summary:', colors.blue)
  log(`   ✅ Successful: ${successCount}`, colors.green)
  if (failCount > 0) {
    log(`   ❌ Failed: ${failCount}`, colors.red)
  }
  log('=' .repeat(60), colors.blue)

  if (failCount > 0) {
    log('\n⚠️  Some migrations failed!', colors.yellow)
    log('Please run the failed migrations manually in Supabase SQL Editor:', colors.yellow)
    log('   1. Go to https://supabase.com/dashboard', colors.reset)
    log('   2. Select your project', colors.reset)
    log('   3. Go to SQL Editor', colors.reset)
    log('   4. Copy and paste the SQL from the failed migration files', colors.reset)
    log('   5. Click "Run"\n', colors.reset)
  } else {
    log('\n🎉 All migrations completed successfully!', colors.green)
    log('Your database is now up to date.\n', colors.green)
  }
}

// Run migrations
runMigrations().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red)
  process.exit(1)
})

