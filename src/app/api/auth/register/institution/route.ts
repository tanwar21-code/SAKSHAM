import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      institution_name,
      institution_email,
      head_name,
      primary_contact,
      alternate_contact,
      expected_student_count,
      password,
    } = body;

    // Validation
    if (!institution_name || !institution_email || !head_name || !primary_contact || !password) {
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

    // Check if institution already exists
    const existing = await query(
      `SELECT id FROM institutions WHERE institution_email = $1 OR institution_name = $2`,
      [institution_email, institution_name]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'An institution with this email or name already exists' },
        { status: 409 }
      );
    }

    // Create institution
    const institutionResult = await query<{ id: number }>(
      `INSERT INTO institutions (institution_name, institution_email, head_name, primary_contact, alternate_contact, expected_student_count, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING id`,
      [institution_name, institution_email, head_name, primary_contact, alternate_contact || null, expected_student_count || 0]
    );

    const institutionId = institutionResult[0].id;

    const passwordHash = await hashPassword(password);
    const adminResult = await query<{ id: number }>(
      `INSERT INTO institution_admins (institution_id, password_hash, status)
       VALUES ($1, $2, 'active')
       RETURNING id`,
      [institutionId, passwordHash]
    );

    const token = await createToken({
      userId: adminResult[0].id,
      role: 'admin',
      institutionId,
      name: head_name,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: 'Institution registered successfully',
      redirect: '/admin',
    });
  } catch (error) {
    console.error('Institution registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
