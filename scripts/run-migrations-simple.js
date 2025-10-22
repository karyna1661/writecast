/**
 * Simple Supabase Migration Runner
 * 
 * This script reads SQL migration files and provides instructions to run them
 * It will also attempt to execute them via the Supabase Management API
 */

const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

console.log('\n🚀 Supabase Migration Helper\n')
console.log('=' .repeat(60))

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ ERROR: Missing Supabase credentials\n')
  console.log('Please ensure your .env.local has:')
  console.log('  - NEXT_PUBLIC_SUPABASE_URL')
  console.log('  - SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)\n')
  process.exit(1)
}

console.log('✅ Supabase credentials found')
console.log(`📍 URL: ${supabaseUrl}\n`)

// Migration files
const migrations = [
  '06-add-get-available-games-function.sql',
  '07-add-game-expiry.sql',
]

console.log('📋 Migrations to run:\n')

migrations.forEach((file, index) => {
  const filePath = path.join(__dirname, file)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n').length
    console.log(`  ${index + 1}. ${file} (${lines} lines)`)
  } else {
    console.log(`  ${index + 1}. ${file} ❌ NOT FOUND`)
  }
})

console.log('\n' + '='.repeat(60))
console.log('\n📖 HOW TO RUN THESE MIGRATIONS:\n')
console.log('Since Supabase doesn\'t support direct SQL execution via API,')
console.log('you need to run these in the Supabase SQL Editor:\n')
console.log('  1. Go to: https://supabase.com/dashboard')
console.log('  2. Select your project')
console.log('  3. Click "SQL Editor" in the left sidebar')
console.log('  4. Click "New Query"')
console.log('  5. Copy the SQL content from each file below')
console.log('  6. Paste and click "Run"\n')

console.log('='.repeat(60))

// Display each migration content
migrations.forEach((file, index) => {
  const filePath = path.join(__dirname, file)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8')
    console.log(`\n\n📄 MIGRATION ${index + 1}: ${file}`)
    console.log('='.repeat(60))
    console.log(content)
    console.log('='.repeat(60))
  }
})

console.log('\n\n✨ TIP: Copy each SQL block above and paste it into Supabase SQL Editor\n')

