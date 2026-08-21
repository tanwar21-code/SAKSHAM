import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the student_dashboard_summary view
    let dashboard: Record<string, unknown>[] = [];
    try {
      dashboard = await query(
        `SELECT * FROM student_dashboard_summary WHERE student_id = $1`,
        [session.userId]
      );
    } catch {
      dashboard = await query(
        `SELECT s.id as student_id, s.institution_id, s.full_name, s.roll_number,
                COALESCE(rs.overall_score, 0) as readiness_score,
                COALESCE(rs.knowledge_score, 0) as knowledge_score,
                COALESCE(rs.scenario_score, 0) as scenario_score,
                COALESCE(rs.quiz_score, 0) as quiz_score,
                COALESCE(rs.drill_score, 0) as drill_score,
                COALESCE(rs.readiness_level, 'Needs Practice') as readiness_level,
                (SELECT COUNT(*) FROM learning_modules WHERE is_published = true) as total_modules,
                (SELECT COUNT(*) FROM module_progress WHERE student_id = s.id AND completed = true) as completed_modules,
                (SELECT COUNT(*) FROM quiz_attempts WHERE student_id = s.id AND completed_at IS NOT NULL) as quizzes_completed,
                (SELECT COUNT(*) FROM scenario_attempts WHERE student_id = s.id AND completed_at IS NOT NULL) as scenarios_completed
         FROM students s
         LEFT JOIN readiness_scores rs ON rs.student_id = s.id
         WHERE s.id = $1`,
        [session.userId]
      );
    }

    // Get recent module progress
    const recentModules = await query(
      `SELECT lm.id, lm.title, d.name as disaster_name, d.icon,
              mp.progress_percentage, mp.completed
       FROM learning_modules lm
       JOIN disasters d ON d.id = lm.disaster_id
       LEFT JOIN module_progress mp ON mp.module_id = lm.id AND mp.student_id = $1
       WHERE lm.is_published = true
       ORDER BY mp.last_accessed_at DESC NULLS LAST
       LIMIT 5`,
      [session.userId]
    );

    // Get areas to improve (low scoring categories)
    const weakAreas = await query(
      `SELECT d.name as area, COALESCE(AVG(qa.score), 0) as avg_score
       FROM disasters d
       JOIN quizzes q ON q.disaster_id = d.id
       JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.student_id = $1
       GROUP BY d.id, d.name
       HAVING AVG(qa.score) < 70
       ORDER BY avg_score ASC
       LIMIT 3`,
      [session.userId]
    );

    // Get recent quiz attempts count and drill count
    const quizCount = await query(
      `SELECT COUNT(*) as count FROM quiz_attempts WHERE student_id = $1`,
      [session.userId]
    );

    const drillCount = await query(
      `SELECT COUNT(*) as count FROM drill_participants WHERE student_id = $1 AND participated = true`,
      [session.userId]
    );

    const scenarioCount = await query(
      `SELECT COUNT(*) as count FROM scenario_attempts WHERE student_id = $1`,
      [session.userId]
    );

    return NextResponse.json({
      summary: dashboard[0] || {
        full_name: session.name,
        readiness_score: 0,
        knowledge_score: 0,
        scenario_score: 0,
        quiz_score: 0,
        drill_score: 0,
        readiness_level: 'Needs Practice',
        total_modules: 0,
        completed_modules: 0,
        quizzes_completed: 0,
        scenarios_completed: 0,
      },
      recentModules,
      weakAreas,
      quizCount: Number(quizCount[0]?.count || 0),
      drillCount: Number(drillCount[0]?.count || 0),
      scenarioCount: Number(scenarioCount[0]?.count || 0),
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
