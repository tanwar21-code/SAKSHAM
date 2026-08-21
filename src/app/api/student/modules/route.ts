import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const modules = await query(
      `SELECT lm.id, lm.title, lm.description, lm.difficulty, lm.estimated_minutes,
              d.name as disaster_name, d.icon,
              mp.progress_percentage, mp.completed
       FROM learning_modules lm
       JOIN disasters d ON d.id = lm.disaster_id
       LEFT JOIN module_progress mp ON mp.module_id = lm.id AND mp.student_id = $1
       WHERE lm.is_published = true
       ORDER BY d.name ASC, lm.title ASC`,
      [session.userId]
    );

    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Modules list error:', error);
    return NextResponse.json({ error: 'Failed to load modules' }, { status: 500 });
  }
}
