import { query } from '@/lib/db';

export interface ReadinessBreakdown {
  knowledge_score: number;
  scenario_score: number;
  quiz_score: number;
  drill_score: number;
  overall_score: number;
  readiness_level: string;
}

/**
 * SAKSHAM Readiness Score (transparent MVP formula)
 * Knowledge  25%  = average module_progress.progress_percentage
 * Scenario   30%  = average completed scenario_attempts.score
 * Quiz       30%  = average quiz_attempts.score
 * Drill      15%  = participated drills / assigned class drills * 100
 * Overall = knowledge*0.25 + scenario*0.30 + quiz*0.30 + drill*0.15
 * 80–100 Prepared | 60–79 Improving | <60 Needs Practice
 */
export async function recalculateReadiness(studentId: number): Promise<ReadinessBreakdown> {
  const knowledgeResult = await query<Record<string, unknown>>(
    `SELECT COALESCE(AVG(progress_percentage), 0) as score
     FROM module_progress WHERE student_id = $1`,
    [studentId]
  );
  const knowledgeScore = Math.round(Number(knowledgeResult[0]?.score) || 0);

  const scenarioResult = await query<Record<string, unknown>>(
    `SELECT COALESCE(AVG(score), 0) as score
     FROM scenario_attempts WHERE student_id = $1 AND completed_at IS NOT NULL`,
    [studentId]
  );
  const scenarioScore = Math.round(Number(scenarioResult[0]?.score) || 0);

  const quizResult = await query<Record<string, unknown>>(
    `SELECT COALESCE(AVG(score), 0) as score
     FROM quiz_attempts WHERE student_id = $1 AND completed_at IS NOT NULL`,
    [studentId]
  );
  const quizScore = Math.round(Number(quizResult[0]?.score) || 0);

  const drillTotal = await query<Record<string, unknown>>(
    `SELECT COUNT(DISTINCT d.id) as total
     FROM drills d
     JOIN student_classes sc ON sc.class_id = d.class_id AND sc.student_id = $1 AND sc.is_current = true`,
    [studentId]
  );
  const drillParticipated = await query<Record<string, unknown>>(
    `SELECT COUNT(*) as count
     FROM drill_participants WHERE student_id = $1 AND participated = true`,
    [studentId]
  );
  const totalDrills = Number(drillTotal[0]?.total) || 0;
  const participatedDrills = Number(drillParticipated[0]?.count) || 0;
  const drillScore = totalDrills > 0 ? Math.round((participatedDrills / totalDrills) * 100) : 0;

  const overallScore = Math.round(
    knowledgeScore * 0.25 + scenarioScore * 0.3 + quizScore * 0.3 + drillScore * 0.15
  );

  let readinessLevel = 'Needs Practice';
  if (overallScore >= 80) readinessLevel = 'Prepared';
  else if (overallScore >= 60) readinessLevel = 'Improving';

  await query(
    `INSERT INTO readiness_scores (student_id, knowledge_score, scenario_score, quiz_score, drill_score, overall_score, readiness_level, calculated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (student_id) DO UPDATE SET
       knowledge_score = $2, scenario_score = $3, quiz_score = $4,
       drill_score = $5, overall_score = $6, readiness_level = $7,
       calculated_at = NOW()`,
    [studentId, knowledgeScore, scenarioScore, quizScore, drillScore, overallScore, readinessLevel]
  );

  return {
    knowledge_score: knowledgeScore,
    scenario_score: scenarioScore,
    quiz_score: quizScore,
    drill_score: drillScore,
    overall_score: overallScore,
    readiness_level: readinessLevel,
  };
}
