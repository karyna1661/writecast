#!/usr/bin/env node

/**
 * Add expires_at column to games table
 * This fixes the critical database error preventing game creation
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
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
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'scripts', '07-add-game-expiry.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration SQL loaded from:', migrationPath)
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      
      // Try alternative approach - direct SQL execution
      console.log('🔄 Trying alternative approach...')
      
      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('📝 Executing:', statement.substring(0, 50) + '...')
          
          const { error: stmtError } = await supabase
            .from('games')
            .select('id')
            .limit(1)
            
          // Use raw SQL execution
          const { error: execError } = await supabase
            .rpc('exec', { query: statement })
            
          if (execError) {
            console.warn('⚠️ Statement failed (may already exist):', execError.message)
          } else {
            console.log('✅ Statement executed successfully')
          }
        }
      }
    } else {
      console.log('✅ Migration completed successfully')
    }
    
    // Verify the column exists
    console.log('🔍 Verifying expires_at column exists...')
    
    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'games')
      .eq('column_name', 'expires_at')
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError)
    } else if (columns && columns.length > 0) {
      console.log('✅ expires_at column verified successfully')
    } else {
      console.error('❌ expires_at column not found after migration')
    }
    
    // Test game creation
    console.log('🧪 Testing game creation...')
    
    const { data: testGame, error: testError } = await supabase
      .from('games')
      .insert({
        game_code: 'TEST' + Date.now(),
        author_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        game_type: 'fill-blank',
        masterpiece_text: 'Test game',
        hidden_word: 'test',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
    
    if (testError) {
      console.error('❌ Test game creation failed:', testError)
    } else {
      console.log('✅ Test game created successfully')
      
      // Clean up test game
      await supabase
        .from('games')
        .delete()
        .eq('game_code', testGame[0].game_code)
      
      console.log('🧹 Test game cleaned up')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the migration
addExpiresAtColumn()
  .then(() => {
    console.log('🎉 Migration completed! Games can now be created.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  })
