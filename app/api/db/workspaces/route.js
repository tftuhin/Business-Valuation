import { upsertWorkspace, getDb, initDatabaseSchema } from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const sql = getDb();
    await initDatabaseSchema();

    if (companyId) {
      const res = await sql`SELECT * FROM workspaces WHERE company_id = ${companyId};`;
      const ws = res[0] || null;
      return Response.json({ success: true, workspace: ws });
    }

    const all = await sql`SELECT * FROM workspaces;`;
    return Response.json({ success: true, workspaces: all });
  } catch (err) {
    console.error('Error fetching workspace:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { companyId, financials, research, chat } = body;
    if (!companyId) {
      return Response.json({ success: false, error: 'Missing companyId' }, { status: 400 });
    }

    const updated = await upsertWorkspace(companyId, { financials, research, chat });
    return Response.json({ success: true, workspace: updated });
  } catch (err) {
    console.error('Error saving workspace:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
