import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const drills = await query(
      `SELECT d.id, d.title, d.instructions, d.scheduled_at,
              dis.name as disaster_name, dis.icon,
              c.class_name, c.section,
              COALESCE(dp.participated, false) as participated,
              dp.score as participation_score
       FROM drills d
       JOIN disasters dis ON dis.id = d.disaster_id
       JOIN classes c ON c.id = d.class_id
       JOIN student_classes sc ON sc.class_id = d.class_id AND sc.student_id = $1 AND sc.is_current = true
       LEFT JOIN drill_participants dp ON dp.drill_id = d.id AND dp.student_id = $1
       ORDER BY d.scheduled_at DESC NULLS LAST, d.created_at DESC`,
      [session.userId]
    );

    return NextResponse.json({ drills });
  } catch (error) {
    console.error('Student drills error:', error);
    return NextResponse.json({ error: 'Failed to load drills' }, { status: 500 });
  }
}
