import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plan = await query(
      `SELECT * FROM safety_plans WHERE institution_id = $1 LIMIT 1`,
      [session.institutionId]
    );

    return NextResponse.json({ plan: plan[0] || null });
  } catch (error) {
    console.error('Safety plan error:', error);
    return NextResponse.json({ error: 'Failed to load safety plan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { evacuation_instructions, assembly_point, emergency_exit_information, first_aid_location, additional_information } = body;

    // Upsert
    await query(
      `INSERT INTO safety_plans (institution_id, evacuation_instructions, assembly_point, emergency_exit_information, first_aid_location, additional_information, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (institution_id) DO UPDATE SET
         evacuation_instructions = $2, assembly_point = $3,
         emergency_exit_information = $4, first_aid_location = $5,
         additional_information = $6, updated_by = $7`,
      [session.institutionId, evacuation_instructions, assembly_point, emergency_exit_information, first_aid_location, additional_information, session.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Safety plan update error:', error);
    return NextResponse.json({ error: 'Failed to update safety plan' }, { status: 500 });
  }
}
