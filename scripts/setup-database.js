#!/usr/bin/env node

/**
 * Supabase Database Setup Script
 * 
 * This script will set up your Supabase database with all the required tables,
 * indexes, and Row Level Security policies for the Writecast mini app.
 * 
 * Usage:
 * 1. Fill in your Supabase credentials in .env.local
 * 2. Run: node scripts/setup-database.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function setupDatabase() {
  console.log('🚀 Setting up Writecast database...')
  
  try {
    // Read and execute SQL scripts
    const scripts = [
      '01-database-schema.sql',
      '02-seed-demo-games.sql', 
      '03-add-waitlist-table.sql'
    ]
    
    for (const script of scripts) {
      console.log(`📄 Executing ${script}...`)
      const sql = readFileSync(join(process.cwd(), 'scripts', script), 'utf8')
      
      const { error } = await supabase.rpc('exec_sql', { sql })
      if (error) {
        console.error(`❌ Error executing ${script}:`, error.message)
        // Continue with other scripts
      } else {
        console.log(`✅ ${script} executed successfully`)
      }
    }
    
    console.log('🎉 Database setup complete!')
    console.log('📊 You can now test your commands:')
    console.log('   - create wisdom')
    console.log('   - leaderboard')
    console.log('   - games')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

// Run the setup
setupDatabase()
