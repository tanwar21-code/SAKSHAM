import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resources = await query(
      `SELECT * FROM emergency_resources
       WHERE (institution_id = $1 OR institution_id IS NULL) AND is_active = true
       ORDER BY display_order ASC`,
      [session.institutionId]
    );

    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Emergency resources error:', error);
    return NextResponse.json({ error: 'Failed to load resources' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { disaster_id, resource_type, title, content, phone_number, url, display_order } = body;

    const result = await query<{ id: number }>(
      `INSERT INTO emergency_resources (institution_id, disaster_id, resource_type, title, content, phone_number, url, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING id`,
      [session.institutionId, disaster_id || null, resource_type, title, content || null, phone_number || null, url || null, display_order || 0]
    );

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('Create resource error:', error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, content, phone_number, url, resource_type, display_order, is_active } = body;
    if (!id) {
      return NextResponse.json({ error: 'Resource id is required' }, { status: 400 });
    }

    await query(
      `UPDATE emergency_resources SET
         title = COALESCE($3, title),
         content = COALESCE($4, content),
         phone_number = COALESCE($5, phone_number),
         url = COALESCE($6, url),
         resource_type = COALESCE($7, resource_type),
         display_order = COALESCE($8, display_order),
         is_active = COALESCE($9, is_active)
       WHERE id = $1 AND institution_id = $2`,
      [id, session.institutionId, title || null, content || null, phone_number || null, url || null, resource_type || null, display_order ?? null, is_active ?? null]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update resource error:', error);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}
