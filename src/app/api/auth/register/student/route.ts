import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      institution_id,
      roll_number,
      full_name,
      father_name,
      mother_name,
      email,
      mobile_number,
      parent_mobile_number,
      password,
    } = body;

    // Validation
    if (!institution_id || !roll_number || !full_name || !password) {
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

    // Check if student already exists
    const existing = await query(
      `SELECT id FROM students WHERE institution_id = $1 AND roll_number = $2`,
      [institution_id, roll_number]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A student with this roll number already exists in this institution' },
        { status: 409 }
      );
    }

    // Create student
    const passwordHash = await hashPassword(password);
    const studentResult = await query<{ id: number }>(
      `INSERT INTO students (institution_id, roll_number, full_name, father_name, mother_name, email, mobile_number, parent_mobile_number, password_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
       RETURNING id`,
      [institution_id, roll_number, full_name, father_name || null, mother_name || null, email || null, mobile_number || null, parent_mobile_number || null, passwordHash]
    );

    const studentId = studentResult[0].id;

    const token = await createToken({
      userId: studentId,
      role: 'student',
      institutionId: institution_id,
      name: full_name,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: 'Student registered successfully',
      redirect: '/student',
    });
  } catch (error) {
    console.error('Student registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
