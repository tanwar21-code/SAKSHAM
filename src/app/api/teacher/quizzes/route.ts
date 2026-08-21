import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quizzes = await query(
      `SELECT q.id, q.title, q.description, q.passing_score, q.is_published, q.disaster_id,
              d.name as disaster_name,
              (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) as question_count,
              (SELECT COUNT(*) FROM quiz_assignments qa WHERE qa.quiz_id = q.id AND qa.is_active = true) as assignment_count
       FROM quizzes q
       JOIN disasters d ON d.id = q.disaster_id
       WHERE q.created_by_teacher_id = $1 OR q.is_published = true
       ORDER BY q.created_at DESC`,
      [session.userId]
    );

    const disasters = await query(`SELECT id, name, icon FROM disasters ORDER BY name ASC`);

    return NextResponse.json({ quizzes, disasters });
  } catch (error) {
    console.error('Teacher quizzes GET error:', error);
    return NextResponse.json({ error: 'Failed to load quizzes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { disaster_id, module_id, title, description, passing_score, is_published, questions } = body;

    if (!disaster_id || !title || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Title, disaster, and at least one question are required' }, { status: 400 });
    }

    const quizResult = await query<{ id: number }>(
      `INSERT INTO quizzes (disaster_id, module_id, title, description, passing_score, created_by_teacher_id, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [disaster_id, module_id || null, title, description || null, passing_score || 70, session.userId, is_published !== false]
    );
    const quizId = quizResult[0].id;

    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
      const qResult = await query<{ id: number }>(
        `INSERT INTO quiz_questions (quiz_id, question_text, explanation, display_order, points)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [quizId, q.question_text, q.explanation || null, qi + 1, q.points || 10]
      );
      const questionId = qResult[0].id;
      const options = Array.isArray(q.options) ? q.options : [];
      for (let oi = 0; oi < options.length; oi++) {
        const opt = options[oi];
        await query(
          `INSERT INTO quiz_options (question_id, option_text, is_correct, display_order)
           VALUES ($1, $2, $3, $4)`,
          [questionId, opt.option_text, !!opt.is_correct, oi + 1]
        );
      }
    }

    return NextResponse.json({ success: true, id: quizId });
  } catch (error) {
    console.error('Teacher quiz create error:', error);
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}
