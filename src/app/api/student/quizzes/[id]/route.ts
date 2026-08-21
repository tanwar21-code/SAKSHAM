import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const quizResult = await query(
      `SELECT q.id, q.title, q.description, q.passing_score,
              d.name as disaster_name, d.icon
       FROM quizzes q
       JOIN disasters d ON d.id = q.disaster_id
       WHERE q.id = $1 AND q.is_published = true`,
      [id]
    );

    if (quizResult.length === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // SECURITY: never send is_correct or explanation during an active attempt
    const questions = await query(
      `SELECT qq.id, qq.question_text, qq.display_order, qq.points
       FROM quiz_questions qq
       WHERE qq.quiz_id = $1
       ORDER BY qq.display_order ASC`,
      [id]
    );

    // Get options WITHOUT is_correct
    const options = await query(
      `SELECT qo.id, qo.question_id, qo.option_text, qo.display_order
       FROM quiz_options qo
       JOIN quiz_questions qq ON qq.id = qo.question_id
       WHERE qq.quiz_id = $1
       ORDER BY qo.display_order ASC`,
      [id]
    );

    // Group options by question
    const questionsWithOptions = (questions as Record<string, unknown>[]).map((q) => ({
      ...q,
      options: (options as Record<string, unknown>[]).filter((o) => o.question_id === q.id),
    }));

    return NextResponse.json({
      quiz: quizResult[0],
      questions: questionsWithOptions,
    });
  } catch (error) {
    console.error('Quiz detail error:', error);
    return NextResponse.json({ error: 'Failed to load quiz' }, { status: 500 });
  }
}
