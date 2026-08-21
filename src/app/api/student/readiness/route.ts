import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { recalculateReadiness } from '@/lib/readiness';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const score = await query(
      `SELECT * FROM readiness_scores WHERE student_id = $1 ORDER BY calculated_at DESC LIMIT 1`,
      [session.userId]
    );

    return NextResponse.json({
      readiness: score[0] || {
        knowledge_score: 0, scenario_score: 0, quiz_score: 0,
        drill_score: 0, overall_score: 0, readiness_level: 'Needs Practice',
      },
    });
  } catch (error) {
    console.error('Readiness score error:', error);
    return NextResponse.json({ error: 'Failed to load readiness score' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const readiness = await recalculateReadiness(session.userId);
    return NextResponse.json({ readiness });
  } catch (error) {
    console.error('Readiness calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate readiness score' }, { status: 500 });
  }
}
