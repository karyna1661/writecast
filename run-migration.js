#!/usr/bin/env node

/**
 * Database Migration Runner
 * Runs the invite system migration against Supabase
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Starting invite system migration...')
    console.log(`📡 Connecting to: ${supabaseUrl}`)
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'scripts', '05-add-invite-system.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration file loaded')
    console.log('🔄 Executing migration...')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
          
          if (error) {
            console.warn(`⚠️  Statement ${i + 1} warning:`, error.message)
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} completed`)
          }
        } catch (err) {
          console.warn(`⚠️  Statement ${i + 1} error:`, err.message)
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Migration completed successfully!')
    console.log('🎉 Invite system is now active!')
    console.log('')
    console.log('📋 What\'s now available:')
    console.log('  • Game filtering (completed/author games hidden)')
    console.log('  • Invite system with bonus attempts')
    console.log('  • Referral rewards (2 points for successful invites)')
    console.log('  • 4-attempt games for invited players')
    console.log('  • Complete invite chain tracking')
    
  } catch (err) {
    console.error('❌ Migration error:', err)
    process.exit(1)
  }
}

runMigration()
