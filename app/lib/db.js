import { neon } from '@neondatabase/serverless';

export function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    'postgresql://neondb_owner:npg_AZRgIC1yFlD5@ep-ancient-brook-b4c7azvc-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  );
}

export function getDb() {
  const url = getDatabaseUrl();
  return neon(url);
}

/**
 * Initializes database tables if they do not exist.
 */
export async function initDatabaseSchema() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sector TEXT NOT NULL,
      location TEXT,
      revenue TEXT,
      growth TEXT,
      margin TEXT,
      retention TEXT,
      net_debt NUMERIC DEFAULT 0,
      website TEXT,
      notes TEXT,
      initials TEXT,
      is_custom BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS workspaces (
      company_id TEXT PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
      financials JSONB DEFAULT '{}'::jsonb,
      research JSONB DEFAULT '{}'::jsonb,
      chat JSONB DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT DEFAULT 'note',
      category TEXT DEFAULT 'General',
      content TEXT,
      source TEXT,
      word_count INTEGER DEFAULT 0,
      enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      filename TEXT,
      description TEXT,
      instructions TEXT,
      enabled BOOLEAN DEFAULT true,
      is_custom BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS report_layouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      sections JSONB DEFAULT '[]'::jsonb,
      is_default BOOLEAN DEFAULT false,
      is_custom BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
}

/**
 * Seeds default data into tables if they are empty.
 */
