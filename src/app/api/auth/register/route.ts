import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const { name, email, phone, password, role = 'customer' } = await request.json();

    // Validate input
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { message: 'Name, email, phone, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Validate phone format (E.164-like)
    const phoneRegex = /^\+?[1-9]\d{7,14}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { message: 'Please provide a valid phone number in international format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return NextResponse.json(
        { message: existingUser.email === email ? 'Email already in use' : 'Phone already in use' },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      name,
      email,
      phone,
      passwordHash: password, // Will be hashed by pre-save hook
      role: ['customer', 'admin'].includes(role) ? role : 'customer'
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    // Return user data (excluding password) and token
    const { passwordHash, ...userWithoutPassword } = user.toObject();

    return NextResponse.json({
      user: userWithoutPassword,
      token
    }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
