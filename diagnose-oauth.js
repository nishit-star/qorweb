// Diagnostic script for Google OAuth setup
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Google OAuth Diagnostic Report');
console.log('=====================================\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('- GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('- BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET ? '✅ Set' : '❌ Missing');
console.log('- NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');

console.log('\n🔧 Required Actions:');

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.log('❌ Google OAuth credentials are missing!');
  console.log('');
  console.log('To fix this:');
  console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
  console.log('2. Create OAuth 2.0 credentials');
  console.log('3. Add these lines to your .env.local file:');
  console.log('');
  console.log('GOOGLE_CLIENT_ID="your-google-client-id"');
  console.log('GOOGLE_CLIENT_SECRET="your-google-client-secret"');
  console.log('');
  console.log('4. Set redirect URI in Google Console to:');
  console.log('   http://localhost:3000/api/auth/callback/google');
  console.log('');
} else {
  console.log('✅ Google OAuth credentials are configured!');
  console.log('');
  console.log('Expected OAuth endpoints:');
  console.log('- Sign in: POST http://localhost:3000/api/auth/sign-in/social');
  console.log('- Callback: GET http://localhost:3000/api/auth/callback/google');
  console.log('- Session: GET http://localhost:3000/api/auth/session');
  console.log('');
  console.log('If you\'re still getting 404 errors, try:');
  console.log('1. Restart your development server');
  console.log('2. Clear browser cache');
  console.log('3. Check browser network tab for exact error details');
}

console.log('\n📖 For detailed setup instructions, see: GOOGLE_OAUTH_SETUP.md');