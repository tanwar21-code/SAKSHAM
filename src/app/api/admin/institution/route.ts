import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const institution = await query(
      `SELECT * FROM institutions WHERE id = $1`,
      [session.institutionId]
    );

    const counts = await query<Record<string, unknown>>(
      `SELECT
         (SELECT COUNT(*) FROM students WHERE institution_id = $1 AND status = 'active') as student_count,
         (SELECT COUNT(*) FROM teachers WHERE institution_id = $1 AND status = 'active') as teacher_count`,
      [session.institutionId]
    );

    return NextResponse.json({
      institution: institution[0] || null,
      studentCount: Number(counts[0]?.student_count) || 0,
      teacherCount: Number(counts[0]?.teacher_count) || 0,
    });
  } catch (error) {
    console.error('Admin institution error:', error);
    return NextResponse.json({ error: 'Failed to load institution' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { institution_name, institution_email, head_name, primary_contact, alternate_contact, expected_student_count } = body;

    await query(
      `UPDATE institutions SET
         institution_name = COALESCE($2, institution_name),
         institution_email = COALESCE($3, institution_email),
         head_name = COALESCE($4, head_name),
         primary_contact = COALESCE($5, primary_contact),
         alternate_contact = COALESCE($6, alternate_contact),
         expected_student_count = COALESCE($7, expected_student_count)
       WHERE id = $1`,
      [session.institutionId, institution_name || null, institution_email || null, head_name || null, primary_contact || null, alternate_contact || null, expected_student_count ?? null]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin institution update error:', error);
    return NextResponse.json({ error: 'Failed to update institution' }, { status: 500 });
  }
}
