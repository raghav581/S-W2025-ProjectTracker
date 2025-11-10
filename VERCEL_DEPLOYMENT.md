# Vercel Deployment Checklist

## Pre-Deployment

- [ ] All TypeScript errors resolved (`npm run build`)
- [ ] Environment variables configured in `.env.local`:
  - [ ] `MONGODB_URI` - Your MongoDB connection string
  - [ ] `JWT_SECRET` - Your JWT secret key
  - [ ] `NEXT_PUBLIC_API_URL` - Set to `http://localhost:3000` for local testing

- [ ] Local testing completed:
  ```bash
  npm install
  npm run dev
  ```
  - [ ] Signup works
  - [ ] Login works
  - [ ] Create project works
  - [ ] View projects works
  - [ ] Admin features work

- [ ] No errors in console: `npm run build`

## Vercel Configuration

1. **Connect Repository**
   - Go to https://vercel.com
   - Click "New Project"
   - Connect your GitHub repository `S-W2025-ProjectTracker`
   - Select the `main` branch

2. **Configure Project Settings**
   - Framework: Next.js (auto-detected)
   - Build Command: `next build` (default)
   - Start Command: `next start` (default)
   - Install Command: `npm install` (default)

3. **Add Environment Variables** (in Vercel Project Settings → Environment Variables)
   - Add `MONGODB_URI` - Your production MongoDB connection string
   - Add `JWT_SECRET` - Your production JWT secret
   - Optional: Add `NEXT_PUBLIC_API_URL` if you want to override the default

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - View your live application

## Post-Deployment Verification

- [ ] Application loads at `https://your-project.vercel.app`
- [ ] Signup endpoint works
- [ ] Login endpoint works
- [ ] Authentication token is stored
- [ ] API calls are successful
- [ ] Admin dashboard loads (if you're logged in as admin)
- [ ] Projects can be created
- [ ] Leaderboard displays correctly

## Important Notes

### API URL
- **Local**: `http://localhost:3000`
- **Production**: `https://your-project.vercel.app`

The `NEXT_PUBLIC_API_URL` environment variable should be:
- Local: `http://localhost:3000` (default if not set)
- Vercel: Leave empty or set to your Vercel domain (the app will auto-detect)

### Environment Variables

**Development (`.env.local`):**
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key-for-development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Production (Vercel):**
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key-for-production
```

### Troubleshooting Vercel Deployment

1. **Build Fails**
   - Check: `npm run build` runs locally without errors
   - Verify all environment variables are set
   - Check Node.js version compatibility (Vercel uses Node 18+)

2. **API Returns 500 Error**
   - Check Vercel function logs: Dashboard → Deployments → [Latest] → Logs
   - Verify `MONGODB_URI` is correct
   - Ensure MongoDB IP whitelist includes Vercel IP (or use "Allow All")

3. **Authentication Not Working**
   - Verify `JWT_SECRET` matches between local and production
   - Check Authorization header is being sent correctly
   - Look at Vercel logs for JWT verification errors

4. **CORS Issues**
   - Next.js API routes are same-origin, so CORS shouldn't be an issue
   - If calling from another domain, you may need to configure CORS headers

### Removing Old Express Server

Once deployed successfully, you can clean up:
- [ ] Delete `/server` directory (keep only for reference if needed)
- [ ] Verify no references to `server/index.js` in package.json
- [ ] Remove `concurrently` from devDependencies if not used elsewhere
- [ ] Delete `npm run dev:all` if it exists in scripts

### Database Backups

Before going live:
- [ ] Backup your MongoDB database
- [ ] Test MongoDB connection from Vercel (can be done via logs)
- [ ] Ensure database has proper indexes

### Monitoring

After deployment:
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Monitor Vercel analytics
- [ ] Set up alerts for failed deployments
- [ ] Monitor MongoDB connection usage

## Quick Start Commands

```bash
# Local development
npm install
npm run dev

# Build for production
npm run build

# Test production build locally
npm run build
npm start

# Run linting
npm run lint
```

## Support

If you encounter issues:

1. Check Vercel deployment logs: https://vercel.com/dashboard
2. Run `npm run build` locally to catch TypeScript errors
3. Verify all environment variables are set correctly
4. Check MongoDB connection string and IP whitelist
5. Review the MIGRATION_GUIDE.md for API endpoint documentation
