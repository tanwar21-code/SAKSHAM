import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const drills = await query(
      `SELECT d.id, d.title, d.instructions, d.scheduled_at, d.class_id, d.disaster_id,
              c.class_name, c.section, dis.name as disaster_name,
              (SELECT COUNT(*) FROM drill_participants dp WHERE dp.drill_id = d.id AND dp.participated = true) as participated_count
       FROM drills d
       JOIN classes c ON c.id = d.class_id
       JOIN disasters dis ON dis.id = d.disaster_id
       WHERE d.teacher_id = $1 AND d.institution_id = $2
       ORDER BY d.created_at DESC`,
      [session.userId, session.institutionId]
    );

    return NextResponse.json({ drills });
  } catch (error) {
    console.error('Teacher drills GET error:', error);
    return NextResponse.json({ error: 'Failed to load drills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { class_id, disaster_id, title, instructions, scheduled_at } = await request.json();
    if (!class_id || !disaster_id || !title) {
      return NextResponse.json({ error: 'class_id, disaster_id, and title are required' }, { status: 400 });
    }

    const access = await query(
      `SELECT id FROM teacher_classes WHERE teacher_id = $1 AND class_id = $2`,
      [session.userId, class_id]
    );
    if (access.length === 0) {
      return NextResponse.json({ error: 'Access denied to this class' }, { status: 403 });
    }

    const result = await query<{ id: number }>(
      `INSERT INTO drills (institution_id, teacher_id, class_id, disaster_id, title, instructions, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [session.institutionId, session.userId, class_id, disaster_id, title, instructions || null, scheduled_at || null]
    );

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('Teacher drill create error:', error);
    return NextResponse.json({ error: 'Failed to create drill' }, { status: 500 });
  }
}
