import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quiz_id, class_id, due_at } = await request.json();
    if (!quiz_id || !class_id) {
      return NextResponse.json({ error: 'quiz_id and class_id are required' }, { status: 400 });
    }

    const access = await query(
      `SELECT id FROM teacher_classes WHERE teacher_id = $1 AND class_id = $2`,
      [session.userId, class_id]
    );
    if (access.length === 0) {
      return NextResponse.json({ error: 'Access denied to this class' }, { status: 403 });
    }

    await query(
      `INSERT INTO quiz_assignments (quiz_id, teacher_id, class_id, assigned_at, due_at, is_active)
       VALUES ($1, $2, $3, NOW(), $4, true)`,
      [quiz_id, session.userId, class_id, due_at || null]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Assign quiz error:', error);
    return NextResponse.json({ error: 'Failed to assign quiz' }, { status: 500 });
  }
}
