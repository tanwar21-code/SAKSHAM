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
    const { progress_percentage, completed } = body;

    // Upsert module progress
    await query(
      `INSERT INTO module_progress (student_id, module_id, progress_percentage, completed, started_at, last_accessed_at, completed_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW(), $5)
       ON CONFLICT (student_id, module_id)
       DO UPDATE SET
         progress_percentage = GREATEST(module_progress.progress_percentage, $3),
         completed = $4 OR module_progress.completed,
         last_accessed_at = NOW(),
         completed_at = CASE WHEN $4 THEN NOW() ELSE module_progress.completed_at END`,
      [session.userId, id, progress_percentage, completed || false, completed ? new Date() : null]
    );

    if (completed) {
      await recalculateReadiness(session.userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Module progress error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
