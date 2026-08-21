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
    const body = await request.json();
    const { attempt_id, step_id, selected_option_id, decision_time_seconds } = body;

    // Verify attempt belongs to this student
    const attempt = await query(
      `SELECT id FROM scenario_attempts WHERE id = $1 AND student_id = $2 AND scenario_id = $3`,
      [attempt_id, session.userId, id]
    );
    if (attempt.length === 0) {
      return NextResponse.json({ error: 'Invalid attempt' }, { status: 400 });
    }

    // Get the selected option with score and feedback (server-side)
    const optionResult = await query<Record<string, unknown>>(
      `SELECT id, option_text, score, feedback, is_best_choice
       FROM scenario_options
       WHERE id = $1 AND step_id = $2`,
      [selected_option_id, step_id]
    );

    if (optionResult.length === 0) {
      return NextResponse.json({ error: 'Invalid option' }, { status: 400 });
    }

    const selectedOption = optionResult[0];
    const scoreAwarded = Number(selectedOption.score) || 0;
    const isBestChoice = selectedOption.is_best_choice as boolean;

    // Record the decision
    await query(
      `INSERT INTO scenario_decisions (attempt_id, step_id, selected_option_id, score_awarded, decision_time_seconds)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (attempt_id, step_id) DO UPDATE SET
         selected_option_id = $3, score_awarded = $4, decision_time_seconds = $5`,
      [attempt_id, step_id, selected_option_id, scoreAwarded, decision_time_seconds || 0]
    );

    // Update attempt stats
    await query(
      `UPDATE scenario_attempts SET
         decisions_made = decisions_made + 1,
         correct_decisions = correct_decisions + $1
       WHERE id = $2`,
      [isBestChoice ? 1 : 0, attempt_id]
    );

    // Get next step
    const currentStep = await query<Record<string, unknown>>(
      `SELECT step_number FROM scenario_steps WHERE id = $1`,
      [step_id]
    );
    const currentStepNumber = Number((currentStep[0] as Record<string, unknown>).step_number);

    const nextStep = await query(
      `SELECT id, scenario_id, step_number, situation_text, display_order
       FROM scenario_steps
       WHERE scenario_id = $1 AND step_number > $2
       ORDER BY step_number ASC
       LIMIT 1`,
      [id, currentStepNumber]
    );

    let nextOptions: Record<string, unknown>[] = [];
    const isLastStep = nextStep.length === 0;

    if (!isLastStep) {
      nextOptions = await query(
        `SELECT id, option_text, display_order
         FROM scenario_options
         WHERE step_id = $1
         ORDER BY display_order ASC`,
        [(nextStep[0] as Record<string, unknown>).id]
      );
    }

    // If last step, calculate final score
    let finalResult = null;
    if (isLastStep) {
      const decisions = await query<Record<string, unknown>>(
        `SELECT SUM(score_awarded) as total_score,
                COUNT(*) as total_decisions
         FROM scenario_decisions
         WHERE attempt_id = $1`,
        [attempt_id]
      );

      const totalSteps = await query<Record<string, unknown>>(
        `SELECT COUNT(*) as count FROM scenario_steps WHERE scenario_id = $1`,
        [id]
      );

      // Max possible score (sum of best option scores for each step)
      const maxScore = await query<Record<string, unknown>>(
        `SELECT SUM(max_score) as total FROM (
           SELECT MAX(so.score) as max_score
           FROM scenario_steps ss
           JOIN scenario_options so ON so.step_id = ss.id
           WHERE ss.scenario_id = $1
           GROUP BY ss.id
         ) sub`,
        [id]
      );

      const totalScore = Number(decisions[0]?.total_score) || 0;
      const maxPossible = Number(maxScore[0]?.total) || 1;
      const finalScorePercent = Math.round((totalScore / maxPossible) * 100);

      const updatedAttempt = await query<Record<string, unknown>>(
        `UPDATE scenario_attempts SET
           score = $1,
           completed_at = NOW(),
           time_taken_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::int
         WHERE id = $2
         RETURNING score, decisions_made, correct_decisions, time_taken_seconds`,
        [finalScorePercent, attempt_id]
      );

      finalResult = {
        score: finalScorePercent,
        decisions_made: Number(updatedAttempt[0]?.decisions_made),
        correct_decisions: Number(updatedAttempt[0]?.correct_decisions),
        total_steps: Number(totalSteps[0]?.count),
        time_taken_seconds: Number(updatedAttempt[0]?.time_taken_seconds),
      };

      await recalculateReadiness(session.userId);
    }

    return NextResponse.json({
      feedback: selectedOption.feedback as string,
      scoreAwarded: isLastStep ? scoreAwarded : undefined,
      isBestChoice,
      nextStep: nextStep[0] || null,
      nextOptions,
      isLastStep,
      finalResult,
    });
  } catch (error) {
    console.error('Scenario decision error:', error);
    return NextResponse.json({ error: 'Failed to process decision' }, { status: 500 });
  }
}
