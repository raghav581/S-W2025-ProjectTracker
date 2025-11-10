import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { verifyAuth, verifySuperAdminAuth, verifyAdminAuth, sendError, sendSuccess } from '@/lib/authMiddleware';
import User from '@/server/models/User';
import ProjectEntry from '@/server/models/ProjectEntry';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action === 'me') {
    return handleGetMe(req);
  }

  if (action === 'leaderboard') {
    return handleGetLeaderboard(req);
  }

  // Default to get all users
  return handleGetAllUsers(req);
}

async function handleGetMe(req: NextRequest) {
  try {
    await dbConnect();
    const { user, error } = await verifyAuth(req);

    if (error || !user) {
      return sendError(error || 'Unauthorized', 401);
    }

    return sendSuccess({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return sendError('Server error', 500);
  }
}

async function handleGetAllUsers(req: NextRequest) {
  try {
    await dbConnect();
    const { user, error } = await verifyAdminAuth(req);

    if (error || !user) {
      return sendError(error || 'Unauthorized', 401);
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return sendSuccess(users);
  } catch (error) {
    console.error('Get users error:', error);
    return sendError('Server error fetching users', 500);
  }
}

async function handleGetLeaderboard(req: NextRequest) {
  try {
    await dbConnect();
    const { user, error } = await verifyAuth(req);

    if (error || !user) {
      return sendError(error || 'Unauthorized', 401);
    }

    const projects = await ProjectEntry.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(projects);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return sendError('Server error fetching leaderboard', 500);
  }
}

export async function PATCH(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return sendError('User ID is required', 400);
  }

  return handleUpdateUserRole(req, id);
}

async function handleUpdateUserRole(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const { user, error } = await verifySuperAdminAuth(req);

    if (error || !user) {
      return sendError(error || 'Unauthorized', 401);
    }

    const { role } = await req.json();
    const allowedRoles = ['user', 'admin'];

    if (!allowedRoles.includes(role)) {
      return sendError('Invalid role. Allowed: user, admin', 400);
    }

    if (id === String(user._id)) {
      return sendError('SuperAdmin cannot change their own role', 400);
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return sendError('User not found', 404);
    }

    // Prevent changing any superadmin
    if (targetUser.role === 'superadmin') {
      return sendError('Cannot modify a SuperAdmin role', 403);
    }

    // Enforce email-domain policy
    const email = (targetUser.email || '').toLowerCase();
    if (role === 'admin' && !email.endsWith('@newtonschool.co')) {
      return sendError('Only @newtonschool.co emails can be admins', 400);
    }

    targetUser.role = role as any;
    await targetUser.save();
    const sanitized = await User.findById(targetUser._id).select('-password');

    return sendSuccess({
      message: 'Role updated successfully',
      user: sanitized
    });
  } catch (error) {
    console.error('Update role error:', error);
    return sendError('Server error updating role', 500);
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return sendError('User ID is required', 400);
  }

  return handleDeleteUser(req, id);
}

async function handleDeleteUser(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const { user, error } = await verifySuperAdminAuth(req);

    if (error || !user) {
      return sendError(error || 'Unauthorized', 401);
    }

    if (id === String(user._id)) {
      return sendError('SuperAdmin cannot delete themselves', 400);
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return sendError('User not found', 404);
    }

    await User.findByIdAndDelete(id);

    return sendSuccess({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return sendError('Server error deleting user', 500);
  }
}
