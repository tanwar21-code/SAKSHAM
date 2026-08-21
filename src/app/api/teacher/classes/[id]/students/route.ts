import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;

    // Verify teacher has access to this class
    const access = await query(
      `SELECT id FROM teacher_classes WHERE teacher_id = $1 AND class_id = $2`,
      [session.userId, id]
    );
    if (access.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const students = await query(
      `SELECT s.id as student_id, s.full_name, s.roll_number,
              COALESCE(rs.overall_score, 0) as readiness_score,
              COALESCE(rs.readiness_level, 'Needs Practice') as readiness_level
       FROM student_classes sc
       JOIN students s ON s.id = sc.student_id
       LEFT JOIN readiness_scores rs ON rs.student_id = s.id
       WHERE sc.class_id = $1 AND sc.is_current = true
       ORDER BY s.roll_number ASC`,
      [id]
    );

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Class students error:', error);
    return NextResponse.json({ error: 'Failed to load students' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const { roll_number } = await request.json();

    if (!roll_number) {
      return NextResponse.json({ error: 'Roll number is required' }, { status: 400 });
    }

    const access = await query(
      `SELECT id FROM teacher_classes WHERE teacher_id = $1 AND class_id = $2`,
      [session.userId, id]
    );
    if (access.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const student = await query<{ id: number }>(
      `SELECT id FROM students
       WHERE institution_id = $1 AND roll_number = $2 AND status = 'active'`,
      [session.institutionId, roll_number]
    );
    if (student.length === 0) {
      return NextResponse.json({ error: 'No student found with that roll number in your institution' }, { status: 404 });
    }

    const existing = await query(
      `SELECT id FROM student_classes WHERE student_id = $1 AND class_id = $2`,
      [student[0].id, id]
    );
    if (existing.length > 0) {
      await query(
        `UPDATE student_classes SET is_current = true WHERE student_id = $1 AND class_id = $2`,
        [student[0].id, id]
      );
    } else {
      await query(
        `INSERT INTO student_classes (student_id, class_id, enrolled_at, is_current)
         VALUES ($1, $2, NOW(), true)`,
        [student[0].id, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Enroll student error:', error);
    return NextResponse.json({ error: 'Failed to enroll student' }, { status: 500 });
  }
}
