import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { verifySuperAdminAuth, sendError, sendSuccess } from '@/lib/authMiddleware';
import AllowedEmail from '@/server/models/AllowedEmail';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { user, error } = await verifySuperAdminAuth(req);

    if (error || !user) {
      return sendError(error || 'Unauthorized', 401);
    }

    const list = await AllowedEmail.find().sort({ email: 1 });
    return sendSuccess(list);
  } catch (error) {
    console.error('Get allowed emails error:', error);
    return sendError('Server error fetching allowed emails', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { user, error } = await verifySuperAdminAuth(req);

    if (error || !user) {
      return sendError(error || 'Unauthorized', 401);
    }

    const { email: emailParam, name, urn } = await req.json();

    const email = (emailParam || '').toLowerCase().trim();

    if (!name) {
      return sendError('Name is required', 400);
    }
    if (!urn) {
      return sendError('URN is required', 400);
    }
    if (!email.endsWith('@adypu.edu.in')) {
      return sendError('Only @adypu.edu.in emails can be added to allowlist', 400);
    }

    const created = await AllowedEmail.create({ email, name, urn });
    return sendSuccess(created, 201);
  } catch (error: any) {
    console.error('Add allowed email error:', error);
    if (error?.code === 11000 || error?.message?.includes('duplicate key')) {
      return sendError('Email or URN already in allowlist', 400);
    }
    return sendError('Server error adding allowed email', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const { user, error } = await verifySuperAdminAuth(req);

    if (error || !user) {
      return sendError(error || 'Unauthorized', 401);
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const emailParam = url.searchParams.get('email');

    let result;

    if (id) {
      result = await AllowedEmail.findByIdAndDelete(id);
    } else if (emailParam) {
      const email = (emailParam || '').toLowerCase().trim();
      result = await AllowedEmail.findOneAndDelete({ email });
    } else {
      return sendError('Provide id or email to delete', 400);
    }

    if (!result) {
      return sendError('Allowlist entry not found', 404);
    }

    return sendSuccess({ message: 'Removed from allowlist' });
  } catch (error) {
    console.error('Delete allowed email error:', error);
    return sendError('Server error deleting allowed email', 500);
  }
}
