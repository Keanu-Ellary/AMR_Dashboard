import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Try to update ordinary user first
    const updatedUser = await prisma.user.updateMany({
      where: { email },
      data: { password: hashedPassword },
    });

    if (updatedUser.count > 0) {
      return NextResponse.json({ message: 'Password updated successfully' });
    }

    // If no user found, try admin
    const updatedAdmin = await prisma.adminUser.updateMany({
      where: { email },
      data: { password: hashedPassword },
    });

    if (updatedAdmin.count > 0) {
      return NextResponse.json({ message: 'Password updated successfully' });
    }

    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: 'An error occurred during password reset' },
      { status: 500 }
    );
  }
}
