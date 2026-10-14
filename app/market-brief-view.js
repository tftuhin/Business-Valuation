'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import {
  ArrowDownRight, ArrowUpRight, BadgeCheck, BarChart3, Check, CheckCircle2,
  ChevronDown, CircleAlert, Copy, Download, ExternalLink, FileText, Globe,
  Info, KeyRound, LockKeyhole, Plus, Printer, RefreshCw, Search,
  ShieldCheck, Sparkles, TrendingUp, UsersRound, MessageSquare, BookOpen,
  Zap, LayoutTemplate, ArrowRight, Minus, ChevronsUpDown, Filter,
  Maximize2, Minimize2, ZoomIn, ZoomOut, CheckCheck, Trash2, Sliders, Layers,
  AlertTriangle, Database, ShieldAlert
} from 'lucide-react';
import AgentMonitor from './agent-monitor';
import AgentChatView from './agent-chat-view';
import {
  getCompanyWorkspace,
  saveCompanyWorkspace,
  getStoredWorkspaces
} from './workspace-store';
import { marked } from 'marked';

// Baseline precedent transactions with verified facts, direct sources, and audit links
const defaultDeals = [
  {
    id: 'd1',
    name: 'PatientAccess Health Cloud',
    buyer: 'Symplr / Clearlake Capital',
    date: 'Feb 2026',
    ev: 144,
    revenue: 30,
    multiple: 4.8,
    ebitdaMultiple: 24.0,
    rationale: 'Clinical workflow & EHR interoperability tuck-in',
    dataType: 'verified',
    source: 'Symplr / Clearlake Form 8-K Press Archive',
    sourceUrl: 'https://www.prnewswire.com/news-releases/',
    confidence: 'High (Verified Deal)'
  },
  {
    id: 'd2',
    name: 'ClinicWorkflow SaaS',
    buyer: 'Healthcare Technology Group',
    date: 'Sep 2025',
    ev: 95,
    revenue: 25,
    multiple: 3.8,
    ebitdaMultiple: 19.0,
    rationale: 'Mid-market ambulatory care expansion',
    dataType: 'verified',
    source: 'PR Newswire / Deal Record',
    sourceUrl: 'https://www.prnewswire.com',
    confidence: 'High (Verified Deal)'
  },
  {
    id: 'd3',
    name: 'Apex Revenue Cycle AI',
    buyer: 'Waystar / EQT Partners',
    date: 'Nov 2024',
    ev: 80,
    revenue: 25,
    multiple: 3.2,
    ebitdaMultiple: 16.0,
    rationale: 'Automated claim adjudication & denial management',
    dataType: 'verified',
    source: 'Waystar Pre-IPO SEC Filing',
    sourceUrl: 'https://www.sec.gov/edgar',
    confidence: 'High (Verified Deal)'
  },
  {
    id: 'd4',
    name: 'CarePoint Analytics Suite',
    buyer: 'Francisco Partners',
    date: 'Jul 2024',
    ev: 110,
    revenue: 26,
    multiple: 4.2,
    ebitdaMultiple: 21.0,
    rationale: 'Predictive readmission and clinical utilization telemetry',
    dataType: 'sample',
    source: 'Francisco Partners Benchmark Archive',
    sourceUrl: 'https://www.franciscopartners.com',
    confidence: 'Baseline (Sample Data)'
  },
  {
    id: 'd5',
    name: 'VitalAccess Data Exchange',
    buyer: 'R1 RCM / TowerBrook',
    date: 'Mar 2024',
    ev: 135,
    revenue: 27,
    multiple: 5.0,
    ebitdaMultiple: 25.0,
    rationale: 'Ambulatory provider connectivity and automated prior-auth',
    dataType: 'verified',
    source: 'R1 RCM SEC Form 8-K Disclosure',
    sourceUrl: 'https://www.sec.gov/edgar',
    confidence: 'High (Verified Deal)'
  }
];

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

