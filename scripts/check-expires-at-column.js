#!/usr/bin/env node

/**
 * Add expires_at column to games table - Simple approach
 * This fixes the critical database error preventing game creation
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addExpiresAtColumn() {
  console.log('🔧 Adding expires_at column to games table...')
  
  try {
    // First, let's check if the column already exists by trying to query it
    console.log('🔍 Checking if expires_at column already exists...')
    
    const { data: existingGames, error: checkError } = await supabase
      .from('games')
      .select('id, expires_at')
      .limit(1)
    
    if (!checkError) {
      console.log('✅ expires_at column already exists!')
      console.log('📊 Sample data:', existingGames)
      return
    }
    
    if (checkError.code === 'PGRST204') {
      console.log('❌ expires_at column does not exist, need to add it')
      console.log('💡 This requires manual database migration via Supabase dashboard')
      console.log('')
      console.log('📋 Manual steps:')
      console.log('1. Go to your Supabase project dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Run this SQL:')
      console.log('')
      console.log('ALTER TABLE games ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;')
      console.log('UPDATE games SET expires_at = created_at + INTERVAL \'24 hours\' WHERE expires_at IS NULL;')
      console.log('')
      console.log('4. Then run this script again to verify')
      
      process.exit(1)
    } else {
      console.error('❌ Unexpected error checking column:', checkError)
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the check
addExpiresAtColumn()
  .then(() => {
    console.log('🎉 Column check completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Check failed:', error)
    process.exit(1)
  })
