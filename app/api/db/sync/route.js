import { getFullDatabaseState, seedInitialDataIfEmpty, upsertCompany, upsertWorkspace } from '../../../lib/db';

export async function GET() {
  try {
    const state = await getFullDatabaseState();
    return Response.json({
      success: true,
      connected: true,
      provider: 'Neon PostgreSQL',
      data: state
    });
  } catch (err) {
    console.error('Database sync GET error:', err);
    return Response.json({
      success: false,
      connected: false,
      error: err.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { companies, workspaces, seedDefaults } = body;

    // Seed defaults if requested and tables are empty
    if (seedDefaults) {
      await seedInitialDataIfEmpty(seedDefaults);
    }

    // Sync any custom companies
    if (Array.isArray(companies)) {
      for (const comp of companies) {
        if (comp && comp.id) {
          await upsertCompany(comp);
        }
      }
    }

    // Sync workspaces map
    if (workspaces && typeof workspaces === 'object') {
      for (const [companyId, wsData] of Object.entries(workspaces)) {
        if (companyId && wsData) {
          await upsertWorkspace(companyId, wsData);
        }
      }
    }

    const state = await getFullDatabaseState();
    return Response.json({
      success: true,
      connected: true,
      provider: 'Neon PostgreSQL',
      data: state
    });
  } catch (err) {
    console.error('Database sync POST error:', err);
    return Response.json({
      success: false,
      connected: false,
      error: err.message
    }, { status: 500 });
  }
}