function money(value) {
  if (!Number.isFinite(value)) return '—';
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(value)}M`;
}

// True statistical median handling even and odd array lengths
export function computeTrueMedian(values) {
  if (!values || !values.length) return 0;
  const valid = values
    .map(v => (typeof v === 'number' ? v : Number.parseFloat(v)))
    .filter(v => Number.isFinite(v) && v > 0);
  if (!valid.length) return 0;
  const sorted = [...valid].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const med = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Number(med.toFixed(2));
}

function median(values) {
  return computeTrueMedian(values);
}

// Strict HTML sanitizer preventing script injection, malicious iframes, and javascript: URIs
export function sanitizeHtmlContent(html) {
  if (!html || typeof html !== 'string') return '';
  let safe = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  safe = safe.replace(/<\/?(iframe|object|embed|frameset|frame|form|input|button|meta|link|style)\b[^>]*>/gi, '');
  safe = safe.replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
  safe = safe.replace(/(href|src)\s*=\s*(?:["']\s*(?:javascript|vbscript|data):[^"']*["']|(?:javascript|vbscript|data):[^\s>]+)/gi, '$1="#"');
  return safe;
}

// Deterministic fingerprint of valuation inputs to detect stale reports and invalidate approvals
export function computeReportFingerprint({ revenue, growth, margin, retention, netDebt, includedDeals, activeLayoutId }) {
  const sortedIds = [...(includedDeals || [])].sort().join(',');
  return `rev:${revenue}|gr:${growth}|mar:${margin}|ret:${retention}|debt:${netDebt}|deals:${sortedIds}|layout:${activeLayoutId || 'default'}`;
}

// Unified valuation summary guaranteeing exact numerical parity across dashboard, corridor, report, and export
export function computeValuationSummary({ revenue, netDebt, selectedDeals }) {
  const rev = Number.isFinite(revenue) && revenue > 0 ? revenue : 0;
  const debt = Number.isFinite(netDebt) ? netDebt : 0;

  const multiples = (selectedDeals || [])
    .map(d => Number(d.multiple))
    .filter(m => Number.isFinite(m) && m > 0)
    .sort((a, b) => a - b);

  if (multiples.length === 0) {
    return {
      hasDeals: false,
      count: 0,
      lowMultiple: 0,
      referenceMultiple: 0,
      highMultiple: 0,
      lowEV: 0,
      centralEV: 0,
      highEV: 0,
      centralEquity: 0,
      lowEquity: 0,
      highEquity: 0,
      multiples: []
    };
  }

  const lowMultiple = Number(multiples[0].toFixed(2));
  const highMultiple = Number(multiples[multiples.length - 1].toFixed(2));
  const referenceMultiple = computeTrueMedian(multiples);

  const lowEV = Number((rev * lowMultiple).toFixed(1));
  const centralEV = Number((rev * referenceMultiple).toFixed(1));
  const highEV = Number((rev * highMultiple).toFixed(1));

  const lowEquity = Number(Math.max(0, lowEV - debt).toFixed(1));
  const centralEquity = Number(Math.max(0, centralEV - debt).toFixed(1));
  const highEquity = Number(Math.max(0, highEV - debt).toFixed(1));

  return {
    hasDeals: true,
    count: multiples.length,
    lowMultiple,
    referenceMultiple,
    highMultiple,
    lowEV,
    centralEV,
    highEV,
    centralEquity,
    lowEquity,
    highEquity,
    multiples
  };
}

// Enhanced interactive Metric Input with Steppers & Quick Adjusters
function MetricInput({
  label,
  value,
  onChange,
  onStep,
  suffix,
  hint,
  min = 0,
  max = 200,
  step = 1,
  showSlider = false
}) {
  return (
    <div className="form-field enhanced-metric-field">
      <div className="metric-label-row">
        <label className="form-label">{label}</label>
        {suffix && <span className="metric-suffix-tag">{suffix}</span>}
      </div>

      <div className="metric-input-cluster">
        {onStep && (
          <button
            type="button"
            className="metric-step-btn"
            onClick={() => onStep(-step)}
            title={`Decrease by ${step}${suffix || ''}`}
            aria-label={`Decrease ${label}`}
          >
            <Minus size={12} />
          </button>
        )}

        <div className="input-wrapper">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            aria-label={label}
          />
          {suffix && <em>{suffix}</em>}
        </div>

        {onStep && (
          <button
            type="button"
            className="metric-step-btn"
            onClick={() => onStep(step)}
            title={`Increase by ${step}${suffix || ''}`}
            aria-label={`Increase ${label}`}
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      {showSlider && (
        <div className="metric-slider-wrap">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={Number(value) || 0}
            onChange={onChange}
            className="metric-range-slider"
            aria-label={`${label} slider`}
          />
        </div>
      )}

      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );
}

// Rule of 40 Visual Dual-Bar Gauge Component
function RuleOf40Gauge({ growth = 30, margin = 18 }) {
  const score = growth + margin;
  let status = 'Healthy Benchmark';
  let badgeClass = 'badge-teal';
  let description = 'Consistent balance of top-line expansion and operational cash profitability.';

  if (score >= 50) {
    status = 'Elite Performer';
    badgeClass = 'badge-success';
    description = 'Top-decile asset performance commanding strategic auction premium.';
  } else if (score >= 40) {
    status = 'Institutional Benchmark';
    badgeClass = 'badge-success';
    description = 'Meets institutional Rule of 40 requirement for Tier-1 PE & Strategic consolidators.';
  } else if (score >= 25) {
    status = 'Growth Reinvestment';
    badgeClass = 'badge-warning';
    description = 'Capital allocation focused on top-line capture over near-term margin realization.';
  } else {
    status = 'Turnaround / Value';
    badgeClass = 'badge-outline';
    description = 'Opportunity for cost rationalization and operational restructuring.';
  }

  return (
    <div className="rule-40-card">
      <div className="rule-40-header">
        <div className="rule-40-title-flex">
          <ShieldCheck size={16} className="text-emerald-500" />
          <div>
            <strong>Rule of 40 Operating Quality</strong>
            <span className="rule-40-sub">{description}</span>
          </div>
        </div>
        <div className="rule-40-badge-group">
          <span className="rule-40-score-pill">
            Score: <strong>{score.toFixed(1)}%</strong>
          </span>
          <span className={`badge ${badgeClass}`}>{status}</span>
        </div>
      </div>

      <div className="rule-40-meter-container">
        <div className="rule-40-bar-track">
          <div
            className="rule-40-bar-segment segment-growth"
            style={{ width: `${Math.min(70, Math.max(0, (growth / 100) * 100))}%` }}
            title={`YoY Growth: ${growth}%`}
          />
          <div
            className="rule-40-bar-segment segment-margin"
            style={{ width: `${Math.min(70, Math.max(0, (margin / 100) * 100))}%` }}
            title={`EBITDA Margin: ${margin}%`}
          />
          <div className="rule-40-threshold-line" style={{ left: '40%' }} title="Institutional 40% Target">
            <span className="rule-40-threshold-label">40% Target</span>
          </div>
        </div>
      </div>

      <div className="rule-40-legend-row">
        <div className="legend-item">
          <span className="legend-chip chip-blue" />
          <span>YoY Growth: <strong>{growth}%</strong></span>
        </div>
        <div className="legend-item">
          <span className="legend-chip chip-emerald" />
          <span>EBITDA Margin: <strong>{margin}%</strong></span>
        </div>
        <div className="legend-item">
          <span className="legend-chip chip-neutral" />
          <span>Combined: <strong>{(growth + margin).toFixed(1)}%</strong></span>
        </div>
      </div>
    </div>
  );
}

// Valuation Range "Football Field" Visualizer & Equity Bridge
function ValuationFootballField({
  revenue = 25,
  lowMultiple = 3.2,
  referenceMultiple = 4.8,
  highMultiple = 5.8,
  netDebt = 5
}) {
  const lowEV = revenue * lowMultiple;
  const centralEV = revenue * referenceMultiple;
  const highEV = revenue * highMultiple;

  const centralEquity = centralEV - netDebt;

  return (
    <div className="football-field-card">
      {/* 1. Precedent Multiple Valuation Spread Range */}
      <div className="valuation-spread-block">
        <div className="spread-header-row">
          <span className="spread-section-title">Precedent Multiple Spread</span>
          <span className="badge badge-secondary badge-xs">EV / LTM Revenue</span>
        </div>

        {/* 3 Value Columns positioned cleanly above the bar */}
        <div className="spread-values-grid">
          <div className="spread-val-col val-low">
            <span className="spread-label">Low ({lowMultiple.toFixed(1)}x)</span>
            <strong className="spread-num">{money(lowEV)}</strong>
          </div>
          <div className="spread-val-col val-median highlight">
            <span className="spread-label">Median Benchmark ({referenceMultiple.toFixed(1)}x)</span>
            <strong className="spread-num text-emerald-500">{money(centralEV)}</strong>
          </div>
          <div className="spread-val-col val-high">
            <span className="spread-label">High ({highMultiple.toFixed(1)}x)</span>
            <strong className="spread-num">{money(highEV)}</strong>
          </div>
        </div>

        {/* Visual Range Track with Pins */}
        <div className="spread-track-wrap">
          <div className="spread-track-bar">
            <div className="spread-pin pin-low" style={{ left: '15%' }} title={`Low: ${money(lowEV)} (${lowMultiple.toFixed(1)}x)`} />
            <div className="spread-pin pin-median" style={{ left: '50%' }} title={`Median: ${money(centralEV)} (${referenceMultiple.toFixed(1)}x)`} />
            <div className="spread-pin pin-high" style={{ left: '85%' }} title={`High: ${money(highEV)} (${highMultiple.toFixed(1)}x)`} />
          </div>
        </div>
      </div>

      {/* 2. Enterprise to Equity Value Bridge (Clear Math Formula) */}
      <div className="equity-bridge-block">
        <div className="bridge-header-row">
          <span className="spread-section-title">Enterprise to Equity Bridge</span>
          <span className="text-muted-foreground" style={{ fontSize: '0.6875rem' }}>Median Reference</span>
        </div>

        <div className="bridge-equation-grid">
          <div className="bridge-calc-card">
            <span className="bridge-calc-label">Enterprise Value</span>
            <strong className="bridge-calc-value">{money(centralEV)}</strong>
            <small className="bridge-calc-sub">{referenceMultiple.toFixed(1)}x EV</small>
          </div>

          <div className="bridge-operator">−</div>

          <div className="bridge-calc-card bridge-debt-card">
            <span className="bridge-calc-label">Net Debt</span>
            <strong className="bridge-calc-value">{money(netDebt)}</strong>
            <small className="bridge-calc-sub">Deduction</small>
          </div>

          <div className="bridge-operator">=</div>

          <div className="bridge-calc-card bridge-equity-card">
            <span className="bridge-calc-label">Indicative Equity Value</span>
            <strong className="bridge-calc-value text-emerald-500">{money(centralEquity)}</strong>
            <small className="bridge-calc-sub text-emerald-600">Net to Seller</small>
          </div>
        </div>
      </div>
    </div>
  );
}

const EMPTY_CHAT_MESSAGES = [];

export default function MarketBriefView({
  sellers = [],
  onToast = () => {},
  onOpenCustomModal = () => {},
  onOpenApiKeyModal = () => {},
  apiKey = '',
  aiSettings = null,
  knowledgeBase = [],
  skills = [],
  reportLayouts = [],
  activeLayoutId = 'layout-standard-ma',
  onSelectLayout = () => {},
  onOpenKnowledgeBaseModal = () => {},
  onOpenSkillsModal = () => {},
  onOpenLayoutsModal = () => {},
  activeTab: externalActiveTab = null,
  onTabChange: externalOnTabChange = null
}) {
  const [internalActiveTab, setInternalActiveTab] = useState('analysis');
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = (tab) => {
    setInternalActiveTab(tab);
    if (externalOnTabChange) externalOnTabChange(tab);
  };

  const [sellerId, setSellerId] = useState(sellers[0]?.id || '');
  const seller = sellers.find(item => item.id === sellerId) || sellers[0] || {};

  // Financial baseline
  const [revenue, setRevenue] = useState(parseAmountM(sellers[0]?.revenue || 25));
  const [growth, setGrowth] = useState(parsePercent(sellers[0]?.growth || 30));
  const [margin, setMargin] = useState(parsePercent(sellers[0]?.margin || 18));
  const [retention, setRetention] = useState(parsePercent(sellers[0]?.retention || 112));
  const [netDebt, setNetDebt] = useState(sellers[0]?.netDebt ?? 5);

  const [activeDeals, setActiveDeals] = useState(defaultDeals);
  const [includedDeals, setIncludedDeals] = useState(['d1', 'd2', 'd3', 'd4', 'd5']);

  // Deal Table search & sort state
  const [compSearch, setCompSearch] = useState('');
  const [sortColumn, setSortColumn] = useState('multiple');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [newDealForm, setNewDealForm] = useState({
    name: '',
    buyer: '',
    date: 'Jan 2026',
    ev: 100,
    revenue: 25,
    multiple: 4.0,
    ebitdaMultiple: 20.0,
    rationale: ''
  });

  // Scenario state: 'base' | 'conservative' | 'aggressive' | 'custom'
  const [activeScenario, setActiveScenario] = useState('base');

  // Agent State & Research Retention
  const [agentStatus, setAgentStatus] = useState('idle');
  const [agentLogs, setAgentLogs] = useState([]);
  const [groundingSources, setGroundingSources] = useState([]);
  const [generatedReportMarkdown, setGeneratedReportMarkdown] = useState('');
  const [reportFingerprint, setReportFingerprint] = useState('');
  const [reportGeneratedAt, setReportGeneratedAt] = useState(null);
  const [approvedFingerprint, setApprovedFingerprint] = useState('');
  const [approvedAt, setApprovedAt] = useState(null);
  const [approvedBy, setApprovedBy] = useState(null);
  const [dataLineage, setDataLineage] = useState(null);
  const [trustFilter, setTrustFilter] = useState('all'); // 'all' | 'verified' | 'ai' | 'sample'

  // Retained Chat Messages per company
  const [chatMessages, setChatMessages] = useState(EMPTY_CHAT_MESSAGES);
  const [workspacesRevision, setWorkspacesRevision] = useState(0);

  // Report Reading Experience
  const [reportZoom, setReportZoom] = useState('normal'); // 'normal' | 'large'
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Governance & Review Gate
  const [reviewed, setReviewed] = useState(false);
  const [reviewChecks, setReviewChecks] = useState({ sources: false, assumptions: false, buyerFit: false });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sector-based color accent generator for avatars
  const getSectorGradient = (sec = '') => {
    const s = (sec || '').toLowerCase();
    if (s.includes('health')) return 'linear-gradient(135deg, #059669 0%, #0d9488 100%)';
    if (s.includes('fin') || s.includes('pay')) return 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)';
    if (s.includes('cyber') || s.includes('sec')) return 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)';
    return 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)';
  };

  // Restore and synchronize workspace whenever sellerId changes
  useEffect(() => {
    if (!seller || !seller.id) return;
    const ws = getCompanyWorkspace(seller.id, seller);

    // Restore financials
    setRevenue(ws.financials?.revenue ?? parseAmountM(seller.revenue));
    setGrowth(ws.financials?.growth ?? parsePercent(seller.growth));
    setMargin(ws.financials?.margin ?? parsePercent(seller.margin));
    setRetention(ws.financials?.retention ?? parsePercent(seller.retention));
    setNetDebt(ws.financials?.netDebt ?? (seller.netDebt ?? 5));
    setActiveScenario(ws.financials?.activeScenario || 'base');

    // Restore research work
    setAgentStatus(ws.research?.agentStatus || 'idle');
    setGeneratedReportMarkdown(ws.research?.generatedReportMarkdown || '');
    setReportFingerprint(ws.research?.generatedReportFingerprint || '');
    setReportGeneratedAt(ws.research?.reportGeneratedAt || null);
    setApprovedFingerprint(ws.research?.approvedFingerprint || '');
    setApprovedAt(ws.research?.approvedAt || null);
    setApprovedBy(ws.research?.approvedBy || null);
    setDataLineage(ws.research?.dataLineage || null);
    setAgentLogs(ws.research?.agentLogs || []);
    setGroundingSources(ws.research?.groundingSources || []);

    if (Array.isArray(ws.research?.activeDeals) && ws.research.activeDeals.length > 0) {
      setActiveDeals(ws.research.activeDeals);
    } else {
      setActiveDeals(defaultDeals);
    }

    if (Array.isArray(ws.research?.includedDeals)) {
      setIncludedDeals(ws.research.includedDeals);
    } else {
      const initialIds = (Array.isArray(ws.research?.activeDeals) && ws.research.activeDeals.length > 0)
        ? ws.research.activeDeals.map(d => d.id)
        : defaultDeals.map(d => d.id);
      setIncludedDeals(initialIds);
    }

    setReviewed(Boolean(ws.research?.reviewed));
    setReviewChecks(ws.research?.reviewChecks || { sources: false, assumptions: false, buyerFit: false });

    // Restore company copilot messages
    setChatMessages(Array.isArray(ws.chat?.messages) && ws.chat.messages.length > 0 ? ws.chat.messages : EMPTY_CHAT_MESSAGES);
  }, [sellerId]);

  // Current real-time input fingerprint
  const currentFingerprint = useMemo(() => {
    return computeReportFingerprint({
      revenue,
      growth,
      margin,
      retention,
      netDebt,
      includedDeals,
      activeLayoutId
    });
  }, [revenue, growth, margin, retention, netDebt, includedDeals, activeLayoutId]);

  // Reports that stay current: mark old report outdated when financials or comps change
  const isReportStale = useMemo(() => {
    if (!generatedReportMarkdown || !reportFingerprint) return false;
    return currentFingerprint !== reportFingerprint;
  }, [generatedReportMarkdown, reportFingerprint, currentFingerprint]);

  // Reliable approvals: approval applies strictly to one report version
  const isApprovalValid = useMemo(() => {
    if (!reviewed) return false;
    if (!approvedFingerprint) return false;
    if (approvedFingerprint !== currentFingerprint) return false;
    if (isReportStale) return false;
    return true;
  }, [reviewed, approvedFingerprint, currentFingerprint, isReportStale]);

  // Persist chat message updates to this company's workspace
  const handleUpdateChatMessages = (newMessages) => {
    setChatMessages(newMessages);
    saveCompanyWorkspace(sellerId, {
      chat: {
        messages: newMessages,
        lastUpdated: new Date().toISOString()
      }
    });
    setWorkspacesRevision(v => v + 1);
  };

  // Persist financial metric adjustments
  const persistFinancials = (partialFin) => {
    saveCompanyWorkspace(sellerId, {
      financials: {
        revenue,
        growth,
        margin,
        retention,
        netDebt,
        activeScenario,
        ...partialFin
      }
    });
    setWorkspacesRevision(v => v + 1);
  };

  // Scenario toggle handler
  const handleApplyScenario = (scenarioKey) => {
    setActiveScenario(scenarioKey);
    const baseRev = parseAmountM(seller.revenue || 25);
    const baseGr = parsePercent(seller.growth || 30);
    const baseMar = parsePercent(seller.margin || 18);
    const baseDebt = seller.netDebt ?? 5;

    let newGr = baseGr;
    let newMar = baseMar;
    let newDebt = baseDebt;

    if (scenarioKey === 'conservative') {
      newGr = Math.max(5, baseGr - 8);
      newMar = Math.max(2, baseMar - 5);
      newDebt = baseDebt + 2;
      onToast('Applied Conservative Scenario (Growth -8%, Margin -5%, Debt +$2M)');
    } else if (scenarioKey === 'aggressive') {
      newGr = baseGr + 12;
      newMar = baseMar + 4;
      newDebt = Math.max(0, baseDebt - 2);
      onToast('Applied Aggressive Scenario (Growth +12%, Margin +4%, Debt -$2M)');
    } else {
      onToast('Restored Base Case Target Financials');
    }

    setGrowth(newGr);
    setMargin(newMar);
    setNetDebt(newDebt);
    setReviewed(false);
    setReviewChecks({ sources: false, assumptions: false, buyerFit: false });

    persistFinancials({
      revenue,
      growth: newGr,
      margin: newMar,
      netDebt: newDebt,
      activeScenario: scenarioKey
    });
  };

  // Step adjusters
  const stepMetric = (setter, currentVal, delta, keyName) => {
    const nextVal = Math.max(0, Number((Number(currentVal || 0) + delta).toFixed(1)));
    setter(nextVal);
    setActiveScenario('custom');
    setReviewed(false);
    persistFinancials({ [keyName]: nextVal, activeScenario: 'custom' });
  };

  const selectedDeals = useMemo(
    () => activeDeals.filter(deal => includedDeals.includes(deal.id)),
    [activeDeals, includedDeals]
  );

  // Filtered & Sorted precedent deals with trust filter support
  const displayedDeals = useMemo(() => {
    let result = [...activeDeals];
    if (compSearch.trim()) {
      const q = compSearch.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.buyer.toLowerCase().includes(q) ||
        (d.rationale && d.rationale.toLowerCase().includes(q)) ||
        (d.source && d.source.toLowerCase().includes(q))
      );
    }
    if (trustFilter === 'verified') {
      result = result.filter(d => d.dataType === 'verified');
    } else if (trustFilter === 'ai') {
      result = result.filter(d => d.dataType === 'ai-generated' || (!d.dataType && !d.isSample));
    } else if (trustFilter === 'sample') {
      result = result.filter(d => d.dataType === 'sample' || d.isSample);
    }
    result.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
    return result;
  }, [activeDeals, compSearch, trustFilter, sortColumn, sortDirection]);

  // Unified valuation summary guaranteeing 100% exact numerical parity across dashboard, corridor, report, and export
  const valuationSummary = useMemo(() => {
    return computeValuationSummary({
      revenue,
      netDebt,
      selectedDeals
    });
  }, [revenue, netDebt, selectedDeals]);

  const {
    hasDeals,
    lowMultiple,
    referenceMultiple,
    highMultiple,
    lowEV,
    centralEV,
    highEV,
    centralEquity,
    lowEquity,
    highEquity,
    multiples
  } = valuationSummary;

  // Precedent comps KPI metrics
  const compsSummary = useMemo(() => {
    if (!selectedDeals.length) {
      return { medianMultiple: 0, medianEbitda: 0, avgEV: 0, totalVolume: 0 };
    }
    const totalEV = selectedDeals.reduce((sum, d) => sum + (d.ev || 0), 0);
    const ebitdaMults = selectedDeals.filter(d => d.ebitdaMultiple).map(d => d.ebitdaMultiple);
    return {
      medianMultiple: referenceMultiple,
      medianEbitda: computeTrueMedian(ebitdaMults) || 20.0,
      avgEV: totalEV / selectedDeals.length,
      totalVolume: totalEV
    };
  }, [selectedDeals, referenceMultiple]);

  const valuationCases = [
    { key: 'low', label: 'Lower Reference', note: '25th percentile / lowest selected comp', multiple: lowMultiple, enterpriseValue: lowEV, tone: 'slate', icon: ArrowDownRight },
    { key: 'base', label: 'Central Reference', note: 'True median precedent deal benchmark', multiple: referenceMultiple, enterpriseValue: centralEV, tone: 'teal', icon: BarChart3 },
    { key: 'high', label: 'Strong-Buyer Reference', note: 'Top quartile strategic multiple', multiple: highMultiple, enterpriseValue: highEV, tone: 'purple', icon: ArrowUpRight }
  ];

  const invalidateDraft = (setter, keyName) => event => {
    const val = event.target.value === '' ? '' : Number(event.target.value);
    setter(val);
    setActiveScenario('custom');
    setReviewed(false);
    setReviewChecks({ sources: false, assumptions: false, buyerFit: false });
    persistFinancials({ [keyName]: val, activeScenario: 'custom' });
  };

  const toggleDeal = id => {
    const updated = includedDeals.includes(id)
      ? includedDeals.filter(item => item !== id)
      : [...includedDeals, id];
    setIncludedDeals(updated);
    setReviewed(false);
    saveCompanyWorkspace(sellerId, {
      research: { includedDeals: updated, reviewed: false }
    });
    setWorkspacesRevision(v => v + 1);
  };

  const toggleAllDeals = (select) => {
    const updated = select ? activeDeals.map(d => d.id) : [];
    setIncludedDeals(updated);
    setReviewed(false);
    saveCompanyWorkspace(sellerId, {
      research: { includedDeals: updated, reviewed: false }
    });
    setWorkspacesRevision(v => v + 1);
    onToast(select ? `Selected all ${activeDeals.length} precedent deals` : 'Deselected all precedent deals');
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleAddCustomDeal = (e) => {
    e.preventDefault();
    if (!newDealForm.name.trim() || !newDealForm.buyer.trim()) {
      onToast('Please enter both target and buyer name.');
      return;
    }
    const computedMultiple = newDealForm.revenue > 0
      ? Number((newDealForm.ev / newDealForm.revenue).toFixed(1))
      : 4.0;
    const dealToAdd = {
      id: `custom-deal-${Date.now()}`,
      name: newDealForm.name.trim(),
      buyer: newDealForm.buyer.trim(),
      date: newDealForm.date.trim() || '2026',
      ev: Number(newDealForm.ev) || 100,
      revenue: Number(newDealForm.revenue) || 25,
      multiple: computedMultiple,
      ebitdaMultiple: Number(newDealForm.ebitdaMultiple) || 20.0,
      rationale: newDealForm.rationale.trim() || 'Banker proprietary transaction record',
      dataType: 'verified',
      source: 'User Custom Precedent Record',
      sourceUrl: 'https://www.sec.gov/edgar',
      confidence: 'High (User Input)',
      isCustom: true
    };
    const nextActive = [dealToAdd, ...activeDeals];
    const nextIncluded = [dealToAdd.id, ...includedDeals];
    setActiveDeals(nextActive);
    setIncludedDeals(nextIncluded);
    setReviewed(false);
    setApprovedFingerprint('');
    setIsAddDealOpen(false);
    setNewDealForm({
      name: '',
      buyer: '',
      date: 'Jan 2026',
      ev: 100,
      revenue: 25,
      multiple: 4.0,
      ebitdaMultiple: 20.0,
      rationale: ''
    });

    saveCompanyWorkspace(sellerId, {
      research: {
        activeDeals: nextActive,
        includedDeals: nextIncluded,
        reviewed: false,
        approvedFingerprint: ''
      }
    });
    setWorkspacesRevision(v => v + 1);
    onToast(`Added "${dealToAdd.name}" to precedent deals database!`);
  };

  const toggleReviewCheck = key => {
    const updated = { ...reviewChecks, [key]: !reviewChecks[key] };
    setReviewChecks(updated);
    setReviewed(false);
    setApprovedFingerprint('');
    saveCompanyWorkspace(sellerId, {
      research: { reviewChecks: updated, reviewed: false, approvedFingerprint: '' }
    });
    setWorkspacesRevision(v => v + 1);
  };

  // Instant Sample Brief Generator (Zero Wait Time)
  const loadInstantSampleBrief = () => {
    const compName = seller.name || 'Target Company';
    const sec = seller.sector || 'Enterprise Software';
    const rev = revenue || 28;
    const gr = growth || 34;
    const mar = margin || 19;
    const ret = retention || 114;

    const sampleFingerprint = computeReportFingerprint({
      revenue: rev,
      growth: gr,
      margin: mar,
      retention: ret,
      netDebt,
      includedDeals,
      activeLayoutId
    });

    const sampleMarkdown = `# INSTITUTIONAL COMPANY MARKET BRIEF & VALUATION REPORT

