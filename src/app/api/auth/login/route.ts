import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword, createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password, role } = body;

    if (!identifier || !password || !role) {
      return NextResponse.json(
        { error: 'Please provide login credentials' },
        { status: 400 }
      );
    }

    let user: Record<string, unknown> | null = null;
    let institutionId: number;

    if (role === 'student') {
      // Student login: roll_number + password
      const results = await query<Record<string, unknown>>(
        `SELECT s.id, s.full_name, s.password_hash, s.institution_id, s.status
         FROM students s
         WHERE s.roll_number = $1 AND s.status = 'active'`,
        [identifier]
      );
      if (results.length > 0) {
        user = results[0];
        institutionId = user.institution_id as number;
      } else {
        return NextResponse.json({ error: 'Invalid roll number or password' }, { status: 401 });
      }
    } else if (role === 'teacher') {
      // Teacher login: email or mobile + password
      const results = await query<Record<string, unknown>>(
        `SELECT t.id, t.full_name, t.password_hash, t.institution_id, t.status
         FROM teachers t
         WHERE (t.primary_email = $1 OR t.primary_mobile = $1 OR t.alternate_contact = $1)
         AND t.status = 'active'`,
        [identifier]
      );
      if (results.length > 0) {
        user = results[0];
        institutionId = user.institution_id as number;
      } else {
        return NextResponse.json({ error: 'Invalid email/phone or password' }, { status: 401 });
      }
    } else if (role === 'admin') {
      // Admin login: institution name, email, or contact + password
      const results = await query<Record<string, unknown>>(
        `SELECT ia.id as admin_id, ia.password_hash, ia.status,
                i.id as institution_id, i.head_name, i.institution_name
         FROM institution_admins ia
         JOIN institutions i ON i.id = ia.institution_id
         WHERE (i.institution_name = $1 OR i.institution_email = $1 OR i.primary_contact = $1)
         AND ia.status = 'active'`,
        [identifier]
      );
      if (results.length > 0) {
        user = results[0];
        user.id = user.admin_id;
        user.full_name = user.head_name;
        institutionId = user.institution_id as number;
      } else {
        return NextResponse.json({ error: 'Invalid institution credentials' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Verify password
    const isValid = await comparePassword(password, user.password_hash as string);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Update last login
    if (role === 'student') {
      await query(`UPDATE students SET last_login_at = NOW() WHERE id = $1`, [user.id]);
    } else if (role === 'teacher') {
      await query(`UPDATE teachers SET last_login_at = NOW() WHERE id = $1`, [user.id]);
    } else {
      await query(`UPDATE institution_admins SET last_login_at = NOW() WHERE id = $1`, [user.id]);
    }

    // Create JWT
    const token = await createToken({
      userId: user.id as number,
      role: role,
      institutionId: institutionId!,
      name: user.full_name as string,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      redirect: `/${role}`,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
