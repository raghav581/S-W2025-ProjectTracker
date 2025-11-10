# Express to Next.js API Routes Migration Guide

## Overview
Your project has been successfully migrated from a separate Express.js backend server to Next.js API routes. This allows your entire application to be deployed as a single Next.js application on Vercel or any other Next.js hosting platform.

## What Changed

### 1. **Backend Structure**
- **Before**: Separate Express server running on port 3001
- **After**: All API endpoints are now Next.js API routes under `/app/api/`

### 2. **New File Structure**

```
lib/
├── dbConnect.ts       # MongoDB connection utility
├── auth.ts            # Authentication helpers (verifyAuth, verifyAdminAuth, etc.)
└── api.ts             # Frontend API client (updated endpoints)

app/api/
├── auth/
│   └── route.ts       # POST /api/auth (signup, login)
├── users/
│   └── route.ts       # User management endpoints
├── projects/
│   └── route.ts       # Project management endpoints
└── allowed-emails/
    └── route.ts       # Allowed emails management

server/models/
├── User.ts            # User model (now TypeScript)
├── ProjectEntry.ts    # Project model (now TypeScript)
└── AllowedEmail.ts    # Allowed emails model (now TypeScript)
```

### 3. **Database Models (Converted to TypeScript)**
- `server/models/User.ts`
- `server/models/ProjectEntry.ts`
- `server/models/AllowedEmail.ts`

All models now have proper TypeScript interfaces and are compatible with Next.js API routes.

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /api/auth` → Signup
- `POST /api/auth?action=login` → Login

### User Routes (`/api/users`)
- `GET /api/users?action=me` → Get current user
- `GET /api/users` → Get all users (admin only)
- `GET /api/users?action=leaderboard` → Get leaderboard
- `PATCH /api/users?id={userId}` → Update user role (superadmin only)
- `DELETE /api/users?id={userId}` → Delete user (superadmin only)

### Projects Routes (`/api/projects`)
- `GET /api/projects` → Get all projects
- `GET /api/projects?id={id}` → Get single project
- `POST /api/projects` → Create project
- `PUT /api/projects?id={id}` → Update project
- `DELETE /api/projects?id={id}` → Delete project (admin only)

### Allowed Emails Routes (`/api/allowed-emails`)
- `GET /api/allowed-emails` → Get all allowed emails (superadmin only)
- `POST /api/allowed-emails` → Add allowed email (superadmin only)
- `DELETE /api/allowed-emails?id={id}` → Remove by ID (superadmin only)
- `DELETE /api/allowed-emails?email={email}` → Remove by email (superadmin only)

## Package.json Changes

### Removed Scripts
```json
{
  "server": "node server/index.js",
  "dev:all": "concurrently \"npm run dev\" \"npm run server\""
}
```

### Current Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

## Environment Variables

Make sure your `.env.local` file contains:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_change_in_production
NEXT_PUBLIC_API_URL=http://localhost:3000  # For development
```

For production on Vercel:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_change_in_production
NEXT_PUBLIC_API_URL=https://your-vercel-url.vercel.app
```

## Running the Application

### Development
```bash
npm install
npm run dev
```
The application will be available at `http://localhost:3000` with both frontend and backend running together.

### Production Build
```bash
npm run build
npm start
```

### Deployment to Vercel

1. **Connect your repository** to Vercel
2. **Add environment variables**:
   - `MONGODB_URI`
   - `JWT_SECRET`
3. **Deploy** - Vercel will automatically run:
   ```bash
   npm run build
   npm start
   ```

## API Client Updates

The frontend API client (`lib/api.ts`) has been updated to use the new endpoint structure with query parameters instead of path parameters:

```typescript
// Before
/api/auth/signup
/api/auth/login
/api/projects/123
/api/users/me

// After
/api/auth (with action query param)
/api/auth?action=login
/api/projects?id=123
/api/users?action=me
```

## Authentication Flow

The authentication middleware is now implemented in `lib/auth.ts` and is used in all protected API routes:

```typescript
export async function verifyAuth(request: NextRequest) {
  // Verifies JWT token from Authorization header
  // Returns { user, error }
}

export async function verifyAdminAuth(request: NextRequest) {
  // Verifies JWT token and checks for admin/superadmin role
}

export async function verifySuperAdminAuth(request: NextRequest) {
  // Verifies JWT token and checks for superadmin role only
}
```

## Key Improvements

✅ **Single Deployment**: Deploy the entire application to Vercel as one unit
✅ **Simplified Development**: No need to manage two separate processes
✅ **Better Performance**: Reduced latency between frontend and backend
✅ **Type Safety**: All models are now in TypeScript
✅ **Easier Scaling**: Can leverage Vercel's serverless functions
✅ **Better Debugging**: Unified logs and error handling

## Next Steps

1. ✅ Test all API endpoints locally with `npm run dev`
2. ✅ Verify authentication flows work correctly
3. ✅ Run any existing tests
4. ✅ Deploy to Vercel
5. ✅ Update any external documentation or client apps pointing to the API

## Troubleshooting

If you encounter issues:

1. **MongoDB Connection**: Ensure `MONGODB_URI` is set correctly
2. **JWT Issues**: Verify `JWT_SECRET` is set
3. **CORS Issues**: Next.js API routes handle same-origin requests automatically
4. **TypeScript Errors**: Run `npm run build` to catch type issues
5. **Port Conflicts**: Make sure port 3000 is available locally

## Notes

- The Express server files in `/server` are no longer needed but can be kept for reference
- All database connection logic is now handled by `lib/dbConnect.ts`
- The MongoDB connection is cached to prevent opening multiple connections in serverless functions
