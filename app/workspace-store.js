// Client-side multi-company workspace persistence store
// Retains financials, sensitivity scenarios, agent research briefs, logs, comps, and chat history per company.

const STORAGE_KEY = 'dealbrief_company_workspaces_v1';

export function getStoredWorkspaces() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (err) {
    console.error('Failed to load workspaces from localStorage:', err);
    return {};
  }
}

export function saveAllWorkspaces(workspaces) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
  } catch (err) {
    console.error('Failed to save workspaces to localStorage:', err);
  }
}

export function getCompanyWorkspace(companyId, companyDefaults = {}) {
  const all = getStoredWorkspaces();
  if (all[companyId]) {
    return all[companyId];
  }

  // Generate initial default workspace for a new company
  const defaultWorkspace = {
    companyId,
    financials: {
      revenue: parseAmountM(companyDefaults.revenue || 25),
      growth: parsePercent(companyDefaults.growth || 30),
      margin: parsePercent(companyDefaults.margin || 18),
      retention: parsePercent(companyDefaults.retention || 112),
      netDebt: companyDefaults.netDebt ?? 5,
      activeScenario: 'base'
    },
    research: {
      agentStatus: 'idle',
      generatedReportMarkdown: '',
      agentLogs: [],
      groundingSources: [],
      activeDeals: null, // Will use default comps or sector comps
      includedDeals: null,
      reviewed: false,
      reviewChecks: { sources: false, assumptions: false, buyerFit: false },
      lastResearchedAt: null
    },
    chat: {
      messages: [],
      lastUpdated: null
    }
  };

  return defaultWorkspace;
}

export function saveCompanyWorkspace(companyId, partialData) {
  if (!companyId) return;
  const all = getStoredWorkspaces();
  const existing = all[companyId] || {};

  all[companyId] = {
    ...existing,
    ...partialData,
    companyId,
    financials: {
      ...(existing.financials || {}),
      ...(partialData.financials || {})
    },
    research: {
      ...(existing.research || {}),
      ...(partialData.research || {})
    },
    chat: {
      ...(existing.chat || {}),
      ...(partialData.chat || {})
    },
    updatedAt: new Date().toISOString()
  };

  saveAllWorkspaces(all);
  return all[companyId];
}

export function clearCompanyWorkspace(companyId) {
  if (!companyId) return;
  const all = getStoredWorkspaces();
  delete all[companyId];
  saveAllWorkspaces(all);
}

function parseAmountM(value) {
  const text = String(value ?? '').trim().toUpperCase();
  const number = Number.parseFloat(text.replace(/[^0-9.\-]/g, ''));
  if (!Number.isFinite(number)) return 0;
  if (text.includes('B')) return number * 1000;
  if (text.includes('K')) return number / 1000;
  return number;
}

function parsePercent(value) {
  const number = Number.parseFloat(String(value ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(number) ? number : 0;
}
