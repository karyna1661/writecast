#!/usr/bin/env node

/**
 * Script to generate accountAssociation signature for Farcaster manifest
 * 
 * This script helps generate the proper accountAssociation signature
 * for your Farcaster mini app manifest.
 * 
 * You'll need:
 * 1. Your Farcaster custody address (0x...)
 * 2. Your domain (writecast-1.vercel.app)
 * 
 * Usage:
 * node scripts/generate-manifest-signature.js
 */

console.log('🔐 Farcaster Manifest Signature Generator');
console.log('==========================================\n');

console.log('To generate the accountAssociation signature, you need:');
console.log('1. Your Farcaster custody address (0x...)');
console.log('2. Your domain: writecast-1.vercel.app\n');

console.log('📋 Steps to get your signature:');
console.log('1. Go to https://warpcast.com/~/developers/frames');
console.log('2. Use the "Sign Manifest" tool');
console.log('3. Enter your domain: writecast-1.vercel.app');
console.log('4. Sign with your Farcaster custody address');
console.log('5. Copy the generated accountAssociation object\n');

console.log('📝 Current manifest structure (update the signature):');
console.log(JSON.stringify({
  "accountAssociation": {
    "header": "eyJmaWQiOjM2MjEsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgxMjM0NTY3ODkwYWJjZGVmZ2hpamsifQ==",
    "payload": "eyJkb21haW4iOiJ3cml0ZWNhc3QtMS52ZXJjZWwuYXBwIn0=",
    "signature": "REPLACE_WITH_REAL_SIGNATURE_FROM_WARPCAST_TOOL"
  }
}, null, 2));

console.log('\n🔗 Alternative tools:');
console.log('- Warpcast Frame Validator: https://warpcast.com/~/developers/frames');
console.log('- Farcaster Docs: https://miniapps.farcaster.xyz/docs/specification#manifest');
console.log('- Base Documentation: https://docs.base.org/mini-apps/features/sign-manifest');

console.log('\n⚠️  Important:');
console.log('- The signature must be generated with your actual Farcaster custody address');
console.log('- The domain must exactly match: writecast-1.vercel.app');
console.log('- After updating, redeploy your app and test the manifest URL');
