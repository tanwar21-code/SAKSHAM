import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json({ institutions: [] });
    }

    const results = await query(
      `SELECT id, institution_name FROM institutions 
       WHERE status = 'active' AND institution_name ILIKE $1 
       ORDER BY institution_name ASC LIMIT 10`,
      [`%${q}%`]
    );

    return NextResponse.json({ institutions: results });
  } catch (error) {
    console.error('Institution search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
