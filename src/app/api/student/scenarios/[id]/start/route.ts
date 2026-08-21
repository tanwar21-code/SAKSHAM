import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

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

    // Get scenario info
    const scenarioResult = await query(
      `SELECT s.*, d.name as disaster_name, d.icon
       FROM scenarios s
       JOIN disasters d ON d.id = s.disaster_id
       WHERE s.id = $1 AND s.is_published = true`,
      [id]
    );

    if (scenarioResult.length === 0) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    // Create a new attempt
    const attemptResult = await query<{ id: number }>(
      `INSERT INTO scenario_attempts (scenario_id, student_id, score, decisions_made, correct_decisions, started_at)
       VALUES ($1, $2, 0, 0, 0, NOW())
       RETURNING id`,
      [id, session.userId]
    );

    // Get first step with options (SECURITY: no score or is_best_choice)
    const firstStep = await query(
      `SELECT id, scenario_id, step_number, situation_text, display_order
       FROM scenario_steps
       WHERE scenario_id = $1
       ORDER BY step_number ASC
       LIMIT 1`,
      [id]
    );

    let stepOptions: Record<string, unknown>[] = [];
    if (firstStep.length > 0) {
      stepOptions = await query(
        `SELECT id, option_text, display_order
         FROM scenario_options
         WHERE step_id = $1
         ORDER BY display_order ASC`,
        [(firstStep[0] as Record<string, unknown>).id]
      );
    }

    // Get total steps count
    const totalSteps = await query(
      `SELECT COUNT(*) as count FROM scenario_steps WHERE scenario_id = $1`,
      [id]
    );

    return NextResponse.json({
      scenario: scenarioResult[0],
      attemptId: attemptResult[0].id,
      currentStep: firstStep[0] || null,
      options: stepOptions,
      totalSteps: Number((totalSteps[0] as Record<string, unknown>).count),
      stepNumber: 1,
    });
  } catch (error) {
    console.error('Scenario start error:', error);
    return NextResponse.json({ error: 'Failed to start scenario' }, { status: 500 });
  }
}
