# 🚀 Quick Start Guide - After Migration

## You Just Migrated to Next.js API Routes! 🎉

Your Express backend has been successfully converted to Next.js API routes. Here's what to do next:

## Step 1: Install & Test Locally (5 minutes)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

**What to test:**
- ✓ Homepage loads
- ✓ Sign up page works
- ✓ Login page works
- ✓ Create a test account
- ✓ Try to create a project
- ✓ Admin dashboard (if you're an admin)

## Step 2: Build for Production (2 minutes)

```bash
# Check for any TypeScript errors
npm run build

# If build succeeds, you're ready to deploy!
```

## Step 3: Deploy to Vercel (10 minutes)

### Option A: Deploy from GitHub (Recommended)

1. Go to https://vercel.com/new
2. Select your `S-W2025-ProjectTracker` repository
3. Click "Import" → Vercel auto-detects it's a Next.js project
4. Add Environment Variables:
   ```
   MONGODB_URI = <your-mongodb-connection-string>
   JWT_SECRET = <your-secret-key>
   ```
5. Click "Deploy"
6. Done! Your app is live 🎉

### Option B: Deploy using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts to link project
```

## Environment Variables Needed

Create `.env.local` in the root folder:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projecttracker
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_API_URL=http://localhost:3000
```

For **Vercel Production**, add these in Vercel Project Settings → Environment Variables:
- `MONGODB_URI` - Your production MongoDB connection
- `JWT_SECRET` - Your production secret

## Common Issues & Solutions

### "npm install" fails
```bash
# Clear cache and try again
rm -rf node_modules package-lock.json
npm install
```

### "npm run dev" shows error
```bash
# Make sure .env.local exists with MONGODB_URI and JWT_SECRET
# Check that MongoDB connection string is correct
```

### "npm run build" has TypeScript errors
```bash
# Fix the errors shown, usually in API routes
# Most common: missing imports or type issues
```

### MongoDB connection fails on Vercel
1. Check MongoDB IP whitelist includes Vercel IPs (or allow all)
2. Verify connection string is correct
3. Check MongoDB credentials are valid

### Deployment fails on Vercel
1. Check build logs in Vercel dashboard
2. Verify environment variables are set
3. Run `npm run build` locally to debug

## What Changed

### The Good News ✅
- **One unified app** - No more separate frontend/backend
- **Easy deployment** - Deploy everything to Vercel at once
- **TypeScript** - Full type safety in all models
- **Same features** - Everything works exactly like before
- **API calls** - Your frontend code already updated

### What's Different 🔄
- API runs on same domain (not separate port 3001)
- No more Express server process
- All endpoints use query parameters (not path params)
- Database connection pooled for serverless

## Project Structure

```
ProjectTracker/
├── app/
│   ├── api/                    ← All your API endpoints
│   │   ├── auth/              ← Signup/Login
│   │   ├── users/             ← User management
│   │   ├── projects/          ← Project management
│   │   └── allowed-emails/    ← Email allowlist
│   ├── dashboard/
│   ├── login/
│   ├── signup/
│   └── layout.tsx
├── lib/
│   ├── dbConnect.ts           ← MongoDB connection
│   ├── auth.ts                ← Auth utilities
│   └── api.ts                 ← Frontend API client
└── package.json
```

## API Endpoints (All Changed to Query Params)

```
POST   /api/auth                  → Signup
POST   /api/auth?action=login     → Login
GET    /api/users?action=me       → Get current user
GET    /api/users                 → Get all users (admin)
GET    /api/projects              → Get projects
POST   /api/projects              → Create project
PUT    /api/projects?id=xyz       → Update project
DELETE /api/projects?id=xyz       → Delete project
```

See `MIGRATION_GUIDE.md` for complete list.

## Useful Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)

# Production
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Check for code issues

# Testing
npm run build            # Check for TypeScript errors
```

## Next.js Features You Can Now Use

Since everything is in Next.js now, you can leverage:
- 🎨 Next.js Image optimization
- ⚡ Automatic code splitting
- 📱 Built-in mobile optimization
- 🔄 Incremental Static Regeneration (ISR)
- 🔍 SEO optimizations
- 🚀 Vercel Analytics
- 🔒 Next.js Security Headers

## Getting Help

1. **Documentation**
   - `MIGRATION_GUIDE.md` - What changed and why
   - `VERCEL_DEPLOYMENT.md` - Step-by-step deployment
   - `MIGRATION_COMPLETE.md` - Full technical details

2. **Common Issues**
   - Check Vercel logs: Dashboard → Deployments → Logs
   - Run `npm run build` locally to find errors
   - Check `.env.local` has correct values

3. **Next.js Docs**
   - https://nextjs.org/docs/app/building-your-application/routing/route-handlers
   - https://vercel.com/docs

## Deployment Checklist

- [ ] `npm install` completed
- [ ] `npm run dev` works locally
- [ ] Can sign up and log in
- [ ] Can create projects
- [ ] `npm run build` succeeds
- [ ] `.env.local` configured
- [ ] Vercel account created
- [ ] GitHub repo connected to Vercel
- [ ] Environment variables set in Vercel
- [ ] Deployment completed
- [ ] Live app tested at vercel domain

## That's It! 🎉

You're ready to deploy. Follow these steps:

1. `npm install` + `npm run dev` (test locally)
2. `npm run build` (verify no errors)
3. Push to GitHub
4. Connect to Vercel
5. Add environment variables
6. Deploy!

Your app will be live in minutes. Good luck! 🚀

---

**Questions?** Check the documentation files or the API route files for implementation details.
