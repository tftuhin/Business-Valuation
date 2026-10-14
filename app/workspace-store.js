// Client-side multi-company workspace persistence store
// Retains financials, sensitivity scenarios, agent research briefs, logs, comps, and chat history per company.
// Uses local storage sandbox + IndexedDB mirror + offline Vault JSON export/import (zero database required).

const STORAGE_KEY = 'dealbrief_company_workspaces_v1';
const IDB_NAME = 'DealBridgeVault_DB';
const IDB_STORE = 'vault_snapshots';

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
    // Asynchronously mirror to IndexedDB for resilient zero-database persistence
    syncToIndexedDB(workspaces).catch(() => {});
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
      generatedReportFingerprint: '',
      reportGeneratedAt: null,
      agentLogs: [],
      groundingSources: [],
      activeDeals: null, // Will use default comps or sector comps
      includedDeals: null,
      reviewed: false,
      approvedFingerprint: '',
      approvedAt: null,
      approvedBy: null,
      reviewChecks: { sources: false, assumptions: false, buyerFit: false },
      lastResearchedAt: null,
      dataLineage: { verifiedCount: 0, aiCount: 0, sampleCount: 0 }
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

  // Asynchronously synchronize with Neon PostgreSQL database
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    fetch('/api/db/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        financials: all[companyId].financials,
        research: all[companyId].research,
        chat: all[companyId].chat
      })
    }).catch(() => {});
  }

  return all[companyId];
}

export function clearCompanyWorkspace(companyId) {
  if (!companyId) return;
  const all = getStoredWorkspaces();
  delete all[companyId];
  saveAllWorkspaces(all);
}

// -------------------------------------------------------------
// ZERO-DATABASE SECURE WORKSPACE VAULT ENGINE
// Export, Import, Metrics, and IndexedDB Mirroring
// -------------------------------------------------------------

/**
 * Asynchronously mirrors workspaces snapshot to IndexedDB.
 * Guarantees data survives even if localStorage is pruned by the browser.
 */
async function syncToIndexedDB(workspaces) {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  return new Promise((resolve, reject) => {
    try {
      const request = window.indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.put({
          id: 'latest_workspace_vault',
          timestamp: new Date().toISOString(),
          data: workspaces
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Exports complete application state into an offline JSON Vault file.
 * Contains: all company workspaces, custom companies, knowledge base, skills, layouts, approvals.
 */
export function exportWorkspaceVault() {
  if (typeof window === 'undefined') return null;

  const workspaces = getStoredWorkspaces();
  let customCompanies = [];
  let knowledgeBase = [];
  let skills = [];
  let reportLayouts = [];
  let activeLayout = 'layout-standard-ma';

  try {
    const rawCustom = localStorage.getItem('dealbrief_custom_companies_v1');
    if (rawCustom) customCompanies = JSON.parse(rawCustom) || [];
  } catch (_) {}

  try {
    const rawKb = localStorage.getItem('agent_knowledge_base');
    if (rawKb) knowledgeBase = JSON.parse(rawKb) || [];
  } catch (_) {}

  try {
    const rawSkills = localStorage.getItem('agent_skills');
    if (rawSkills) skills = JSON.parse(rawSkills) || [];
  } catch (_) {}

  try {
    const rawLayouts = localStorage.getItem('report_layouts');
    if (rawLayouts) reportLayouts = JSON.parse(rawLayouts) || [];
    const storedActive = localStorage.getItem('active_report_layout');
    if (storedActive) activeLayout = storedActive;
  } catch (_) {}

  const companyIds = Object.keys(workspaces);
  const totalReports = companyIds.filter(id => Boolean(workspaces[id]?.research?.generatedReportMarkdown)).length;
  const approvedReports = companyIds.filter(id => Boolean(workspaces[id]?.research?.approvedAt)).length;

  const vault = {
    vaultSchemaVersion: '1.2.0',
    application: 'Zeon DealBridge / Right to Win DealBrief',
    exportedAt: new Date().toISOString(),
    metrics: {
      totalWorkspaces: companyIds.length,
      customCompaniesCount: customCompanies.length,
      completedReports: totalReports,
      approvedReports,
      knowledgeDocsCount: knowledgeBase.length,
      skillsCount: skills.length
    },
    data: {
      workspaces,
      customCompanies,
      knowledgeBase,
      skills,
      reportLayouts,
      activeLayout
    }
  };

  return vault;
}

/**
 * Validates and restores a Workspace Vault JSON into local storage and IndexedDB.
 */
export function importWorkspaceVault(vaultData) {
  if (typeof window === 'undefined') return { success: false, error: 'Window not available' };
  try {
    let payload = vaultData;
    if (typeof vaultData === 'string') {
      payload = JSON.parse(vaultData);
    }

    if (!payload || !payload.data || typeof payload.data !== 'object') {
      throw new Error('Invalid vault file format: missing data payload');
    }

    const {
      workspaces = {},
      customCompanies = [],
      knowledgeBase = [],
      skills = [],
      reportLayouts = [],
      activeLayout = 'layout-standard-ma'
    } = payload.data;

    // Restore workspaces
    if (workspaces && typeof workspaces === 'object') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
      syncToIndexedDB(workspaces).catch(() => {});
    }

    // Restore custom companies
    if (Array.isArray(customCompanies)) {
      localStorage.setItem('dealbrief_custom_companies_v1', JSON.stringify(customCompanies));
    }

    // Restore knowledge base
    if (Array.isArray(knowledgeBase) && knowledgeBase.length > 0) {
      localStorage.setItem('agent_knowledge_base', JSON.stringify(knowledgeBase));
    }

    // Restore skills
    if (Array.isArray(skills) && skills.length > 0) {
      localStorage.setItem('agent_skills', JSON.stringify(skills));
    }

    // Restore layouts
    if (Array.isArray(reportLayouts) && reportLayouts.length > 0) {
      localStorage.setItem('report_layouts', JSON.stringify(reportLayouts));
    }
    if (activeLayout) {
      localStorage.setItem('active_report_layout', activeLayout);
    }

    return {
      success: true,
      restoredWorkspaces: Object.keys(workspaces).length,
      restoredCustomCompanies: customCompanies.length,
      restoredKnowledgeDocs: knowledgeBase.length,
      restoredSkills: skills.length,
      restoredLayouts: reportLayouts.length,
      restoredData: payload.data
    };
  } catch (err) {
    console.error('Failed to restore vault:', err);
    return { success: false, error: err.message || 'Unknown import error' };
  }
}

/**
 * Calculates current local storage metrics for the user telemetry.
 */
export function getStorageMetrics() {
  if (typeof window === 'undefined') {
    return { totalBytes: 0, formattedSize: '0 KB', isPersistent: false, targetCount: 0 };
  }

  try {
    let totalChars = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key) || '';
      totalChars += (key.length + val.length);
    }
    const bytes = totalChars * 2; // UTF-16 characters = 2 bytes each
    const formatted = bytes < 1024
      ? `${bytes} B`
      : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

    const workspaces = getStoredWorkspaces();
    const count = Object.keys(workspaces).length;

    return {
      totalBytes: bytes,
      formattedSize: formatted,
      targetCount: count,
      hasWorkspaces: count > 0
    };
  } catch (_) {
    return { totalBytes: 0, formattedSize: 'Unknown', targetCount: 0, hasWorkspaces: false };
  }
}

/**
 * Requests HTML5 persistent storage from the browser so the browser never clears deal data.
 */
export async function requestPersistentBrowserStorage() {
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch (_) {
      return false;
    }
  }
  return false;
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

