import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    const institutionId = session?.institutionId || null;

    // Get emergency resources (global + institution-specific)
    const resources = await query(
      `SELECT id, resource_type, title, content, phone_number, url, display_order
       FROM emergency_resources
       WHERE (institution_id IS NULL ${institutionId ? 'OR institution_id = $1' : ''}) AND is_active = true
       ORDER BY display_order ASC`,
      institutionId ? [institutionId] : []
    );

    // Get safety plan if user has an institution
    let safetyPlan = null;
    if (institutionId) {
      const planResult = await query(
        `SELECT evacuation_instructions, assembly_point, emergency_exit_information, first_aid_location
         FROM safety_plans WHERE institution_id = $1`,
        [institutionId]
      );
      safetyPlan = planResult[0] || null;
    }

    const disasters = await query(
      `SELECT d.id, d.name, d.icon, d.description FROM disasters d ORDER BY d.name ASC`
    );

    const guides = await query(
      `SELECT er.id, er.disaster_id, er.title, er.content, d.name as disaster_name, d.icon
       FROM emergency_resources er
       LEFT JOIN disasters d ON d.id = er.disaster_id
       WHERE er.resource_type = 'guide' AND er.is_active = true
         AND (er.institution_id IS NULL ${institutionId ? 'OR er.institution_id = $1' : ''})
       ORDER BY er.display_order ASC`,
      institutionId ? [institutionId] : []
    );

    return NextResponse.json({ resources, safetyPlan, disasters, guides });
  } catch (error) {
    console.error('Emergency data error:', error);
    return NextResponse.json({ error: 'Failed to load emergency data' }, { status: 500 });
  }
}
