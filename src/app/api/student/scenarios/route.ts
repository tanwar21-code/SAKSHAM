import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scenarios = await query(
      `SELECT DISTINCT s.id, s.title, s.description, s.difficulty,
              d.name as disaster_name, d.icon,
              (SELECT COUNT(*) FROM scenario_steps ss WHERE ss.scenario_id = s.id) as step_count,
              (SELECT COUNT(*) FROM scenario_attempts sa WHERE sa.scenario_id = s.id AND sa.student_id = $1) as attempts,
              (SELECT MAX(sa.score) FROM scenario_attempts sa WHERE sa.scenario_id = s.id AND sa.student_id = $1) as best_score
       FROM scenarios s
       JOIN disasters d ON d.id = s.disaster_id
       WHERE s.is_published = true
          OR EXISTS (
            SELECT 1 FROM scenario_assignments sa
            JOIN student_classes sc ON sc.class_id = sa.class_id AND sc.student_id = $1 AND sc.is_current = true
            WHERE sa.scenario_id = s.id AND sa.is_active = true
          )
       ORDER BY d.name ASC, s.title ASC`,
      [session.userId]
    );

    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error('Scenarios list error:', error);
    return NextResponse.json({ error: 'Failed to load scenarios' }, { status: 500 });
  }
}