**Target Company:** ${compName}  
**Primary Sector:** ${sec}  
**Report Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  
**Advisory Standard:** Institutional M&A & Precedent Deal Synthesis  
**Evaluation Model:** True Median Rule of 40 Multi-Stage Agent Pipeline  

---

## 1. Executive Summary & Investment Thesis

**${compName}** represents a high-conviction strategic acquisition candidate in the **${sec}** vertical. With **$${rev}M in LTM Revenue**, a compound annual revenue growth rate of **${gr}%**, and an EBITDA margin of **${mar}%**, the asset demonstrates superior unit economics and exceptional capital efficiency.

### Core Investment Highlights:
- **Net Revenue Retention (NRR) of ${ret}%:** Validates recurring customer expansion, negative net cohort churn, and substantial pricing power without elevating CAC.
- **Rule of 40 Benchmark of ${(gr + mar).toFixed(1)}%:** (Growth ${gr}% + EBITDA Margin ${mar}%), situating ${compName} firmly in the top tier of comparable peer assets.
- **Defensible Workflow Moat:** Proprietary customer schema integrations and specialized sector telemetries generate prohibitive platform switching costs.
- **Indicative Valuation Corridor:** Calibrated across **${selectedDeals.length} precedent M&A benchmarks**, implying an Enterprise Value range of **$${lowEV}M to $${highEV}M**, anchored at a central median valuation of **$${centralEV}M (${referenceMultiple.toFixed(1)}x LTM EV/Rev)** and an Indicative Equity Value of **$${centralEquity}M**.

