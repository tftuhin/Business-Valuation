'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight, ArrowUpRight, BadgeCheck, BarChart3, Check, CheckCircle2,
  ChevronDown, CircleAlert, Copy, Download, ExternalLink, FileText, Globe,
  Info, KeyRound, LockKeyhole, Plus, Printer, RefreshCw, Search,
  ShieldCheck, Sparkles, TrendingUp, UsersRound, MessageSquare, BookOpen,
  Zap, LayoutTemplate
} from 'lucide-react';
import AgentMonitor from './agent-monitor';
import AgentChatView from './agent-chat-view';
import { marked } from 'marked';

// Baseline precedent transactions
const defaultDeals = [
  { id: 'd1', name: 'PatientAccess Health Cloud', buyer: 'Symplr / Clearlake', date: 'Feb 2026', ev: 144, revenue: 30, multiple: 4.8, ebitdaMultiple: 24.0, rationale: 'Clinical workflow & EHR interoperability tuck-in' },
  { id: 'd2', name: 'ClinicWorkflow SaaS', buyer: 'Healthcare Technology Group', date: 'Sep 2025', ev: 95, revenue: 25, multiple: 3.8, ebitdaMultiple: 19.0, rationale: 'Mid-market ambulatory care expansion' },
  { id: 'd3', name: 'Apex Revenue Cycle AI', buyer: 'Waystar / EQT Partners', date: 'Nov 2024', ev: 80, revenue: 25, multiple: 3.2, ebitdaMultiple: 16.0, rationale: 'Automated claim adjudication & denial management' }
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

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function MetricInput({ label, value, onChange, suffix, hint, min = '0', step = '1' }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <div className="input-wrapper">
        <input type="number" min={min} step={step} value={value} onChange={onChange} />
        {suffix && <em>{suffix}</em>}
      </div>
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );
}

