# Writecast Deployment Guide

## Overview
This guide covers deploying Writecast to Vercel and configuring it as a Farcaster mini app.

## Prerequisites
- GitHub repository connected to Vercel
- Supabase project set up
- Farcaster developer account

## Step 1: Environment Variables Setup

### Required Environment Variables
Add these to your Vercel project settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_FARCASTER_APP_ID=writecast
NEXT_PUBLIC_APP_URL=https://writecast.vercel.app
```

### How to Add Environment Variables in Vercel:
1. Go to your Vercel dashboard
2. Select your Writecast project
3. Go to Settings → Environment Variables
4. Add each variable above
5. Set them for Production, Preview, and Development

## Step 2: Farcaster App Registration

### Register Your App
1. Visit [farcaster.xyz/developers](https://farcaster.xyz/developers)
2. Click "Create App" or "Register New App"
3. Fill in the app details:
   - **App Name**: Writecast
   - **Description**: Terminal-style word games on Farcaster
   - **App URL**: `https://writecast.vercel.app`
   - **Redirect URL**: `https://writecast.vercel.app/api/auth/callback`
   - **App Icon**: Upload Writecast logo

### Get Your App ID
After registration, you'll receive:
- App ID (use this for `NEXT_PUBLIC_FARCASTER_APP_ID`)
- App Secret (keep this secure, not needed for client-side)

## Step 3: Deploy to Vercel

### Automatic Deployment (Recommended)
Since your GitHub repo is connected to Vercel:

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "Add Farcaster mini app integration"
   git push origin main
   ```

2. **Vercel will automatically deploy** (takes 2-3 minutes)

3. **Check deployment status** in Vercel dashboard

### Manual Deployment
If you need to deploy manually:

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

## Step 4: Post-Deployment Testing

### Test Core Functionality
1. **Visit your deployed app**: `https://writecast.vercel.app`
2. **Test anonymous gameplay**:
   ```bash
   > games
   > play ABC123
   > guess innovation
   ```
3. **Test game creation**:
   ```bash
   > create wisdom
   > write True wisdom comes from experience
   > confirm
   ```

### Test Farcaster Integration
1. **Test authentication** (will work on deployed domain):
   ```bash
   > login
   > whoami
   > logout
   ```

2. **Test social features**:
   ```bash
   > share ABC123
   > invite @friend
   > profile @user
   ```

3. **Test deep linking**:
   - Visit: `https://writecast.vercel.app/play/ABC123`
   - Should auto-load and start the game

### Test Haptic Feedback
- Correct guesses should trigger success haptics
- Wrong guesses should trigger error haptics
- Game creation should trigger success haptics

## Step 5: Farcaster Mini App Manifest

### Create Manifest File
Create `public/manifest.json`:

```json
{
  "name": "Writecast",
  "short_name": "Writecast",
  "description": "Terminal-style word games on Farcaster",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#00ff00",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Add Meta Tags
The app already includes Farcaster meta tags in `app/layout.tsx`:
- `farcaster:app`
- `farcaster:app_url`

## Step 6: Testing in Warpcast

### Test in Farcaster Client
1. **Open Warpcast** (mobile app)
2. **Share a game** using the `share` command
3. **Click the shared link** in Warpcast
4. **Verify the mini app opens** correctly
5. **Test gameplay** within the mini app context

### Test Deep Links
1. **Create a game** and get the game code
2. **Share the deep link**: `https://writecast.vercel.app/play/GAMECODE`
3. **Test in Warpcast** by clicking the link
4. **Verify auto-game loading** works

## Step 7: Monitoring and Maintenance

### Monitor Performance
- Check Vercel analytics for performance metrics
- Monitor Supabase usage and limits
- Watch for any deployment errors

### Update Process
1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub
4. Vercel auto-deploys
5. Test on production

## Troubleshooting

### Common Issues

**Environment Variables Not Working:**
- Verify variables are set in Vercel dashboard
- Check variable names match exactly
- Redeploy after adding new variables

**Farcaster Authentication Failing:**
- Verify app is registered correctly
- Check redirect URLs match exactly
- Ensure app is approved (if required)

**Deep Links Not Working:**
- Check `vercel.json` redirects configuration
- Verify route files exist: `app/play/[gameCode]/page.tsx`
- Test URLs manually in browser

**Database Connection Issues:**
- Verify Supabase URL and keys
- Check Supabase project is active
- Test database connection separately

### Debug Commands
```bash
# Check environment variables
> auth

# Test database connection
> games

# Test game creation
> create test
> write This is a test
> confirm
```

## Security Considerations

### Environment Variables
- Never commit `.env.local` to Git
- Use Vercel's environment variable system
- Rotate keys periodically

### Database Security
- Supabase RLS policies are already configured
- Anonymous users can only access public data
- Authenticated users have proper permissions

### Farcaster Integration
- All Farcaster actions require user consent
- No sensitive data is stored client-side
- Proper error handling for failed authentications

## Support

### Getting Help
- Check Vercel deployment logs
- Review Supabase logs
- Test locally first before deploying
- Use browser dev tools for debugging

### Useful Links
- [Vercel Documentation](https://vercel.com/docs)
- [Farcaster Developer Docs](https://docs.farcaster.xyz/)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

## Quick Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Farcaster app registered
- [ ] Code committed and pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Core functionality tested
- [ ] Farcaster integration tested
- [ ] Deep links working
- [ ] Haptic feedback working
- [ ] Anonymous gameplay working
- [ ] Authenticated gameplay working

**Your Writecast mini app is now live! 🎉**
