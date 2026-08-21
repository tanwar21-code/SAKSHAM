import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scenarios = await query(
      `SELECT s.id, s.title, s.description, s.difficulty, s.is_published, s.disaster_id,
              d.name as disaster_name,
              (SELECT COUNT(*) FROM scenario_steps ss WHERE ss.scenario_id = s.id) as step_count
       FROM scenarios s
       JOIN disasters d ON d.id = s.disaster_id
       WHERE s.created_by_teacher_id = $1 OR s.is_published = true
       ORDER BY s.created_at DESC`,
      [session.userId]
    );

    const disasters = await query(`SELECT id, name, icon FROM disasters ORDER BY name ASC`);

    return NextResponse.json({ scenarios, disasters });
  } catch (error) {
    console.error('Teacher scenarios GET error:', error);
    return NextResponse.json({ error: 'Failed to load scenarios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { disaster_id, title, description, difficulty, is_published, steps } = body;

    if (!disaster_id || !title || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'Title, disaster, and at least one step are required' }, { status: 400 });
    }

    const scenResult = await query<{ id: number }>(
      `INSERT INTO scenarios (disaster_id, title, description, difficulty, created_by_teacher_id, is_published)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [disaster_id, title, description || null, difficulty || 'beginner', session.userId, is_published !== false]
    );
    const scenarioId = scenResult[0].id;

    for (let si = 0; si < steps.length; si++) {
      const step = steps[si];
      const stepResult = await query<{ id: number }>(
        `INSERT INTO scenario_steps (scenario_id, step_number, situation_text, display_order)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [scenarioId, si + 1, step.situation_text, si + 1]
      );
      const stepId = stepResult[0].id;
      const options = Array.isArray(step.options) ? step.options : [];
      for (let oi = 0; oi < options.length; oi++) {
        const opt = options[oi];
        await query(
          `INSERT INTO scenario_options (step_id, option_text, score, feedback, is_best_choice, display_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [stepId, opt.option_text, opt.score ?? (opt.is_best_choice ? 10 : 3), opt.feedback || '', !!opt.is_best_choice, oi + 1]
        );
      }
    }

    return NextResponse.json({ success: true, id: scenarioId });
  } catch (error) {
    console.error('Teacher scenario create error:', error);
    return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 });
  }
}
