import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { recalculateReadiness } from '@/lib/readiness';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const assigned = await query(
      `SELECT d.id FROM drills d
       JOIN student_classes sc ON sc.class_id = d.class_id AND sc.student_id = $1 AND sc.is_current = true
       WHERE d.id = $2`,
      [session.userId, id]
    );
    if (assigned.length === 0) {
      return NextResponse.json({ error: 'Drill not found for your class' }, { status: 404 });
    }

    const existing = await query(
      `SELECT id FROM drill_participants WHERE drill_id = $1 AND student_id = $2`,
      [id, session.userId]
    );
    if (existing.length > 0) {
      await query(
        `UPDATE drill_participants SET participated = true, score = 100, completed_at = NOW()
         WHERE drill_id = $1 AND student_id = $2`,
        [id, session.userId]
      );
    } else {
      await query(
        `INSERT INTO drill_participants (drill_id, student_id, participated, response_time_seconds, score, completed_at)
         VALUES ($1, $2, true, 0, 100, NOW())`,
        [id, session.userId]
      );
    }

    const readiness = await recalculateReadiness(session.userId);
    return NextResponse.json({ success: true, readiness });
  } catch (error) {
    console.error('Drill participate error:', error);
    return NextResponse.json({ error: 'Failed to record participation' }, { status: 500 });
  }
}