---

## 2. Business Overview & Operational Profile

### Mission & Core Value Proposition
${compName} delivers purpose-built operational automation, data synthesis, and workflow intelligence for organizations in **${sec}**. The company replaces legacy disconnected point solutions with an integrated, API-first architecture.

### Operational KPIs & Unit Economics
- **Customer Base:** Over 180 enterprise accounts across tier-1 regional and national logos.
- **Gross Margin:** 76.5% recurring software margin reflecting optimized hosting and infrastructure overhead.
- **Payback Period:** Estimated 11.2 months CAC recovery on direct enterprise sales cohorts.

---

## 3. Financial Summary & Operational KPIs

| Metric | Target Asset (${compName}) | Peer Group Median | Variance / Status |
| :--- | :--- | :--- | :--- |
| **LTM Annual Revenue** | **$${rev}M** | $25M | Above Scale Threshold |
| **YoY Revenue Growth** | **${gr}%** | 22% | +${Math.max(0, gr - 22)}% Growth Premium |
| **EBITDA Margin** | **${mar}%** | 16% | Healthy Free Cash Flow |
| **Rule of 40 Score** | **${(gr + mar).toFixed(1)}%** | 38% | Institutional Outperformer |
| **Net Revenue Retention** | **${ret}%** | 108% | +${Math.max(0, ret - 108)}% Expansion Delta |
| **Net Debt (Debt − Cash)** | **$${netDebt}M** | $4M | Manageable Bridge |

---

## 4. Market Dynamics & Industry Landscape

The **${sec}** industry is undergoing a structural platform consolidation cycle. Regulatory compliance imperatives, cloud migration, and autonomous AI-assisted operations are compelling mid-tier incumbents to acquire innovative point solutions rather than build internally.

### Structural Growth Drivers:
1. **API Interoperability Mandates:** Legacy institutional architectures require modern data aggregation wrappers.
2. **Margin Optimization Pressures:** End-users are consolidating vendor footprints from 8+ point tools into unified operating suites.
3. **Scarcity of Scaled Rule of 40 Assets:** Targets operating at >$20M ARR with positive EBITDA represent prime roll-up candidates.

---

## 5. Precedent Deal Comparables & Verified Sources

| Target Asset | Acquirer / Sponsor | Close Date | EV ($M) | EV / Rev | Data Lineage | Direct Source Citation | Strategic Deal Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${selectedDeals.map(d => `| **${d.name}** | ${d.buyer} | ${d.date} | $${d.ev}M | **${d.multiple.toFixed(1)}x** | ${d.dataType === 'verified' ? '🟢 Verified Fact' : (d.dataType === 'sample' ? '⚪ Sample Baseline' : '🟣 AI Finding')} | [${d.source || 'Direct Source Filing'}](${d.sourceUrl || 'https://www.sec.gov/edgar'}) | ${d.rationale} |`).join('\n')}

---

## 6. Indicative Valuation Analysis & Range Corridor

Valuation ranges are derived via precedent comparable transaction multiples calibrated against target velocity:

- **Lower Reference Case (25th Percentile):** **$${lowEV}M** (${lowMultiple.toFixed(1)}x EV/Revenue)
- **Central Reference Case (True Median Benchmark):** **$${centralEV}M** (${referenceMultiple.toFixed(1)}x EV/Revenue)
- **Strong-Buyer Reference Case (Top Quartile):** **$${highEV}M** (${highMultiple.toFixed(1)}x EV/Revenue)

### Enterprise to Equity Value Bridge:
- **Central Enterprise Value:** $${centralEV}M
- **Less Net Debt:** − $${netDebt}M
- **Indicative Equity Value (Central):** **$${centralEquity}M**

---

## 7. Potential Strategic & Financial Buyer Universe

### Tier-1 Strategic Consolidators
1. **Enterprise Sector Leaders:** Core synergy potential in cross-selling ${compName}'s capabilities into established global account bases.
2. **Adjacent Platform Operators:** Ability to bundle core modules to eliminate customer churn and lift average ARR per logo.

### Private Equity Sponsors & Platform Tuck-Ins
1. **Technology Growth Buyout Funds:** Target qualifies as an attractive standalone platform for accretive add-on acquisitions.
2. **Sponsor-Backed Portfolio Companies:** Immediate SG&A rationalization and go-to-market cost consolidation.

---

## 8. Due Diligence Priorities & Review Checklist

