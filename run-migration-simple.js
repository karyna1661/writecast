#!/usr/bin/env node

/**
 * Simple Migration Runner
 * Executes SQL directly using Supabase client
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!')
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
    
    // Execute the entire migration as one SQL block
    const { data, error } = await supabase.rpc('exec', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      
      // Try alternative approach - execute via REST API
      console.log('🔄 Trying alternative approach...')
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: migrationSQL })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Alternative approach failed:', errorText)
        console.log('')
        console.log('💡 Manual approach:')
        console.log('1. Go to your Supabase Dashboard')
        console.log('2. Navigate to SQL Editor')
        console.log('3. Copy the contents of scripts/05-add-invite-system.sql')
        console.log('4. Paste and run the migration')
        process.exit(1)
      }
      
      console.log('✅ Migration completed via REST API!')
    } else {
      console.log('✅ Migration completed successfully!')
    }
    
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
    console.log('')
    console.log('💡 Manual approach:')
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy the contents of scripts/05-add-invite-system.sql')
    console.log('4. Paste and run the migration')
  }
}

runMigration()
