import { getDb, initDatabaseSchema } from '../../../lib/db';

export async function GET() {
  const startTime = Date.now();
  try {
    const sql = getDb();
    await initDatabaseSchema();
    const [dbInfo, compCount, wsCount] = await Promise.all([
      sql`SELECT current_database() as db, current_user as user, version();`,
      sql`SELECT count(*)::int as count FROM companies;`,
      sql`SELECT count(*)::int as count FROM workspaces;`
    ]);

    const latencyMs = Date.now() - startTime;
    return Response.json({
      success: true,
      connected: true,
      provider: 'Neon PostgreSQL',
      database: dbInfo[0]?.db,
      user: dbInfo[0]?.user,
      counts: {
        companies: compCount[0]?.count || 0,
        workspaces: wsCount[0]?.count || 0
      },
      latencyMs
    });
  } catch (err) {
    return Response.json({
      success: false,
      connected: false,
      error: err.message,
      latencyMs: Date.now() - startTime
    }, { status: 500 });
  }
}
