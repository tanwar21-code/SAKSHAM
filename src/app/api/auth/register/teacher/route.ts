import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      institution_id,
      full_name,
      primary_email,
      primary_mobile,
      alternate_contact,
      password,
    } = body;

    // Validation
    if (!institution_id || !full_name || !primary_email || !primary_mobile || !password) {
      return NextResponse.json(
        { error: 'Please fill in all required fields' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check institution exists
    const institution = await query(
      `SELECT id FROM institutions WHERE id = $1 AND status = 'active'`,
      [institution_id]
    );
    if (institution.length === 0) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      );
    }

    // Check if teacher already exists
    const existing = await query(
      `SELECT id FROM teachers WHERE primary_email = $1 OR primary_mobile = $2`,
      [primary_email, primary_mobile]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A teacher with this email or phone number already exists' },
        { status: 409 }
      );
    }

    // Create teacher
    const passwordHash = await hashPassword(password);
    const teacherResult = await query<{ id: number }>(
      `INSERT INTO teachers (institution_id, full_name, primary_email, primary_mobile, alternate_contact, password_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING id`,
      [institution_id, full_name, primary_email, primary_mobile, alternate_contact || null, passwordHash]
    );

    const teacherId = teacherResult[0].id;

    const token = await createToken({
      userId: teacherId,
      role: 'teacher',
      institutionId: institution_id,
      name: full_name,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: 'Teacher registered successfully',
      redirect: '/teacher',
    });
  } catch (error) {
    console.error('Teacher registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
