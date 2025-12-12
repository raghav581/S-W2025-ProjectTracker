import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbConnect } from '@/lib/dbConnect';
import { getRoleFromEmail, sendError, sendSuccess } from '@/lib/authMiddleware';
import User from '@/server/models/User';
import AllowedEmail from '@/server/models/AllowedEmail';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function handleSignup(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    await dbConnect();

    // Validate email domain
    const role = getRoleFromEmail(email);
    if (!role) {
      return sendError('Invalid email domain. Only @adypu.edu.in and @newtonschool.co emails are allowed.', 400);
    }

    // For student signups (@adypu.edu.in), enforce allowlist
    if (role === 'user') {
      const exists = await AllowedEmail.findOne({ email: (email || '').toLowerCase() });
      if (!exists) {
        return sendError('This email is not allowed to signup. Please contact admin.', 403);
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError('User already exists', 400);
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return sendSuccess({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }, 201);
  } catch (error) {
    console.error('Signup error:', error);
    return sendError('Server error during signup', 500);
  }
}

async function handleLogin(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    console.log('Login attempt for email:', email);
    await dbConnect();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return sendError('Invalid credentials', 401);
    }

    // Check password
    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) {
      return sendError('Invalid credentials', 401);
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return sendSuccess({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendError('Server error during login', 500);
  }
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action === 'login') {
    return handleLogin(req);
  }

  // Default to signup
  return handleSignup(req);
}
