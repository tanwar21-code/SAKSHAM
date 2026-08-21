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
    const { answers, time_taken_seconds } = body;
    // answers: [{ question_id, selected_option_id }]

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 });
    }

    // Get correct answers from database (server-side evaluation)
    const correctOptions = await query<{ id: number; question_id: number; is_correct: boolean }>(
      `SELECT qo.id, qo.question_id, qo.is_correct
       FROM quiz_options qo
       JOIN quiz_questions qq ON qq.id = qo.question_id
       WHERE qq.quiz_id = $1`,
      [id]
    );

    // Evaluate each answer
    let correctAnswers = 0;
    const totalQuestions = new Set(correctOptions.map(o => o.question_id)).size;

    const evaluatedAnswers = answers.map((answer: { question_id: number; selected_option_id: number }) => {
      const correctOption = correctOptions.find(
        o => o.question_id === answer.question_id && o.is_correct
      );
      const isCorrect = correctOption?.id === answer.selected_option_id;
      if (isCorrect) correctAnswers++;
      return {
        question_id: answer.question_id,
        selected_option_id: answer.selected_option_id,
        is_correct: isCorrect,
        correct_option_id: correctOption?.id,
      };
    });

    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Create quiz attempt
    const attemptResult = await query<{ id: number }>(
      `INSERT INTO quiz_attempts (quiz_id, student_id, score, correct_answers, total_questions, started_at, completed_at, time_taken_seconds)
       VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '1 second' * $6, NOW(), $6)
       RETURNING id`,
      [id, session.userId, score, correctAnswers, totalQuestions, time_taken_seconds || 0]
    );

    const attemptId = attemptResult[0].id;

    // Insert individual answers
    for (const answer of evaluatedAnswers) {
      await query(
        `INSERT INTO quiz_answers (attempt_id, question_id, selected_option_id, is_correct, answered_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (attempt_id, question_id) DO UPDATE SET
           selected_option_id = $3, is_correct = $4, answered_at = NOW()`,
        [attemptId, answer.question_id, answer.selected_option_id, answer.is_correct]
      );
    }

    // Get questions with explanations for results
    const questionsWithExplanations = await query(
      `SELECT qq.id, qq.question_text, qq.explanation, qq.display_order
       FROM quiz_questions qq
       WHERE qq.quiz_id = $1
       ORDER BY qq.display_order ASC`,
      [id]
    );

    await recalculateReadiness(session.userId);

    return NextResponse.json({
      score,
      correctAnswers,
      totalQuestions,
      attemptId,
      results: evaluatedAnswers,
      questions: questionsWithExplanations,
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}
