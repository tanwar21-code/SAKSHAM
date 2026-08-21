import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher's classes with readiness summary
    let classes: Record<string, unknown>[] = [];
    try {
      classes = await query(
        `SELECT crs.* FROM class_readiness_summary crs
         JOIN teacher_classes tc ON tc.class_id = crs.class_id
         WHERE tc.teacher_id = $1`,
        [session.userId]
      );
    } catch {
      classes = await query(
        `SELECT c.id as class_id, c.institution_id, c.class_name, c.section,
                COUNT(DISTINCT sc.student_id) as student_count,
                COALESCE(AVG(rs.overall_score), 0) as average_readiness
         FROM classes c
         JOIN teacher_classes tc ON tc.class_id = c.id
         LEFT JOIN student_classes sc ON sc.class_id = c.id AND sc.is_current = true
         LEFT JOIN readiness_scores rs ON rs.student_id = sc.student_id
         WHERE tc.teacher_id = $1
         GROUP BY c.id, c.institution_id, c.class_name, c.section`,
        [session.userId]
      );
    }

    // Get all students in teacher's classes
    const totalStudents = await query<Record<string, unknown>>(
      `SELECT COUNT(DISTINCT sc.student_id) as count
       FROM student_classes sc
       JOIN teacher_classes tc ON tc.class_id = sc.class_id
       WHERE tc.teacher_id = $1 AND sc.is_current = true`,
      [session.userId]
    );

    // Get average readiness
    const avgReadiness = await query<Record<string, unknown>>(
      `SELECT COALESCE(AVG(rs.overall_score), 0) as avg_score
       FROM readiness_scores rs
       JOIN student_classes sc ON sc.student_id = rs.student_id AND sc.is_current = true
       JOIN teacher_classes tc ON tc.class_id = sc.class_id
       WHERE tc.teacher_id = $1`,
      [session.userId]
    );

    // Recent activity
    const recentQuizAttempts = await query(
      `SELECT s.full_name, q.title as quiz_title, qa.score, qa.completed_at
       FROM quiz_attempts qa
       JOIN students s ON s.id = qa.student_id
       JOIN quizzes q ON q.id = qa.quiz_id
       JOIN student_classes sc ON sc.student_id = s.id AND sc.is_current = true
       JOIN teacher_classes tc ON tc.class_id = sc.class_id
       WHERE tc.teacher_id = $1
       ORDER BY qa.completed_at DESC
       LIMIT 10`,
      [session.userId]
    );

    // Get quizzes and scenarios created by this teacher
    const myQuizzes = await query(
      `SELECT q.id, q.title, q.is_published, d.name as disaster_name,
              (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) as question_count
       FROM quizzes q
       JOIN disasters d ON d.id = q.disaster_id
       WHERE q.created_by_teacher_id = $1
       ORDER BY q.created_at DESC`,
      [session.userId]
    );

    const myScenarios = await query(
      `SELECT s.id, s.title, s.is_published, d.name as disaster_name
       FROM scenarios s
       JOIN disasters d ON d.id = s.disaster_id
       WHERE s.created_by_teacher_id = $1
       ORDER BY s.created_at DESC`,
      [session.userId]
    );

    const areaScores = await query<{ area: string; avg_score: number }>(
      `SELECT d.name as area, AVG(qa.score)::float as avg_score
       FROM quiz_attempts qa
       JOIN quizzes q ON q.id = qa.quiz_id
       JOIN disasters d ON d.id = q.disaster_id
       JOIN students s ON s.id = qa.student_id
       JOIN student_classes sc ON sc.student_id = s.id AND sc.is_current = true
       JOIN teacher_classes tc ON tc.class_id = sc.class_id
       WHERE tc.teacher_id = $1
       GROUP BY d.id, d.name
       ORDER BY avg_score DESC`,
      [session.userId]
    );

    const needsImprovement = await query<Record<string, unknown>>(
      `SELECT COUNT(DISTINCT s.id) as count
       FROM students s
       JOIN student_classes sc ON sc.student_id = s.id AND sc.is_current = true
       JOIN teacher_classes tc ON tc.class_id = sc.class_id
       LEFT JOIN readiness_scores rs ON rs.student_id = s.id
       WHERE tc.teacher_id = $1 AND COALESCE(rs.overall_score, 0) < 60`,
      [session.userId]
    );

    return NextResponse.json({
      classes,
      totalStudents: Number(totalStudents[0]?.count) || 0,
      avgReadiness: Math.round(Number(avgReadiness[0]?.avg_score) || 0),
      recentActivity: recentQuizAttempts,
      myQuizzes,
      myScenarios,
      strongestArea: areaScores[0] || null,
      weakestArea: areaScores.length ? areaScores[areaScores.length - 1] : null,
      needsImprovement: Number(needsImprovement[0]?.count) || 0,
      teacherName: session.name,
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
