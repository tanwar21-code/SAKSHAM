import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classes = await query(
      `SELECT c.id, c.class_name, c.section, c.academic_year,
              COALESCE(crs.student_count, 0) as student_count,
              COALESCE(crs.average_readiness, 0) as average_readiness
       FROM classes c
       JOIN teacher_classes tc ON tc.class_id = c.id
       LEFT JOIN class_readiness_summary crs ON crs.class_id = c.id
       WHERE tc.teacher_id = $1 AND c.institution_id = $2
       ORDER BY c.class_name ASC, c.section ASC`,
      [session.userId, session.institutionId]
    );

    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Teacher classes error:', error);
    return NextResponse.json({ error: 'Failed to load classes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { class_name, section, academic_year } = await request.json();
    if (!class_name || !section) {
      return NextResponse.json({ error: 'Class name and section are required' }, { status: 400 });
    }

    const created = await query<{ id: number }>(
      `INSERT INTO classes (institution_id, class_name, section, academic_year)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [session.institutionId, class_name, section, academic_year || new Date().getFullYear().toString()]
    );
    const classId = created[0].id;

    await query(
      `INSERT INTO teacher_classes (teacher_id, class_id, assigned_at)
       VALUES ($1, $2, NOW())`,
      [session.userId, classId]
    );

    return NextResponse.json({ success: true, id: classId });
  } catch (error) {
    console.error('Teacher create class error:', error);
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}
