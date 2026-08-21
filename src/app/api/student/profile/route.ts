import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT s.full_name, s.email, s.roll_number,
              i.institution_name,
              c.class_name
       FROM students s
       LEFT JOIN institutions i ON i.id = s.institution_id
       LEFT JOIN student_classes sc ON sc.student_id = s.id AND sc.is_current = true
       LEFT JOIN classes c ON c.id = sc.class_id
       WHERE s.id = $1`,
      [session.userId]
    );

    return NextResponse.json({ profile: result[0] || null });
  } catch (error) {
    console.error('Student profile error:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
