import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quizzes = await query(
      `SELECT DISTINCT q.id, q.title, q.description, q.passing_score,
              d.name as disaster_name, d.icon,
              (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) as question_count,
              (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = $1) as attempts,
              (SELECT MAX(qa.score) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = $1) as best_score
       FROM quizzes q
       JOIN disasters d ON d.id = q.disaster_id
       WHERE q.is_published = true
          OR EXISTS (
            SELECT 1 FROM quiz_assignments qa
            JOIN student_classes sc ON sc.class_id = qa.class_id AND sc.student_id = $1 AND sc.is_current = true
            WHERE qa.quiz_id = q.id AND qa.is_active = true
          )
       ORDER BY d.name ASC, q.title ASC`,
      [session.userId]
    );

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('Quizzes list error:', error);
    return NextResponse.json({ error: 'Failed to load quizzes' }, { status: 500 });
  }
}
