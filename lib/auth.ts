/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/server/models/User';
import { dbConnect } from './dbConnect';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthenticatedRequest extends NextRequest {
  user?: any;
}

export async function verifyAuth(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return { user: null, error: 'No token, authorization denied' };
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    await dbConnect();
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return { user: null, error: 'Token is not valid' };
    }

    return { user, error: null };
  } catch (error) {
    return { user: null, error: 'Token is not valid' };
  }
}

export async function verifyAdminAuth(request: NextRequest) {
  const { user, error } = await verifyAuth(request);

  if (error || !user) {
    return { user: null, error };
  }

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return { user: null, error: 'Access denied. Admin privileges required.' };
  }

  return { user, error: null };
}

export async function verifySuperAdminAuth(request: NextRequest) {
  const { user, error } = await verifyAuth(request);

  if (error || !user) {
    return { user: null, error };
  }

  if (user.role !== 'superadmin') {
    return { user: null, error: 'Access denied. SuperAdmin privileges required.' };
  }

  return { user, error: null };
}

export function getRoleFromEmail(email: string): string | null {
  if (email === 'raghav.khandelwal@newtonschool.co') {
    return 'superadmin';
  }
  if (email.endsWith('@newtonschool.co')) {
    return 'admin';
  }
  if (email.endsWith('@adypu.edu.in')) {
    return 'user';
  }
  return null;
}

export function sendError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function sendSuccess(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}
