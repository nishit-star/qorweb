# Google OAuth 404 Error Troubleshooting Guide

## 🚨 Issue: Getting 404 for `/api/auth/sign-in/social`

This error typically occurs when Google OAuth credentials are missing or the auth configuration isn't properly loaded.

## 🔍 Quick Diagnosis

Run this command to check your setup:

```bash
node diagnose-oauth.js
```

Or test the auth configuration endpoint:

```bash
curl http://localhost:3000/api/auth/test-config
```

## ✅ Step-by-Step Fix

### 1. Check Environment Variables

Verify your `.env.local` file contains:

```env
# Google OAuth (REQUIRED)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Better Auth (REQUIRED)
BETTER_AUTH_SECRET="your-32-character-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database (REQUIRED)
DATABASE_URL="your-postgresql-connection-string"
```

### 2. Get Google OAuth Credentials

If you don't have Google OAuth credentials:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**
3. **Enable APIs**: Go to "APIs & Services" > "Library" > Enable "Google+ API"
4. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill required fields (App name, User support email, Developer contact)
5. **Create Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Firegeo OAuth Client"
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. **Copy credentials** and add to `.env.local`

### 3. Restart Development Server

After adding environment variables:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 4. Verify Auth Endpoints

Test these endpoints in your browser or with curl:

```bash
# Test auth configuration
curl http://localhost:3000/api/auth/test-config

# Test session endpoint
curl http://localhost:3000/api/auth/session
```

Expected endpoints that should work:
- ✅ `GET /api/auth/session`
- ✅ `POST /api/auth/sign-in/social`
- ✅ `GET /api/auth/callback/google`

### 5. Test Google OAuth Flow

1. **Go to login page**: http://localhost:3000/login
2. **Click "Continue with Google"**
3. **Check browser network tab** for exact error details
4. **Should redirect to**: `https://accounts.google.com/oauth/authorize?...`

## 🐛 Common Issues & Solutions

### Issue: "Invalid client_id"
**Solution**: Double-check your `GOOGLE_CLIENT_ID` in `.env.local`

### Issue: "redirect_uri_mismatch"
**Solution**: Ensure redirect URI in Google Console exactly matches:
```
http://localhost:3000/api/auth/callback/google
```

### Issue: "Access blocked: This app's request is invalid"
**Solution**: 
1. Configure OAuth consent screen properly
2. Add your email as a test user
3. Verify app is not in "Testing" mode with restricted users

### Issue: Still getting 404 after setup
**Solution**:
1. Clear browser cache
2. Restart development server
3. Check if `.env.local` is in the root directory
4. Verify no typos in environment variable names

## 🔧 Debug Commands

```bash
# Check if environment variables are loaded
node -e "require('dotenv').config({path:'.env.local'}); console.log('Google Client ID:', !!process.env.GOOGLE_CLIENT_ID)"

# Test auth configuration
curl -X GET http://localhost:3000/api/auth/test-config

# Test session endpoint
curl -X GET http://localhost:3000/api/auth/session

# Check if Better Auth routes are working
curl -X GET http://localhost:3000/api/auth/session
```

## 📋 Checklist

Before testing Google OAuth, ensure:

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URI set correctly
- [ ] `GOOGLE_CLIENT_ID` in `.env.local`
- [ ] `GOOGLE_CLIENT_SECRET` in `.env.local`
- [ ] Development server restarted
- [ ] `/api/auth/session` endpoint works
- [ ] `/api/auth/test-config` returns success

## 🆘 Still Having Issues?

1. **Check browser console** for JavaScript errors
2. **Check browser network tab** for failed requests
3. **Check server logs** for error messages
4. **Verify database connection** is working
5. **Test with a fresh browser/incognito mode**

## 📞 Quick Test

Run this one-liner to test everything:

```bash
node diagnose-oauth.js && curl -s http://localhost:3000/api/auth/test-config | jq .
```

If this shows all green checkmarks, your Google OAuth should work!