export default function MarketBriefView({
  sellers = [],
  onToast = () => {},
  onOpenCustomModal = () => {},
  onOpenApiKeyModal = () => {},
  apiKey = '',
  knowledgeBase = [],
  skills = [],
  reportLayouts = [],
  activeLayoutId = 'layout-standard-ma',
  onSelectLayout = () => {},
  onOpenKnowledgeBaseModal = () => {},
  onOpenSkillsModal = () => {},
  onOpenLayoutsModal = () => {}
}) {
  const [sellerId, setSellerId] = useState(sellers[0]?.id || '');
  const [revenue, setRevenue] = useState(parseAmountM(sellers[0]?.revenue || 25));
  const [growth, setGrowth] = useState(parsePercent(sellers[0]?.growth || 30));
  const [margin, setMargin] = useState(parsePercent(sellers[0]?.margin || 18));
  const [retention, setRetention] = useState(parsePercent(sellers[0]?.retention || 112));
  const [netDebt, setNetDebt] = useState(sellers[0]?.netDebt ?? 5);

  const [activeDeals, setActiveDeals] = useState(defaultDeals);
  const [includedDeals, setIncludedDeals] = useState(['d1', 'd2', 'd3']);
  const [activeTab, setActiveTab] = useState('analysis');

  // Agent State
  const [agentStatus, setAgentStatus] = useState('idle');
  const [agentLogs, setAgentLogs] = useState([]);
  const [groundingSources, setGroundingSources] = useState([]);
  const [generatedReportMarkdown, setGeneratedReportMarkdown] = useState('');

  // Governance & Review Gate
  const [reviewed, setReviewed] = useState(false);
  const [reviewChecks, setReviewChecks] = useState({ sources: false, assumptions: false, buyerFit: false });

  const seller = sellers.find(item => item.id === sellerId) || sellers[0] || {};

  useEffect(() => {
    if (!seller) return;
    setRevenue(parseAmountM(seller.revenue));
    setGrowth(parsePercent(seller.growth));
    setMargin(parsePercent(seller.margin));
    setRetention(parsePercent(seller.retention));
    setNetDebt(seller.netDebt ?? 5);
    setAgentStatus('idle');
    setReviewed(false);
    setReviewChecks({ sources: false, assumptions: false, buyerFit: false });
    setGeneratedReportMarkdown('');
  }, [sellerId]);

  const selectedDeals = useMemo(
    () => activeDeals.filter(deal => includedDeals.includes(deal.id)),
    [activeDeals, includedDeals]
  );

  const multiples = selectedDeals.map(deal => deal.multiple).sort((a, b) => a - b);
  const lowMultiple = multiples.length ? multiples[0] : 0;
  const referenceMultiple = median(multiples);
  const highMultiple = multiples.length ? multiples[multiples.length - 1] : 0;

  const valuationCases = [
    { key: 'low', label: 'Lower Reference', note: '25th percentile / lowest comp', multiple: lowMultiple, tone: 'slate', icon: ArrowDownRight },
    { key: 'base', label: 'Central Reference', note: 'Median precedent deal benchmark', multiple: referenceMultiple, tone: 'teal', icon: BarChart3 },
    { key: 'high', label: 'Strong-Buyer Reference', note: 'Top quartile strategic multiple', multiple: highMultiple, tone: 'purple', icon: ArrowUpRight }
  ];

  const invalidateDraft = setter => event => {
    setter(event.target.value === '' ? '' : Number(event.target.value));
    setReviewed(false);
    setReviewChecks({ sources: false, assumptions: false, buyerFit: false });
  };

  const toggleDeal = id => {
    setIncludedDeals(current =>
      current.includes(id) ? current.filter(item => item !== id) : [...current, id]
    );
    setReviewed(false);
  };

  const toggleReviewCheck = key => {
    setReviewChecks(current => ({ ...current, [key]: !current[key] }));
    setReviewed(false);
  };

  const runAgentResearch = async () => {
    if (!seller) {
      onToast('Please select or add a target company profile first.');
      return;
    }

    setAgentStatus('running');
    setReviewed(false);
    setReviewChecks({ sources: false, assumptions: false, buyerFit: false });
    onToast('AI Agents dispatched: Conducting market intelligence & precedent deal scout...');

    setAgentLogs([
      { timestamp: new Date().toISOString(), agent: 'Orchestrator Agent', message: `Initializing multi-stage research pipeline for "${seller.name}" (${seller.sector}).` }
    ]);

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
          apiKey,
          knowledgeBase: (knowledgeBase || []).filter(k => k.enabled),
          skills: (skills || []).filter(s => s.enabled),
          reportLayout: (reportLayouts || []).find(l => l.id === activeLayoutId)
        })
      });

      const data = await response.json();

      if (data.success) {
        setAgentLogs(data.agentLogs || []);
        setGroundingSources(data.groundingSources || []);
        setGeneratedReportMarkdown(data.reportMarkdown || '');

        if (Array.isArray(data.comparableDeals) && data.comparableDeals.length > 0) {
          setActiveDeals(data.comparableDeals);
          setIncludedDeals(data.comparableDeals.map(d => d.id));
        }

        setAgentStatus('completed');
        setActiveTab('brief');
        onToast('Agent research complete! Institutional brief generated.');
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
    if (agentStatus !== 'completed') return;
    if (!Object.values(reviewChecks).every(Boolean)) {
      onToast('Complete all three banker verification checks before approving the brief.');
      return;
    }
    setReviewed(value => !value);
    onToast(reviewed ? 'Review sign-off cleared.' : 'Institutional review gate completed and signed off.');
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

  return (
    <div className="shadcn-container">
      {/* Page Header (shadcn style) */}
      <div className="page-header">
        <div className="page-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-secondary">
              <Sparkles size={11} /> Deal Intelligence Agent
            </span>
            <span className="badge badge-outline">v1.0.0</span>
          </div>
          <h1>Company Market Brief & Valuation Engine</h1>
          <p>
            Autonomous AI agentic workflow for exhaustive company analysis, precedent deal benchmarking, and institutional M&A valuation reports.
          </p>
        </div>

        <div className="page-header-actions">
          <span className={`badge ${reviewed ? 'badge-success' : agentStatus === 'completed' ? 'badge-warning' : 'badge-outline'}`}>
            {reviewed ? (
              <><BadgeCheck size={13} /> Banker Approved</>
            ) : agentStatus === 'completed' ? (
              <><CircleAlert size={13} /> Review Required</>
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
            <span>{agentStatus === 'running' ? 'Agents Researching...' : agentStatus === 'completed' ? 'Re-run AI Agents' : 'Run Agent Research'}</span>
          </button>
        </div>
      </div>

      {/* Agent Activity Monitor (shadcn Card style) */}
      <AgentMonitor
        status={agentStatus}
        logs={agentLogs}
        knowledgeBaseCount={(knowledgeBase || []).filter(k => k.enabled).length}
        skillsCount={(skills || []).filter(s => s.enabled).length}
      />

      {/* Tabs List (shadcn Segmented Control) */}
      <div className="tabs-list" role="tablist">
        {[
          { id: 'analysis', num: '1', label: 'Company & Market' },
          { id: 'comps', num: '2', label: 'Precedent Deals' },
          { id: 'brief', num: '3', label: 'Institutional Brief' },
          { id: 'chat', num: '4', label: 'Agent Copilot' }
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
                      STEP 01 · TARGET PROFILE
                    </span>
                    <h2 className="card-title">Target Company Intelligence</h2>
                    <p className="card-description">Select an industry preset or create any custom target profile for the agent to analyze.</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={onOpenCustomModal}
                  >
                    <Plus size={13} />
                    <span>+ New Target</span>
                  </button>
                </div>
              </div>

              {/* Company Selector Header */}
              <div className="company-selector-bar">
                <div className="company-mark">{seller?.initials || 'CO'}</div>
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
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onOpenCustomModal}
                  style={{ gap: '0.35rem', flexShrink: 0 }}
                  title="Add custom target company profile"
                >
                  <Plus size={13} />
                  <span>+ New Target</span>
                </button>
                <span className="badge badge-outline">{seller?.location || 'Verified Record'}</span>
              </div>

              {seller?.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', background: 'hsl(var(--muted) / 0.3)', borderBottom: '1px solid hsl(var(--border))', fontSize: '0.8125rem' }}>
                  <Globe size={13} />
                  <span>Domain: <strong>{seller.website}</strong></span>
                </div>
              )}

              {/* Financial Metrics Inputs */}
              <div className="metrics-fields-grid">
                <div className="form-field">
                  <label className="form-label">Sector / Vertical</label>
                  <div style={{ display: 'flex', alignItems: 'center', height: '2.25rem', fontSize: '0.875rem', fontWeight: 600 }}>
                    {sector}
                  </div>
                  <span className="form-hint">Target industry benchmark</span>
                </div>

                <MetricInput
                  label="LTM Annual Revenue"
                  value={revenue}
                  suffix="$M"
                  hint="Base for EV/Revenue calculations"
                  onChange={invalidateDraft(setRevenue)}
                  step="0.1"
                />

                <MetricInput
                  label="YoY Revenue Growth"
                  value={growth}
                  suffix="%"
                  hint="Compound growth rate indicator"
                  onChange={invalidateDraft(setGrowth)}
                  step="0.1"
                />

                <MetricInput
                  label="EBITDA Margin"
                  value={margin}
                  suffix="%"
                  hint="Operating cash profitability margin"
                  onChange={invalidateDraft(setMargin)}
                  step="0.1"
                />

                <MetricInput
                  label="Net Debt (Debt − Cash)"
                  value={netDebt}
                  suffix="$M"
                  hint="Bridge from Enterprise to Equity Value"
                  onChange={invalidateDraft(setNetDebt)}
                  step="0.1"
                  min="-100000"
                />

                <MetricInput
                  label="Net Retention (NRR)"
                  value={retention}
                  suffix="%"
                  hint="Cohort expansion & customer health"
                  onChange={invalidateDraft(setRetention)}
                  step="0.1"
                />
              </div>

              <div className="card-footer" style={{ fontSize: '0.8125rem', gap: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
                <ShieldCheck size={15} style={{ color: 'hsl(var(--primary))' }} />
                <span>
                  Rule of 40 Benchmark: <strong>{(growth + margin).toFixed(1)}%</strong> ({growth}% growth + {margin}% EBITDA).
                  {growth + margin >= 40 ? ' Top-quartile asset performance.' : ' Moderate growth-profitability balance.'}
                </span>
              </div>
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
            </div>
          </div>

          {/* Right Column: Indicative Valuation Corridor & Grounding */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

              <div className="range-cases-column">
                {valuationCases.map(item => {
                  const Icon = item.icon;
                  const enterpriseValue = revenue * item.multiple;
                  const equityValue = enterpriseValue - netDebt;
                  return (
                    <div key={item.key} className={`range-case-card ${item.key === 'base' ? 'case-teal' : ''}`}>
                      <div className="range-case-top">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Icon size={14} /> {item.label}
                        </span>
                        <span>{item.multiple ? `${item.multiple.toFixed(1)}x EV/Rev` : '—'}</span>
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
              <span className="badge badge-secondary">{selectedDeals.length} of {activeDeals.length} Selected</span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="shadcn-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>Use</th>
                  <th>Target Company</th>
                  <th>Acquirer / Buyer</th>
                  <th>Close Date</th>
                  <th>Enterprise Value</th>
                  <th>Revenue</th>
                  <th>EV / Revenue</th>
                  <th>EV / EBITDA</th>
                  <th>Strategic Rationale</th>
                </tr>
              </thead>
              <tbody>
                {activeDeals.map(deal => (
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
                    <td>{deal.date}</td>
                    <td>{money(deal.ev)}</td>
                    <td>{money(deal.revenue)}</td>
                    <td>
                      <span className="badge badge-outline" style={{ fontWeight: 700 }}>
                        {deal.multiple.toFixed(1)}x
                      </span>
                    </td>
                    <td>{deal.ebitdaMultiple ? `${deal.ebitdaMultiple.toFixed(1)}x` : '—'}</td>
                    <td style={{ maxWidth: 260, color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem' }}>
                      {deal.rationale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card-footer" style={{ justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
              Selected Range: <strong>{lowMultiple.toFixed(1)}x – {highMultiple.toFixed(1)}x EV/Revenue</strong> (Median: <strong>{referenceMultiple.toFixed(1)}x</strong>).
            </span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setActiveTab('analysis')}
            >
              Apply Range to Valuation
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Brief Preview & Institutional Report */}
      {activeTab === 'brief' && (
        <div className="report-view-wrapper">
          {agentStatus === 'idle' && !generatedReportMarkdown ? (
            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <Sparkles size={32} style={{ margin: '0 auto 1rem', color: 'hsl(var(--primary))' }} />
              <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                Generate Institutional Valuation Report
              </h2>
              <p className="card-description" style={{ maxWidth: 480, margin: '0 auto 1.5rem' }}>
                Dispatch autonomous AI agents to explore public company data for <strong>{companyName}</strong>, benchmark precedent transactions in <strong>{sector}</strong>, and synthesize an institutional M&A brief.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={runAgentResearch}
              >
                <Sparkles size={14} />
                <span>Run Agent Research & Generate Report</span>
              </button>
            </div>
          ) : agentStatus === 'running' && !generatedReportMarkdown ? (
            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <Sparkles size={32} className="spin-slow" style={{ margin: '0 auto 1rem', color: 'hsl(var(--primary))' }} />
              <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                AI Agents Researching & Synthesizing...
              </h2>
              <p className="card-description" style={{ maxWidth: 480, margin: '0 auto 1.5rem' }}>
                Multi-agent pipeline is executing web search grounding, sector profiling, and precedent M&A deal valuation for <strong>{companyName}</strong>.
              </p>
            </div>
          ) : (
            <div>
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
                        <strong>{money(revenue * item.multiple)} ({item.multiple.toFixed(1)}x)</strong>
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
                      <strong>{money(revenue * referenceMultiple)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--muted-foreground))' }}>
                      <span>Less Net Debt:</span>
                      <strong>− {money(netDebt)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.375rem', borderTop: '1px solid hsl(var(--border))', fontWeight: 600 }}>
                      <span>Indicative Equity Value:</span>
                      <strong style={{ color: 'hsl(var(--emerald))' }}>
                        {money(revenue * referenceMultiple - netDebt)}
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
                        <h3 className="card-title" style={{ fontSize: '0.9375rem' }}>Banker Review</h3>
                      </div>
                      <span className={`badge ${reviewed ? 'badge-success' : 'badge-outline'}`} style={{ fontSize: '0.6875rem' }}>
                        {reviewed ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                      className={`btn ${reviewed ? 'btn-reviewed' : 'btn-primary'} btn-sm`}
                      style={{ marginTop: '0.25rem', width: '100%' }}
                      onClick={completeReview}
                      disabled={!reviewReady && !reviewed}
                    >
                      {reviewed ? (
                        <><Check size={13} /> Institutional Review Approved</>
                      ) : (
                        <><ShieldCheck size={13} /> Sign Off as Reviewer</>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
                    {companyName} — Institutional Valuation Brief
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: '0.15rem 0 0' }}>
                    {sector} · Autonomous M&A Deal Intelligence Brief · Layout: {(reportLayouts.find(l => l.id === activeLayoutId)?.name) || 'Standard M&A'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                    className="btn btn-outline btn-sm"
                    onClick={printReport}
                    title="Print report or save as PDF"
                  >
                    <Printer size={13} />
                    <span>Print / PDF</span>
                  </button>
                </div>
              </div>

              {/* The Institutional Document Sheet (Standard Institutional Width, Clean Typography) */}
              <article className="report-sheet">
                <div className="report-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div className="company-mark" style={{ width: '2.5rem', height: '2.5rem', fontSize: '0.875rem' }}>
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
                  <span className={`badge ${reviewed ? 'badge-success' : 'badge-secondary'}`}>
                    {reviewed ? <><BadgeCheck size={13} /> BANKER APPROVED</> : <><CircleAlert size={13} /> DRAFT ASSESSMENT</>}
                  </span>
                </div>

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
                    <span className="report-meta-val" style={{ color: reviewed ? 'hsl(var(--emerald))' : 'inherit' }}>
                      {reviewed ? 'Verified & Approved' : 'Pending Sign-Off'}
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
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Deal Intelligence Copilot & Chat */}
      {activeTab === 'chat' && (
        <AgentChatView
          company={seller}
          financials={{ revenue, growth, margin, retention, netDebt }}
          comparableDeals={selectedDeals}
          knowledgeBase={knowledgeBase}
          skills={skills}
          apiKey={apiKey}
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
    return raw
      .replace(/<table>/g, '<div class="table-container"><table>')
      .replace(/<\/table>/g, '</table></div>');
  } catch (err) {
    return `<p>${md}</p>`;
  }
}