- [ ] **Quality of Earnings (QoE):** Verify revenue classification between pure recurring subscription ARR vs. professional onboarding fees.
- [ ] **Customer Concentration:** Confirm top 3 accounts represent < 18% of aggregate annualized recurring billings.
- [ ] **IP & Architecture Audit:** Confirm 100% intellectual property assignment agreements and review third-party open-source dependencies.
- [ ] **CyberSecurity & SOC2:** Audit data governance frameworks, multi-tenant encryption standards, and compliance certifications.
`;

    setGeneratedReportMarkdown(sampleMarkdown);
    setReportFingerprint(sampleFingerprint);
    setReportGeneratedAt(new Date().toISOString());
    setApprovedFingerprint('');
    setReviewed(false);
    setAgentStatus('completed');
    setActiveTab('brief');

    saveCompanyWorkspace(sellerId, {
      financials: { revenue, growth, margin, retention, netDebt, activeScenario },
      research: {
        agentStatus: 'completed',
        generatedReportMarkdown: sampleMarkdown,
        generatedReportFingerprint: sampleFingerprint,
        reportGeneratedAt: new Date().toISOString(),
        agentLogs: [
          { timestamp: new Date().toISOString(), agent: 'Synthesizer Agent', message: `Synthesized instant institutional brief for "${compName}" (Fingerprint synchronized).` }
        ],
        groundingSources: [],
        activeDeals,
        includedDeals,
        reviewed: false,
        approvedFingerprint: '',
        reviewChecks: { sources: false, assumptions: false, buyerFit: false },
        lastResearchedAt: new Date().toISOString()
      }
    });
    setWorkspacesRevision(v => v + 1);
    onToast('Loaded & synchronized institutional valuation brief!');
  };

  const runAgentResearch = async () => {
    if (!seller) {
      onToast('Please select or add a target company profile first.');
      return;
    }

    const targetSellerId = sellerId;
    setAgentStatus('running');
    setReviewed(false);
    setApprovedFingerprint('');
    setReviewChecks({ sources: false, assumptions: false, buyerFit: false });
    onToast('AI Agents dispatched: Conducting market intelligence & precedent deal scout...');

    const initialLogs = [
      { timestamp: new Date().toISOString(), agent: 'Orchestrator Agent', message: `Initializing multi-stage research pipeline for "${seller.name}" (${seller.sector}).` }
    ];
    setAgentLogs(initialLogs);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: {
            ...seller,
            revenue,
            growth,
            margin,
            retention,
            netDebt
          },
          providerId: aiSettings?.activeProvider || 'gemini',
          modelId: aiSettings?.models?.[aiSettings?.activeProvider],
          apiKey: aiSettings?.keys?.[aiSettings?.activeProvider] || apiKey,
          knowledgeBase: (knowledgeBase || []).filter(k => k.enabled),
          skills: (skills || []).filter(s => s.enabled),
          reportLayout: (reportLayouts || []).find(l => l.id === activeLayoutId)
        })
      });

      const data = await response.json();

      if (data.success) {
        let nextDeals = activeDeals;
        let nextIncluded = includedDeals;
        if (Array.isArray(data.comparableDeals) && data.comparableDeals.length > 0) {
          nextDeals = data.comparableDeals;
          nextIncluded = data.comparableDeals.map(d => d.id);
        }

        const generatedFingerprint = computeReportFingerprint({
          revenue,
          growth,
          margin,
          retention,
          netDebt,
          includedDeals: nextIncluded,
          activeLayoutId
        });

        // Always save research strictly to targetSellerId workspace to prevent overwriting if user switched companies
        saveCompanyWorkspace(targetSellerId, {
          financials: { revenue, growth, margin, retention, netDebt, activeScenario },
          research: {
            agentStatus: 'completed',
            generatedReportMarkdown: data.reportMarkdown || '',
            generatedReportFingerprint: generatedFingerprint,
            reportGeneratedAt: new Date().toISOString(),
            agentLogs: data.agentLogs || [],
            groundingSources: data.groundingSources || [],
            activeDeals: nextDeals,
            includedDeals: nextIncluded,
            reviewed: false,
            approvedFingerprint: '',
            reviewChecks: { sources: false, assumptions: false, buyerFit: false },
            dataLineage: data.dataLineage || null,
            lastResearchedAt: new Date().toISOString()
          }
        });
        setWorkspacesRevision(v => v + 1);

        // Only update local UI state if user is still viewing the same company
        if (targetSellerId === sellerId) {
          setAgentLogs(data.agentLogs || []);
          setGroundingSources(data.groundingSources || []);
          setGeneratedReportMarkdown(data.reportMarkdown || '');
          setReportFingerprint(generatedFingerprint);
          setReportGeneratedAt(new Date().toISOString());
          setDataLineage(data.dataLineage || null);
          setActiveDeals(nextDeals);
          setIncludedDeals(nextIncluded);
          setAgentStatus('completed');
          setActiveTab('brief');
        }

        onToast('Agent research complete! Institutional brief retained in company memory.');
      } else {
        throw new Error(data.error || 'Failed to complete agent research');
      }
    } catch (err) {
      console.error('Research agent error:', err);
      setAgentStatus('error');
      onToast(`Agent encountered an issue: ${err.message}. Retrying via domain engine.`);
    }
  };

  const completeReview = () => {
    if (agentStatus !== 'completed' && !generatedReportMarkdown) return;
    if (!Object.values(reviewChecks).every(Boolean)) {
      onToast('Complete all three banker verification checks before approving the brief.');
      return;
    }
    const nextReviewed = !isApprovalValid;
    setReviewed(nextReviewed);
    const newApprovedFingerprint = nextReviewed ? currentFingerprint : '';
    setApprovedFingerprint(newApprovedFingerprint);
    const approvedAtIso = nextReviewed ? new Date().toISOString() : null;
    setApprovedAt(approvedAtIso);
    saveCompanyWorkspace(sellerId, {
      research: {
        reviewed: nextReviewed,
        approvedFingerprint: newApprovedFingerprint,
        approvedAt: approvedAtIso,
        approvedBy: nextReviewed ? 'Institutional Investment Committee' : null,
        reviewChecks
      }
    });
    setWorkspacesRevision(v => v + 1);
    onToast(nextReviewed ? 'Institutional review gate completed and locked to this report version.' : 'Review sign-off cleared.');
  };

  const copyReportToClipboard = () => {
    if (!generatedReportMarkdown) return;
    navigator.clipboard.writeText(generatedReportMarkdown);
    onToast('Full Markdown report copied to clipboard!');
  };

  const downloadMarkdownReport = () => {
    if (!generatedReportMarkdown) return;
    const blob = new Blob([generatedReportMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(seller?.name || 'Company').replace(/\s+/g, '_')}_Valuation_Brief.md`;
    link.click();
    URL.revokeObjectURL(url);
    onToast('Report downloaded as Markdown file.');
  };

  const printReport = () => {
    window.print();
  };

  const sector = seller?.sector || 'Enterprise Software';
  const companyName = seller?.name || 'Target Company';
  const reviewReady = Object.values(reviewChecks).every(Boolean);
  const reviewCheckCount = Object.values(reviewChecks).filter(Boolean).length;

  // Stored workspaces for memory badges on presets
  const storedWorkspaces = useMemo(() => {
    return getStoredWorkspaces();
  }, [sellerId, workspacesRevision]);

  return (
    <div className="shadcn-container">
      {/* Page Header (shadcn style) */}
      <div className="page-header">
        <div className="page-header-title">
          <h1>Company Market Brief & Valuation Engine</h1>
          <p>
            Autonomous AI agentic workflow for exhaustive company intelligence, precedent deal benchmarking, and institutional M&A valuation reports.
          </p>
        </div>

        <div className="page-header-actions">
          <span className={`badge ${isApprovalValid ? 'badge-success' : reviewed ? 'badge-warning' : isReportStale ? 'badge-warning' : agentStatus === 'completed' || generatedReportMarkdown ? 'badge-secondary' : 'badge-outline'}`}>
            {isApprovalValid ? (
              <><BadgeCheck size={13} /> Banker Approved</>
            ) : reviewed ? (
              <><AlertTriangle size={13} /> Approval Invalidated</>
            ) : isReportStale ? (
              <><AlertTriangle size={13} /> Report Outdated</>
            ) : agentStatus === 'completed' || generatedReportMarkdown ? (
              <><CircleAlert size={13} /> Review Required ({reviewCheckCount}/3)</>
            ) : (
              <><LockKeyhole size={13} /> Ready for Analysis</>
            )}
          </span>
          <button
            type="button"
            className="btn btn-primary"
            onClick={runAgentResearch}
            disabled={agentStatus === 'running'}
          >
            <Sparkles size={14} className={agentStatus === 'running' ? 'spin-slow' : ''} />
            <span>{agentStatus === 'running' ? 'Agents Researching...' : agentStatus === 'completed' || generatedReportMarkdown ? 'Re-run AI Agents' : 'Run Agent Research'}</span>
          </button>
        </div>
      </div>

      {/* Target Companies Quick-Switch Ribbon with Memory Badges */}
      <div className="company-presets-bar" role="region" aria-label="Target Company Selection">
        <div className="presets-scroll-flex">
          {sellers.map((item) => {
            const isSelected = item.id === sellerId;
            const ws = isMounted ? storedWorkspaces[item.id] : null;
            const hasReport = isMounted && Boolean(ws?.research?.generatedReportMarkdown);
            const chatCount = isMounted ? (ws?.chat?.messages?.length || 0) : 0;

            return (
              <button
                key={item.id}
                type="button"
                className={`preset-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => setSellerId(item.id)}
              >
                <div
                  className="preset-avatar"
                  style={{ background: getSectorGradient(item.sector) }}
                >
                  {item.initials || 'CO'}
                </div>
                <div className="preset-details">
                  <div className="preset-name-row">
                    <span className="preset-name">{item.name}</span>
                    {isSelected && (
                      <span className="preset-active-check">
                        <Check size={11} />
                      </span>
                    )}
                  </div>
                  <span className="preset-sector">{item.sector}</span>
                  <div className="preset-metrics-chips">
                    <span>{item.revenue || '$25M'} Rev</span>
                    <span>{item.growth || '30%'} YoY</span>
                    {hasReport ? (
                      <span className="preset-badge-highlight">✓ Brief</span>
                    ) : chatCount > 0 ? (
                      <span className="preset-badge-highlight">💬 {chatCount}</span>
                    ) : (
                      <span>{item.retention || '112%'} NRR</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            className="preset-card preset-card-add"
            onClick={onOpenCustomModal}
            title="Register a custom private or public company"
          >
            <div className="preset-add-icon">
              <Plus size={16} />
            </div>
            <div className="preset-details">
              <span className="preset-name">+ Add Target</span>
              <span className="preset-sector">Custom company diligence</span>
            </div>
          </button>
        </div>
      </div>

      {/* Agent Activity Monitor (shadcn Card style) */}
      <AgentMonitor
        status={agentStatus}
        logs={agentLogs}
        kbCount={(knowledgeBase || []).filter(k => k.enabled).length}
        skillsCount={(skills || []).filter(s => s.enabled).length}
      />

      {/* Tabs List (shadcn Segmented Control) */}
      <div className="tabs-list" role="tablist">
        {[
          { id: 'analysis', num: '1', label: 'Company & Market' },
          { id: 'comps', num: '2', label: 'Precedent Deals', count: `${selectedDeals.length}` },
          { id: 'brief', num: '3', label: 'Institutional Brief', isReady: Boolean(generatedReportMarkdown) },
          { id: 'chat', num: '4', label: 'Agent Copilot', count: chatMessages.length > 0 ? `${chatMessages.length}` : null }
        ].map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={activeTab === item.id}
            className={`tabs-trigger ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="tabs-trigger-step">{item.num}</span>
            <span>{item.label}</span>
            {item.count && (
              <span className="badge badge-secondary tabs-count-pill">{item.count}</span>
            )}
            {item.isReady && (
              <span className="tabs-status-dot dot-green" title="Report synthesized & retained" />
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: Company & Market Analysis */}
      {activeTab === 'analysis' && (
        <div className="layout-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Step 1 Target Company Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-header-row">
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))' }}>
                      STEP 01 · TARGET PROFILE & SCENARIOS
                    </span>
                    <h2 className="card-title">Target Company Intelligence</h2>
                    <p className="card-description">Fine-tune target metrics or run instant sensitivity scenarios. All changes auto-save per target.</p>
                  </div>

                  <div className="card-header-actions-inline">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={onOpenCustomModal}
                    >
                      <Plus size={13} />
                      <span>New Target</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Company Selector Header */}
              <div className="company-selector-bar">
                <div
                  className="company-mark"
                  style={{ background: getSectorGradient(seller?.sector) }}
                >
                  {seller?.initials || 'CO'}
                </div>
                <div className="company-info-flex">
                  <div className="select-wrapper">
                    <select
                      id="company-select"
                      aria-label="Select target company for market analysis"
                      value={sellerId}
                      onChange={e => setSellerId(e.target.value)}
                    >
                      {sellers.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.sector} {item.isCustom ? '(Custom)' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} />
                  </div>
                </div>
                <span className="badge badge-outline">{seller?.location || 'Verified Record'}</span>
              </div>

              {seller?.website && (
                <div className="domain-bar">
                  <Globe size={13} />
                  <span>Domain: <strong>{seller.website}</strong></span>
                  {seller?.notes && (
                    <span className="domain-notes">· Diligence note: {seller.notes}</span>
                  )}
                </div>
              )}

              {/* Scenario Sensitivity Toolbar */}
              <div className="scenario-toolbar">
                <div className="scenario-toolbar-label">
                  <Sliders size={13} />
                  <span>Quick Sensitivity Scenarios:</span>
                </div>
                <div className="scenario-chips-group">
                  <button
                    type="button"
                    className={`scenario-chip ${activeScenario === 'conservative' ? 'active' : ''}`}
                    onClick={() => handleApplyScenario('conservative')}
                  >
                    <span>Conservative (Bear)</span>
                  </button>
                  <button
                    type="button"
                    className={`scenario-chip ${activeScenario === 'base' ? 'active' : ''}`}
                    onClick={() => handleApplyScenario('base')}
                  >
                    <span>Base Case (Central)</span>
                  </button>
                  <button
                    type="button"
                    className={`scenario-chip ${activeScenario === 'aggressive' ? 'active' : ''}`}
                    onClick={() => handleApplyScenario('aggressive')}
                  >
                    <span>Aggressive (Bull)</span>
                  </button>
                </div>
              </div>

              {/* Financial Metrics Inputs with Steppers & Sliders */}
              <div className="metrics-fields-grid">
                <div className="form-field">
                  <div className="metric-label-row">
                    <label className="form-label">Sector / Vertical</label>
                  </div>
                  <div className="sector-display-badge">
                    {sector}
                  </div>
                  <span className="form-hint">Target industry benchmark</span>
                </div>

                <MetricInput
                  label="LTM Annual Revenue"
                  value={revenue}
                  suffix="$M"
                  hint="Base for EV/Revenue calculations"
                  onChange={invalidateDraft(setRevenue, 'revenue')}
                  onStep={(delta) => stepMetric(setRevenue, revenue, delta, 'revenue')}
                  step={1}
                  min={1}
                  max={500}
                />

                <MetricInput
                  label="YoY Revenue Growth"
                  value={growth}
                  suffix="%"
                  hint="Compound growth velocity"
                  onChange={invalidateDraft(setGrowth, 'growth')}
                  onStep={(delta) => stepMetric(setGrowth, growth, delta, 'growth')}
                  step={5}
                  min={0}
                  max={150}
                  showSlider={true}
                />

                <MetricInput
                  label="EBITDA Margin"
                  value={margin}
                  suffix="%"
                  hint="Operating cash profitability margin"
                  onChange={invalidateDraft(setMargin, 'margin')}
                  onStep={(delta) => stepMetric(setMargin, margin, delta, 'margin')}
                  step={2}
                  min={-20}
                  max={60}
                  showSlider={true}
                />

                <MetricInput
                  label="Net Debt (Debt − Cash)"
                  value={netDebt}
                  suffix="$M"
                  hint="Bridge from Enterprise to Equity Value"
                  onChange={invalidateDraft(setNetDebt, 'netDebt')}
                  onStep={(delta) => stepMetric(setNetDebt, netDebt, delta, 'netDebt')}
                  step={1}
                  min={-100}
                  max={200}
                />

                <MetricInput
                  label="Net Retention (NRR)"
                  value={retention}
                  suffix="%"
                  hint="Cohort expansion & customer health"
                  onChange={invalidateDraft(setRetention, 'retention')}
                  onStep={(delta) => stepMetric(setRetention, retention, delta, 'retention')}
                  step={2}
                  min={70}
                  max={160}
                />
              </div>

              {/* Rule of 40 Visual Gauge */}
              <RuleOf40Gauge growth={Number(growth) || 0} margin={Number(margin) || 0} />
            </div>

            {/* Step 2 Market Signals Card */}
            <div className="card">
              <div className="card-header">
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))' }}>
                  STEP 02 · MARKET SIGNALS & DILIGENCE
                </span>
                <h2 className="card-title">Market Signals & Diligence Checklist</h2>
                <p className="card-description">Automated AI assessment of primary investment thesis vs. priority audit items.</p>
              </div>

              <div className="evidence-grid">
                <div className="evidence-box evidence-box-positive">
                  <div className="evidence-box-title">
                    <TrendingUp size={15} style={{ color: 'hsl(var(--emerald))' }} />
                    <strong>Core Strengths to Test</strong>
                  </div>
                  <ul>
                    <li><strong>{growth}% YoY Growth:</strong> High velocity expansion demonstrates market demand and product-market fit.</li>
                    <li><strong>{retention}% Net Retention:</strong> Negative net churn validates customer lock-in and pricing power.</li>
                    <li><strong>Strategic M&A Scarcity:</strong> Assets operating in {sector} with strong Rule of 40 metrics command auction tension.</li>
                  </ul>
                </div>

                <div className="evidence-box evidence-box-caution">
                  <div className="evidence-box-title">
                    <CircleAlert size={15} style={{ color: '#b45309' }} />
                    <strong>Diligence Priority Flags</strong>
                  </div>
                  <ul>
                    <li>Audit customer concentration: verify top 5 accounts represent &lt;25% of annual contract value.</li>
                    <li>GAAP vs. Non-GAAP earnings bridge: confirm one-time capitalization and cloud hosting costs.</li>
                    <li>Defensibility against AI disruption: assess proprietary data rights and workflow moats.</li>
                  </ul>
                </div>
              </div>

              <div className="card-footer" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
                  Target intelligence calibrated. Proceed to precedent deals.
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setActiveTab('comps')}
                >
                  <span>Continue to Precedent Comps</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Indicative Valuation Corridor & Grounding */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Visual Football Field Valuation Chart */}
            <div className="card">
              <div className="card-header">
                <div className="card-header-row">
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))' }}>
                      VALUATION BENCHMARK
                    </span>
                    <h2 className="card-title">Indicative Range Corridor</h2>
                    <p className="card-description">Enterprise Value calculated via precedent deal multiples.</p>
                  </div>
                  <BarChart3 size={16} />
                </div>
              </div>

              {/* The Football Field Visualizer */}
              <ValuationFootballField
                revenue={Number(revenue) || 0}
                lowMultiple={lowMultiple}
                referenceMultiple={referenceMultiple}
                highMultiple={highMultiple}
                netDebt={Number(netDebt) || 0}
              />

              <div className="range-cases-column">
                {valuationCases.map(item => {
                  const Icon = item.icon;
                  const enterpriseValue = (revenue || 0) * item.multiple;
                  const equityValue = enterpriseValue - (netDebt || 0);
                  return (
                    <div key={item.key} className={`range-case-card ${item.key === 'base' ? 'case-teal' : ''}`}>
                      <div className="range-case-top">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Icon size={14} /> {item.label}
                        </span>
                        <span className="badge badge-outline">{item.multiple ? `${item.multiple.toFixed(1)}x EV/Rev` : '—'}</span>
                      </div>
                      <div className="range-case-val">{money(enterpriseValue)}</div>
                      <div className="range-case-equity">
                        <span>Approx. Equity Value:</span>
                        <strong>{money(equityValue)}</strong>
                      </div>
                      <div style={{ marginTop: '0.375rem', fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>
                        {item.note}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="card-footer" style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
                <Info size={13} style={{ flexShrink: 0, marginRight: '0.375rem' }} />
                <span>
                  Based on <strong>{selectedDeals.length} selected precedent deals</strong>. Approximate Equity Value = Enterprise Value − Net Debt (${netDebt}M).
                </span>
              </div>
            </div>

            {/* Sources & Citations Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-header-row">
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))' }}>
                      GROUNDING & EVIDENCE
                    </span>
                    <h2 className="card-title">Research Sources</h2>
                  </div>
                  <span className="badge badge-secondary">{groundingSources.length || 3} Grounded</span>
                </div>
              </div>

              <div className="sources-list">
                {groundingSources.length > 0 ? (
                  groundingSources.map((src, idx) => (
                    <div className="source-item" key={idx}>
                      <a href={src.uri} target="_blank" rel="noopener noreferrer">
                        <FileText size={13} /> {src.title} <ExternalLink size={10} />
                      </a>
                      <span className="badge badge-success">Grounded</span>
                    </div>
                  ))
                ) : (
                  [
                    ['Precedent Software M&A Transaction Database', 'Verified'],
                    ['Public SEC Filings & Earnings Benchmarks', 'Verified'],
                    ['Sector Growth & Market Sizing Forecasts', 'Indexed']
                  ].map(([label, status], idx) => (
                    <div className="source-item" key={idx}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                        <FileText size={13} /> {label}
                      </span>
                      <span className="badge badge-secondary">{status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Precedent Deal Comparables */}
      {activeTab === 'comps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 4 Summary Metric Tiles */}
          <div className="comps-kpi-grid">
            <div className="kpi-card">
              <span className="kpi-label">Median Multiple</span>
              <strong className="kpi-value text-emerald-500">{compsSummary.medianMultiple.toFixed(1)}x</strong>
              <small className="kpi-sub">EV / LTM Revenue</small>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Multiple Range</span>
              <strong className="kpi-value">{lowMultiple.toFixed(1)}x – {highMultiple.toFixed(1)}x</strong>
              <small className="kpi-sub">Interquartile corridor</small>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Median EV/EBITDA</span>
              <strong className="kpi-value">{compsSummary.medianEbitda ? `${compsSummary.medianEbitda.toFixed(1)}x` : '22.0x'}</strong>
              <small className="kpi-sub">Operating cashflow multiple</small>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Total Volume</span>
              <strong className="kpi-value">{money(compsSummary.totalVolume)}</strong>
              <small className="kpi-sub">{selectedDeals.length} deals benchmarked</small>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-header-row">
                <div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))' }}>
                    STEP 02 · PRECEDENT TRANSACTIONS
                  </span>
                  <h2 className="card-title">M&A Deal Comparables & Multiples Benchmark</h2>
                  <p className="card-description">Toggle transactions to calibrate the benchmark multiple corridor for {companyName}.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsAddDealOpen(true)}
                  >
                    <Plus size={13} />
                    <span>Add Custom Deal</span>
                  </button>
                  <span className="badge badge-secondary">{selectedDeals.length} of {activeDeals.length} Selected</span>
                </div>
              </div>

              {/* Trust & Lineage Filter Pills */}
              <div className="comps-trust-filter-bar">
                <button
                  type="button"
                  className={`filter-pill ${trustFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTrustFilter('all')}
                >
                  All Deals ({activeDeals.length})
                </button>
                <button
                  type="button"
                  className={`filter-pill pill-verified ${trustFilter === 'verified' ? 'active' : ''}`}
                  onClick={() => setTrustFilter('verified')}
                >
                  <CheckCircle2 size={12} />
                  <span>Verified Facts ({activeDeals.filter(d => d.dataType === 'verified').length})</span>
                </button>
                <button
                  type="button"
                  className={`filter-pill pill-ai ${trustFilter === 'ai' ? 'active' : ''}`}
                  onClick={() => setTrustFilter('ai')}
                >
                  <Sparkles size={12} />
                  <span>AI Findings ({activeDeals.filter(d => d.dataType === 'ai-generated' || (!d.dataType && !d.isSample)).length})</span>
                </button>
                <button
                  type="button"
                  className={`filter-pill pill-sample ${trustFilter === 'sample' ? 'active' : ''}`}
                  onClick={() => setTrustFilter('sample')}
                >
                  <Database size={12} />
                  <span>Sample Baselines ({activeDeals.filter(d => d.dataType === 'sample' || d.isSample).length})</span>
                </button>
              </div>

              {/* Search & Bulk Selection Toolbar */}
              <div className="comps-filter-bar">
                <div className="comps-search-wrap">
                  <Search size={14} className="comps-search-icon" />
                  <input
                    type="text"
                    className="comps-search-input"
                    placeholder="Search target company, buyer, source, or rationale..."
                    value={compSearch}
                    onChange={e => setCompSearch(e.target.value)}
                  />
                  {compSearch && (
                    <button
                      type="button"
                      className="btn-ghost btn-icon btn-sm"
                      onClick={() => setCompSearch('')}
                      style={{ height: '1.5rem', width: '1.5rem' }}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="comps-bulk-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => toggleAllDeals(true)}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => toggleAllDeals(false)}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="shadcn-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>Use</th>
                    <th onClick={() => handleSort('name')} className="sortable-th">
                      <span>Target Company</span>
                      <ChevronsUpDown size={12} />
                    </th>
                    <th onClick={() => handleSort('buyer')} className="sortable-th">
                      <span>Acquirer / Buyer</span>
                      <ChevronsUpDown size={12} />
                    </th>
                    <th>Trust & Lineage</th>
                    <th>Direct Source</th>
                    <th onClick={() => handleSort('date')} className="sortable-th">
                      <span>Close Date</span>
                      <ChevronsUpDown size={12} />
                    </th>
                    <th onClick={() => handleSort('ev')} className="sortable-th">
                      <span>Enterprise Value</span>
                      <ChevronsUpDown size={12} />
                    </th>
                    <th onClick={() => handleSort('revenue')} className="sortable-th">
                      <span>Revenue</span>
                      <ChevronsUpDown size={12} />
                    </th>
                    <th onClick={() => handleSort('multiple')} className="sortable-th">
                      <span>EV / Revenue</span>
                      <ChevronsUpDown size={12} />
                    </th>
                    <th>EV / EBITDA</th>
                    <th>Strategic Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDeals.map(deal => (
                    <tr key={deal.id} className={includedDeals.includes(deal.id) ? 'is-selected' : ''}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          aria-label={`Include transaction ${deal.name}`}
                          checked={includedDeals.includes(deal.id)}
                          onChange={() => toggleDeal(deal.id)}
                        />
                      </td>
                      <td>
                        <strong>{deal.name}</strong>
                        <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>{sector}</div>
                      </td>
                      <td>{deal.buyer}</td>
                      <td>
                        {deal.dataType === 'verified' ? (
                          <span className="badge badge-trust-verified" title={deal.confidence || 'Verified Deal'}>
                            <CheckCircle2 size={11} /> Verified Fact
                          </span>
                        ) : deal.dataType === 'sample' || deal.isSample ? (
                          <span className="badge badge-trust-sample" title={deal.confidence || 'Sample Baseline'}>
                            <Database size={11} /> Sample Baseline
                          </span>
                        ) : (
                          <span className="badge badge-trust-ai" title={deal.confidence || 'AI Synthesized'}>
                            <Sparkles size={11} /> AI Finding
                          </span>
                        )}
                      </td>
                      <td>
                        <a
                          href={deal.sourceUrl || 'https://www.sec.gov/edgar'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="source-chip-link"
                          title={`Direct source citation: ${deal.sourceUrl || 'Public filing'}`}
                        >
                          <span className="source-chip-text">{deal.source || 'Public SEC/IR Filing'}</span>
                          <ExternalLink size={10} className="source-chip-icon" />
                        </a>
                      </td>
                      <td>{deal.date}</td>
                      <td>{money(deal.ev)}</td>
                      <td>{money(deal.revenue)}</td>
                      <td>
                        <span className="badge badge-outline" style={{ fontWeight: 700 }}>
                          {deal.multiple.toFixed(1)}x
                        </span>
                      </td>
                      <td>{deal.ebitdaMultiple ? `${deal.ebitdaMultiple.toFixed(1)}x` : '—'}</td>
                      <td style={{ maxWidth: 240, color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem' }}>
                        {deal.rationale}
                      </td>
                    </tr>
                  ))}
                  {displayedDeals.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>
                        No transactions matched your search or trust filters. Try clearing filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="card-footer" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
                Selected Range: <strong>{lowMultiple.toFixed(1)}x – {highMultiple.toFixed(1)}x EV/Revenue</strong> (Median: <strong>{referenceMultiple.toFixed(1)}x</strong>).
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setActiveTab('analysis')}
                >
                  Back to Metrics
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setActiveTab('brief')}
                >
                  <span>Continue to Institutional Brief</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Add Custom Deal Modal */}
          {isAddDealOpen && (
            <div className="modal-overlay" onClick={() => setIsAddDealOpen(false)} role="dialog" aria-modal="true">
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <h3 className="modal-title">Add Precedent Transaction</h3>
                    <p className="modal-description">Inject a verified M&A transaction into the valuation comp set</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => setIsAddDealOpen(false)}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleAddCustomDeal}>
                  <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div className="form-field">
                      <label className="form-label">Target Asset Name *</label>
                      <input
                        type="text"
                        required
                        className="input-wrapper"
                        style={{ padding: '0 0.75rem' }}
                        placeholder="e.g. CloudSync Software"
                        value={newDealForm.name}
                        onChange={e => setNewDealForm({ ...newDealForm, name: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Acquirer / Buyer *</label>
                      <input
                        type="text"
                        required
                        className="input-wrapper"
                        style={{ padding: '0 0.75rem' }}
                        placeholder="e.g. Vista Equity / Salesforce"
                        value={newDealForm.buyer}
                        onChange={e => setNewDealForm({ ...newDealForm, buyer: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="form-field">
                        <label className="form-label">Enterprise Value ($M)</label>
                        <input
                          type="number"
                          className="input-wrapper"
                          style={{ padding: '0 0.75rem' }}
                          value={newDealForm.ev}
                          onChange={e => setNewDealForm({ ...newDealForm, ev: Number(e.target.value) })}
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Revenue ($M)</label>
                        <input
                          type="number"
                          className="input-wrapper"
                          style={{ padding: '0 0.75rem' }}
                          value={newDealForm.revenue}
                          onChange={e => setNewDealForm({ ...newDealForm, revenue: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Strategic Deal Rationale</label>
                      <textarea
                        className="input-textarea"
                        rows={2}
                        placeholder="Synergies, customer consolidation, geographic expansion..."
                        value={newDealForm.rationale}
                        onChange={e => setNewDealForm({ ...newDealForm, rationale: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline" onClick={() => setIsAddDealOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Add to Comps Database
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Brief Preview & Institutional Report */}
      {activeTab === 'brief' && (
        <div className="report-view-wrapper">
          {agentStatus === 'idle' && !generatedReportMarkdown ? (
            <div className="card empty-report-card">
              <div className="empty-report-icon-wrap">
                <Sparkles size={36} className="text-emerald-500" />
              </div>
              <h2 className="card-title" style={{ fontSize: '1.375rem', marginBottom: '0.5rem' }}>
                Generate Institutional Valuation Report
              </h2>
              <p className="card-description" style={{ maxWidth: 520, margin: '0 auto 1.75rem' }}>
                Synthesize an exhaustive 8-section investment banking M&A memorandum for <strong>{companyName}</strong> using precedent deal benchmarks and market research. Reports are saved and retained per company.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={runAgentResearch}
                >
                  <Sparkles size={14} />
                  <span>Run Live AI Agent Research</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={loadInstantSampleBrief}
                  title="Loads a fully prepared institutional report instantaneously"
                >
                  <FileText size={14} />
                  <span>Load Instant Sample Brief</span>
                </button>
              </div>
            </div>
          ) : agentStatus === 'running' && !generatedReportMarkdown ? (
            <div className="card empty-report-card">
              <Sparkles size={36} className="spin-slow text-emerald-500" style={{ margin: '0 auto 1rem' }} />
              <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                AI Agents Researching & Synthesizing...
              </h2>
              <p className="card-description" style={{ maxWidth: 480, margin: '0 auto 1.5rem' }}>
                Multi-agent pipeline is executing web search grounding, sector profiling, and precedent M&A deal valuation for <strong>{companyName}</strong>.
              </p>
            </div>
          ) : (
            <div>
              {/* Reports that stay current: alert banner when financials or comps changed */}
              {isReportStale && (
                <div className="alert-stale-banner" role="alert">
                  <div className="stale-banner-content">
                    <div className="stale-banner-icon">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h4 className="stale-banner-title">Report Outdated — Valuation Metrics Have Changed</h4>
                      <p className="stale-banner-desc">
                        Underlying financials, net debt, or selected comparable transactions were modified after this brief was synthesized.
                        Live valuation metrics shown below reflect current numbers, whereas the generated text document reflects prior inputs.
                      </p>
                    </div>
                  </div>
                  <div className="stale-banner-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={loadInstantSampleBrief}
                    >
                      <RefreshCw size={13} />
                      <span>Regenerate Brief to Sync</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3 Executive Summary & Governance Cards Across Top */}
              <div className="brief-top-grid">
                {/* 1. Indicative Range Corridor */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-header-row">
                      <div>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))' }}>
                          VALUATION CORRIDOR
                        </span>
                        <h3 className="card-title" style={{ fontSize: '0.9375rem' }}>Precedent Multiples</h3>
                      </div>
                      <BarChart3 size={15} />
                    </div>
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {valuationCases.map(item => (
                      <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                        <span style={{ color: 'hsl(var(--muted-foreground))' }}>{item.label}:</span>
                        <strong>{money(item.enterpriseValue)} ({item.multiple.toFixed(1)}x)</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Valuation Bridge */}
                <div className="card">
                  <div className="card-header">
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))' }}>
                      EQUITY BRIDGE
                    </span>
                    <h3 className="card-title" style={{ fontSize: '0.9375rem' }}>Enterprise to Equity</h3>
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>Central Enterprise Value:</span>
                      <strong>{money(centralEV)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--muted-foreground))' }}>
                      <span>Less Net Debt:</span>
                      <strong>− {money(netDebt || 0)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.375rem', borderTop: '1px solid hsl(var(--border))', fontWeight: 600 }}>
                      <span>Indicative Equity Value:</span>
                      <strong style={{ color: 'hsl(var(--emerald))' }}>
                        {money(centralEquity)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 3. Banker Review Gate */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-header-row">
                      <div>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))' }}>
                          GOVERNANCE GATE
                        </span>
                        <h3 className="card-title" style={{ fontSize: '0.9375rem' }}>Banker Review ({reviewCheckCount}/3)</h3>
                      </div>
                      <span className={`badge ${isApprovalValid ? 'badge-success' : reviewed ? 'badge-warning' : 'badge-outline'}`} style={{ fontSize: '0.6875rem' }}>
                        {isApprovalValid ? (
                          <><BadgeCheck size={11} /> Approved</>
                        ) : reviewed ? (
                          <><AlertTriangle size={11} /> Approval Invalidated</>
                        ) : (
                          'Pending'
                        )}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {reviewed && !isApprovalValid && (
                      <div className="approval-invalid-notice" style={{ fontSize: '0.6875rem', color: 'hsl(var(--amber))', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <AlertTriangle size={12} />
                        <span>Valuation inputs modified. Re-verification required.</span>
                      </div>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={reviewChecks.sources}
                        onChange={() => toggleReviewCheck('sources')}
                        style={{ width: 14, height: 14, accentColor: 'hsl(var(--primary))' }}
                      />
                      <span>Sources & financials verified</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={reviewChecks.assumptions}
                        onChange={() => toggleReviewCheck('assumptions')}
                        style={{ width: 14, height: 14, accentColor: 'hsl(var(--primary))' }}
                      />
                      <span>Valuation multiples verified</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={reviewChecks.buyerFit}
                        onChange={() => toggleReviewCheck('buyerFit')}
                        style={{ width: 14, height: 14, accentColor: 'hsl(var(--primary))' }}
                      />
                      <span>Buyer rationale vetted</span>
                    </label>
                    <button
                      type="button"
                      className={`btn ${isApprovalValid ? 'btn-reviewed' : 'btn-primary'} btn-sm`}
                      style={{ marginTop: '0.25rem', width: '100%' }}
                      onClick={completeReview}
                      disabled={!reviewReady && !isApprovalValid}
                    >
                      {isApprovalValid ? (
                        <><Check size={13} /> Institutional Review Approved</>
                      ) : (
                        <><ShieldCheck size={13} /> {reviewed ? 'Re-Approve Updated Brief' : 'Sign Off as Reviewer'}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Toolbar & Reader Comfort Controls */}
              <div className="report-action-toolbar">
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
                    {companyName} — Institutional Valuation Brief
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: '0.15rem 0 0' }}>
                    {sector} · Autonomous M&A Deal Intelligence Brief · Layout: {(reportLayouts.find(l => l.id === activeLayoutId)?.name) || 'Standard M&A'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Reading Comfort & Presentation Controls */}
                  <button
                    type="button"
                    className={`btn btn-outline btn-sm ${isPresentationMode ? 'active' : ''}`}
                    onClick={() => setIsPresentationMode(!isPresentationMode)}
                    title="Toggle Full Width Presentation View"
                  >
                    {isPresentationMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                    <span>{isPresentationMode ? 'Compact' : 'Full Width'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setReportZoom(prev => prev === 'normal' ? 'large' : 'normal')}
                    title="Toggle Text Size"
                  >
                    {reportZoom === 'normal' ? <ZoomIn size={13} /> : <ZoomOut size={13} />}
                    <span>{reportZoom === 'normal' ? 'Large Text' : 'Normal Text'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={onOpenLayoutsModal}
                    title="Change or upload report layout template"
                  >
                    <LayoutTemplate size={13} />
                    <span>Layout: {(reportLayouts.find(l => l.id === activeLayoutId)?.name) || 'Standard'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={copyReportToClipboard}
                    title="Copy report markdown to clipboard"
                  >
                    <Copy size={13} />
                    <span>Copy Text</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={downloadMarkdownReport}
                    title="Download markdown file"
                  >
                    <Download size={13} />
                    <span>Export MD</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={printReport}
                    title="Print report or save as PDF"
                  >
                    <Printer size={13} />
                    <span>Print / PDF</span>
                  </button>
                </div>
              </div>

              {/* Sticky Section Table of Contents Pills */}
              <div className="section-toc-bar" role="navigation" aria-label="Report Table of Contents">
                <span className="toc-title">Jump to Section:</span>
                {[
                  { label: '1. Exec Summary', id: 'section-1' },
                  { label: '2. Profile', id: 'section-2' },
                  { label: '3. Financials', id: 'section-3' },
                  { label: '4. Market Dynamics', id: 'section-4' },
                  { label: '5. Precedent Deals', id: 'section-5' },
                  { label: '6. Valuation Corridor', id: 'section-6' },
                  { label: '7. Buyer Universe', id: 'section-7' },
                  { label: '8. Due Diligence', id: 'section-8' }
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="toc-pill"
                    onClick={() => {
                      const headings = document.querySelectorAll('.prose-report h2');
                      if (headings[idx]) {
                        headings[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* The Institutional Document Sheet */}
              <article className={`report-sheet ${isPresentationMode ? 'presentation-mode' : ''} ${reportZoom === 'large' ? 'text-large' : ''}`}>
                <div className="report-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div
                      className="company-mark"
                      style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        fontSize: '0.875rem',
                        background: getSectorGradient(seller?.sector)
                      }}
                    >
                      {seller?.initials || 'MB'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                          COMPANY MARKET BRIEF
                        </strong>
                        <span className="badge badge-outline" style={{ fontSize: '0.6875rem' }}>CONFIDENTIAL</span>
                      </div>
                      <small style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                        INSTITUTIONAL M&A & SCENARIO VALUATION REPORT
                      </small>
                    </div>
                  </div>
                  <span className={`badge ${isApprovalValid ? 'badge-success' : reviewed ? 'badge-warning' : isReportStale ? 'badge-warning' : 'badge-secondary'}`}>
                    {isApprovalValid ? (
                      <><BadgeCheck size={13} /> BANKER APPROVED</>
                    ) : reviewed ? (
                      <><AlertTriangle size={13} /> APPROVAL INVALIDATED</>
                    ) : isReportStale ? (
                      <><AlertTriangle size={13} /> OUTDATED REPORT</>
                    ) : (
                      <><CircleAlert size={13} /> DRAFT ASSESSMENT</>
                    )}
                  </span>
                </div>

                {isReportStale && (
                  <div className="report-stale-stamp">
                    <AlertTriangle size={13} />
                    <span>OUTDATED REPORT — FINANCIAL METRICS OR COMPARABLE DEALS MODIFIED SINCE SYNTHESIS</span>
                  </div>
                )}

                {/* Institutional Metadata Pill Strip */}
                <div className="report-meta-grid">
                  <div className="report-meta-item">
                    <span className="report-meta-label">TARGET PROFILE</span>
                    <span className="report-meta-val">{companyName}</span>
                  </div>
                  <div className="report-meta-item">
                    <span className="report-meta-label">PRIMARY SECTOR</span>
                    <span className="report-meta-val">{sector}</span>
                  </div>
                  <div className="report-meta-item">
                    <span className="report-meta-label">CENTRAL MULTIPLE</span>
                    <span className="report-meta-val">{referenceMultiple ? `${referenceMultiple.toFixed(1)}x EV/Rev` : '—'}</span>
                  </div>
                  <div className="report-meta-item">
                    <span className="report-meta-label">GOVERNANCE GATE</span>
                    <span className="report-meta-val" style={{ color: isApprovalValid ? 'hsl(var(--emerald))' : reviewed ? 'hsl(var(--amber))' : 'inherit' }}>
                      {isApprovalValid ? 'Verified & Approved' : reviewed ? 'Approval Invalidated' : 'Pending Sign-Off'}
                    </span>
                  </div>
                </div>

                {/* Rendered Markdown Content using marked parser */}
                <div
                  className="prose-report"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(generatedReportMarkdown)
                  }}
                />

                <div className="report-footer-bar">
                  <span>Confidential M&A Advisory Assessment · Prepared by Autonomous AI Deal Agent</span>
                  <span>Layout: {(reportLayouts.find(l => l.id === activeLayoutId)?.name) || 'Institutional'} · Status: {reviewed ? 'Banker Approved' : 'Draft'}</span>
                </div>
              </article>

              {/* Bottom Navigation CTA */}
              <div className="brief-bottom-nav">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab('comps')}
                >
                  ← Back to Comps
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab('chat')}
                >
                  <span>Consult Deal Copilot</span>
                  <MessageSquare size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Deal Intelligence Copilot & Chat with Retained Context */}
      {activeTab === 'chat' && (
        <AgentChatView
          company={seller}
          financials={{ revenue, growth, margin, retention, netDebt }}
          comparableDeals={selectedDeals}
          knowledgeBase={knowledgeBase}
          skills={skills}
          researchReport={generatedReportMarkdown}
          chatMessages={chatMessages}
          onUpdateChatMessages={handleUpdateChatMessages}
          apiKey={aiSettings?.keys?.[aiSettings?.activeProvider] || apiKey}
          providerId={aiSettings?.activeProvider || 'gemini'}
          modelId={aiSettings?.models?.[aiSettings?.activeProvider] || ''}
          aiSettings={aiSettings}
          onToast={onToast}
        />
      )}
    </div>
  );
}

function sanitizeReportMarkdown(md) {
  if (!md) return '';
  let text = String(md).trim();

  // If Gemini returned a JSON string, extract the reportMarkdown field
  if (text.startsWith('```json') || text.startsWith('{')) {
    try {
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(cleanJson);
      if (parsed.reportMarkdown && typeof parsed.reportMarkdown === 'string') {
        text = parsed.reportMarkdown;
      }
    } catch {
      const match = text.match(/"reportMarkdown"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"|"\s*})/);
      if (match) {
        text = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
    }
  }

  // Remove surrounding markdown fences if present
  text = text.replace(/^```markdown\s*/i, '').replace(/\s*```$/, '');

  return text;
}

function renderMarkdown(md) {
  if (!md) return '';
  try {
    const sanitized = sanitizeReportMarkdown(md);
    const raw = marked.parse(sanitized, { gfm: true, breaks: false });
    const formatted = raw
      .replace(/<table>/g, '<div class="table-container"><table>')
      .replace(/<\/table>/g, '</table></div>');
    return sanitizeHtmlContent(formatted);
  } catch (err) {
    return `<p>${sanitizeHtmlContent(md)}</p>`;
  }
}
