# Project Tracker

A full-stack project tracking application built with Next.js, Node.js, and MongoDB.

## Features

- **User Authentication**: Email-based authentication with domain restrictions
  - Regular users: `@adypu.edu.in`
  - Admins: `@newtonschool.co`
  - SuperAdmin: `raghav.khandelwal@newtonschool.co`

- **Project Management**:
  - Create project entries with 3 team members
  - Each member includes: name, email, and GitHub username
  - Project idea selection
  - GitHub repository link
  - Demo link

- **Role-Based Access**:
  - Users can only edit projects where their email is included
  - Admins can view and edit all projects
  - SuperAdmin has full control

- **Dashboards**:
  - User Dashboard: View and manage your projects
  - Admin Dashboard: Full control over all projects
  - Leaderboard: Rank users by project participation

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas connection string

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file in the root directory:
```
MONGODB_URI=mongodb://localhost:27017/projecttracker
JWT_SECRET=your-secret-key-change-in-production
NEXT_PUBLIC_API_URL=http://localhost:3001
PORT=3001
```

3. Start MongoDB (if running locally):
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or use MongoDB Atlas and update MONGODB_URI in .env.local
```

4. Run the development servers:

Option 1: Run both frontend and backend together:
```bash
npm run dev:all
```

Option 2: Run separately:
```bash
# Terminal 1 - Frontend (Next.js)
npm run dev

# Terminal 2 - Backend (Node.js/Express)
npm run server
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ProjectTracker/
├── app/                    # Next.js app directory
│   ├── dashboard/         # User dashboard
│   ├── admin/             # Admin dashboard
│   ├── leaderboard/       # Leaderboard page
│   ├── login/             # Login page
│   └── signup/            # Signup page
├── server/                # Backend server
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   └── middleware/       # Auth middleware
├── lib/                  # Shared utilities
│   ├── api.ts           # API client
│   └── auth.tsx         # Auth context
└── components/          # React components
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Projects
- `GET /api/projects` - Get all projects (filtered by user role)
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project (admin only)

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/leaderboard` - Get leaderboard data

## Usage

1. **Sign Up**: Create an account with an email ending in `@adypu.edu.in` or `@newtonschool.co`
2. **Create Project**: Fill in 3 team member details, project idea, and optionally GitHub/demo links
3. **Edit Project**: Users can edit projects where their email is included
4. **Admin Access**: Admins can view and edit all projects from the Admin Dashboard
5. **Leaderboard**: View user rankings based on project participation

## Notes

- Make sure MongoDB is running before starting the server
- Change `JWT_SECRET` in production
- Update `MONGODB_URI` if using MongoDB Atlas
- The SuperAdmin account is automatically assigned to `raghav.khandelwal@newtonschool.co`