export async function seedInitialDataIfEmpty(defaults = {}) {
  const sql = getDb();
  await initDatabaseSchema();

  // 1. Seed companies
  const compCountRes = await sql`SELECT count(*)::int as count FROM companies;`;
  if (compCountRes[0]?.count === 0 && Array.isArray(defaults.companies)) {
    for (const c of defaults.companies) {
      await sql`
        INSERT INTO companies (
          id, name, sector, location, revenue, growth, margin, retention, net_debt, website, notes, initials, is_custom
        ) VALUES (
          ${c.id}, ${c.name}, ${c.sector}, ${c.location || ''}, ${String(c.revenue || '')}, ${String(c.growth || '')},
          ${String(c.margin || '')}, ${String(c.retention || '')}, ${Number(c.netDebt ?? 0)}, ${c.website || ''},
          ${c.notes || ''}, ${c.initials || 'CO'}, ${Boolean(c.isCustom)}
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    }
  }

  // 2. Seed Knowledge Base
  const kbCountRes = await sql`SELECT count(*)::int as count FROM knowledge_base;`;
  if (kbCountRes[0]?.count === 0 && Array.isArray(defaults.knowledgeBase)) {
    for (const k of defaults.knowledgeBase) {
      await sql`
        INSERT INTO knowledge_base (
          id, title, type, category, content, word_count, enabled
        ) VALUES (
          ${k.id}, ${k.title}, ${k.type || 'note'}, ${k.category || 'General'}, ${k.content || ''},
          ${k.wordCount || 0}, ${k.enabled !== false}
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    }
  }

  // 3. Seed Skills
  const skillsCountRes = await sql`SELECT count(*)::int as count FROM skills;`;
  if (skillsCountRes[0]?.count === 0 && Array.isArray(defaults.skills)) {
    for (const s of defaults.skills) {
      await sql`
        INSERT INTO skills (
          id, name, filename, description, instructions, enabled, is_custom
        ) VALUES (
          ${s.id}, ${s.name}, ${s.filename || ''}, ${s.description || ''}, ${s.instructions || ''},
          ${s.enabled !== false}, ${Boolean(s.isCustom)}
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    }
  }

  // 4. Seed Report Layouts
  const layoutCountRes = await sql`SELECT count(*)::int as count FROM report_layouts;`;
  if (layoutCountRes[0]?.count === 0 && Array.isArray(defaults.reportLayouts)) {
    for (const l of defaults.reportLayouts) {
      await sql`
        INSERT INTO report_layouts (
          id, name, description, sections, is_default, is_custom
        ) VALUES (
          ${l.id}, ${l.name}, ${l.description || ''}, ${JSON.stringify(l.sections || [])}::jsonb,
          ${Boolean(l.isDefault)}, ${Boolean(l.isCustom)}
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    }
  }
}

/**
 * Retrieves all platform data from Postgres.
 */
export async function getFullDatabaseState() {
  const sql = getDb();
  await initDatabaseSchema();

  const [companies, workspaces, knowledgeBase, skills, reportLayouts] = await Promise.all([
    sql`SELECT * FROM companies ORDER BY is_custom DESC, created_at ASC;`,
    sql`SELECT * FROM workspaces;`,
    sql`SELECT * FROM knowledge_base ORDER BY created_at ASC;`,
    sql`SELECT * FROM skills ORDER BY created_at ASC;`,
    sql`SELECT * FROM report_layouts ORDER BY is_default DESC, created_at ASC;`
  ]);

  // Transform Postgres snake_case records into frontend camelCase structures
  const mappedCompanies = companies.map(c => ({
    id: c.id,
    name: c.name,
    sector: c.sector,
    location: c.location,
    revenue: c.revenue,
    growth: c.growth,
    margin: c.margin,
    retention: c.retention,
    netDebt: Number(c.net_debt ?? 0),
    website: c.website,
    notes: c.notes,
    initials: c.initials,
    isCustom: Boolean(c.is_custom)
  }));

  const mappedWorkspaces = {};
  for (const w of workspaces) {
    mappedWorkspaces[w.company_id] = {
      companyId: w.company_id,
      financials: w.financials || {},
      research: w.research || {},
      chat: w.chat || {},
      updatedAt: w.updated_at
    };
  }

  const mappedKb = knowledgeBase.map(k => ({
    id: k.id,
    title: k.title,
    type: k.type,
    category: k.category,
    content: k.content,
    wordCount: k.word_count,
    enabled: Boolean(k.enabled)
  }));

  const mappedSkills = skills.map(s => ({
    id: s.id,
    name: s.name,
    filename: s.filename,
    description: s.description,
    instructions: s.instructions,
    enabled: Boolean(s.enabled),
    isCustom: Boolean(s.is_custom)
  }));

  const mappedLayouts = reportLayouts.map(l => ({
    id: l.id,
    name: l.name,
    description: l.description,
    sections: Array.isArray(l.sections) ? l.sections : [],
    isDefault: Boolean(l.is_default),
    isCustom: Boolean(l.is_custom)
  }));

  return {
    companies: mappedCompanies,
    workspaces: mappedWorkspaces,
    knowledgeBase: mappedKb,
    skills: mappedSkills,
    reportLayouts: mappedLayouts
  };
}

/**
 * Upserts a single company in Postgres.
 */
export async function upsertCompany(company) {
  const sql = getDb();
  await initDatabaseSchema();

  await sql`
    INSERT INTO companies (
      id, name, sector, location, revenue, growth, margin, retention, net_debt, website, notes, initials, is_custom, updated_at
    ) VALUES (
      ${company.id}, ${company.name}, ${company.sector}, ${company.location || ''}, ${String(company.revenue || '')},
      ${String(company.growth || '')}, ${String(company.margin || '')}, ${String(company.retention || '')},
      ${Number(company.netDebt ?? 0)}, ${company.website || ''}, ${company.notes || ''},
      ${company.initials || 'CO'}, ${Boolean(company.isCustom)}, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      sector = EXCLUDED.sector,
      location = EXCLUDED.location,
      revenue = EXCLUDED.revenue,
      growth = EXCLUDED.growth,
      margin = EXCLUDED.margin,
      retention = EXCLUDED.retention,
      net_debt = EXCLUDED.net_debt,
      website = EXCLUDED.website,
      notes = EXCLUDED.notes,
      initials = EXCLUDED.initials,
      is_custom = EXCLUDED.is_custom,
      updated_at = NOW();
  `;
}

/**
 * Deletes a company from Postgres (cascades to workspace).
 */
export async function deleteCompany(companyId) {
  const sql = getDb();
  await initDatabaseSchema();
  await sql`DELETE FROM companies WHERE id = ${companyId};`;
}

/**
 * Upserts workspace data for a company in Postgres.
 */
export async function upsertWorkspace(companyId, workspaceData) {
  const sql = getDb();
  await initDatabaseSchema();

  const existingRes = await sql`SELECT * FROM workspaces WHERE company_id = ${companyId};`;
  const existing = existingRes[0] || {};

  const mergedFinancials = {
    ...(existing.financials || {}),
    ...(workspaceData.financials || {})
  };
  const mergedResearch = {
    ...(existing.research || {}),
    ...(workspaceData.research || {})
  };
  const mergedChat = {
    ...(existing.chat || {}),
    ...(workspaceData.chat || {})
  };

  await sql`
    INSERT INTO workspaces (company_id, financials, research, chat, updated_at)
    VALUES (
      ${companyId},
      ${JSON.stringify(mergedFinancials)}::jsonb,
      ${JSON.stringify(mergedResearch)}::jsonb,
      ${JSON.stringify(mergedChat)}::jsonb,
      NOW()
    )
    ON CONFLICT (company_id) DO UPDATE SET
      financials = EXCLUDED.financials,
      research = EXCLUDED.research,
      chat = EXCLUDED.chat,
      updated_at = NOW();
  `;

  return {
    companyId,
    financials: mergedFinancials,
    research: mergedResearch,
    chat: mergedChat
  };
}
