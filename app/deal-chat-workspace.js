'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send, Bot, User, Sparkles, Building2, BarChart3, TrendingUp,
  ShieldCheck, DollarSign, ArrowRight, Check, Copy, RotateCcw,
  FileText, ChevronRight, ChevronLeft, Plus, Trash2, Search,
  Sliders, ExternalLink, Printer, Download, BookOpen, Zap,
  KeyRound, Sun, Moon, Info, CheckCircle2, AlertCircle, Clock,
  Layers, Users, Share2, Compass, Cpu, Maximize2, Minimize2
} from 'lucide-react';
import { marked } from 'marked';
import {
  getCompanyWorkspace,
  saveCompanyWorkspace,
  getStoredWorkspaces,
  clearCompanyWorkspace
} from './workspace-store';

export default function DealChatWorkspace({
  initialCompanies = [],
  apiKey = '',
  aiSettings = null,
  knowledgeBase = [],
  skills = [],
  reportLayouts = [],
  activeLayoutId = 'layout-standard-ma',
  onOpenApiKeyModal = () => {},
  onOpenKnowledgeBaseModal = () => {},
  onOpenSkillsModal = () => {},
  onOpenCustomModal = () => {},
  isDarkMode = true,
  onToggleTheme = () => {},
  onToast = () => {}
}) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [activeCompanyId, setActiveCompanyId] = useState(initialCompanies[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCanvasOpen, setIsCanvasOpen] = useState(true);
  const [activeCanvasTab, setActiveCanvasTab] = useState('corridor'); // 'brief' | 'corridor' | 'comps' | 'financials'
  const [workspacesRev, setWorkspacesRev] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  // Active Company Object
  const activeCompany = useMemo(() => {
    return companies.find(c => c.id === activeCompanyId) || companies[0] || {};
  }, [companies, activeCompanyId]);

  // Read workspace for active company
  const currentWorkspace = useMemo(() => {
    if (!activeCompany?.id) return null;
    return getCompanyWorkspace(activeCompany.id, activeCompany);
  }, [activeCompany?.id, activeCompany, workspacesRev]);

  // Financial State derived from workspace
  const [revenue, setRevenue] = useState(28);
  const [growth, setGrowth] = useState(34);
  const [margin, setMargin] = useState(19);
  const [retention, setRetention] = useState(114);
  const [netDebt, setNetDebt] = useState(4);

  // Research State derived from workspace
  const [reportMarkdown, setReportMarkdown] = useState('');
  const [comparableDeals, setComparableDeals] = useState([]);
  const [groundingSources, setGroundingSources] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isAgentRunning, setIsAgentRunning] = useState(false);

  // Sync state whenever active company changes
  useEffect(() => {
    if (!activeCompany?.id) return;
    const ws = getCompanyWorkspace(activeCompany.id, activeCompany);

    setRevenue(ws.financials?.revenue ?? parseAmountM(activeCompany.revenue));
    setGrowth(ws.financials?.growth ?? parsePercent(activeCompany.growth));
    setMargin(ws.financials?.margin ?? parsePercent(activeCompany.margin));
    setRetention(ws.financials?.retention ?? parsePercent(activeCompany.retention));
    setNetDebt(ws.financials?.netDebt ?? (activeCompany.netDebt ?? 4));

    setReportMarkdown(ws.research?.generatedReportMarkdown || '');
    setComparableDeals(Array.isArray(ws.research?.activeDeals) && ws.research.activeDeals.length > 0 ? ws.research.activeDeals : getDefaultComps(activeCompany.sector));
    setGroundingSources(ws.research?.groundingSources || []);
    setChatMessages(Array.isArray(ws.chat?.messages) ? ws.chat.messages : []);
  }, [activeCompanyId]);

  // Chat Input & State
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  // Calculated Valuations
  const multiples = useMemo(() => {
    const list = comparableDeals.map(d => d.multiple).filter(Boolean).sort((a, b) => a - b);
    if (!list.length) return { low: 3.5, median: 4.5, high: 5.5 };
    return {
      low: list[0],
      median: list[Math.floor(list.length / 2)],
      high: list[list.length - 1]
    };
  }, [comparableDeals]);

  const lowEV = Number((revenue * multiples.low).toFixed(1));
  const medianEV = Number((revenue * multiples.median).toFixed(1));
  const highEV = Number((revenue * multiples.high).toFixed(1));
  const medianEquity = Number((medianEV - netDebt).toFixed(1));

  // Default welcome message when chat is fresh
  const defaultWelcomeMessage = useMemo(() => ({
    id: `welcome-${activeCompany?.id || 'target'}`,
    role: 'assistant',
    content: `Hello! I am your **Autonomous Deal Intelligence & Valuation Copilot** for **${activeCompany?.name || 'Target Asset'}**.

I have structured a living research dossier for this company:
* **Financial Baseline:** $${revenue}M LTM Revenue · ${growth}% YoY Growth · ${margin}% EBITDA · ${retention}% NRR.
* **Precedent Comps:** ${comparableDeals.length} calibrated M&A transactions.
* **Dossier Canvas:** ${reportMarkdown ? 'Institutional brief synthesized & live on the right canvas.' : 'Ready to analyze market dynamics and calculate valuation corridors.'}

Ask me to analyze valuation multiples, stress-test growth or margins, identify strategic buyers, or draft investment committee memos.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }), [activeCompany?.id, activeCompany?.name, revenue, growth, margin, retention, comparableDeals.length, Boolean(reportMarkdown)]);

  const displayedMessages = chatMessages.length > 0 ? chatMessages : [defaultWelcomeMessage];

  // Persist chat updates to store
  const persistChatMessages = (newMessages) => {
    setChatMessages(newMessages);
    saveCompanyWorkspace(activeCompanyId, {
      chat: {
        messages: newMessages,
        lastUpdated: new Date().toISOString()
      }
    });
    setWorkspacesRev(v => v + 1);
  };

  // Persist financial adjustment
  const handleUpdateFinancials = (updatedFin) => {
    const nextFin = {
      revenue,
      growth,
      margin,
      retention,
      netDebt,
      ...updatedFin
    };
    if (updatedFin.revenue !== undefined) setRevenue(updatedFin.revenue);
    if (updatedFin.growth !== undefined) setGrowth(updatedFin.growth);
    if (updatedFin.margin !== undefined) setMargin(updatedFin.margin);
    if (updatedFin.retention !== undefined) setRetention(updatedFin.retention);
    if (updatedFin.netDebt !== undefined) setNetDebt(updatedFin.netDebt);

    saveCompanyWorkspace(activeCompanyId, {
      financials: nextFin
    });
    setWorkspacesRev(v => v + 1);
  };

  // Send Chat Query
  const handleSend = async (customText) => {
    const text = (customText || input).trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...displayedMessages, userMessage];
    persistChatMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          company: {
            ...activeCompany,
            revenue,
            growth,
            margin,
            retention,
            netDebt
          },
          comparableDeals,
          knowledgeBase: (knowledgeBase || []).filter(k => k.enabled),
          skills: (skills || []).filter(s => s.enabled),
          researchReport: reportMarkdown,
          apiKey: aiSettings?.keys?.[aiSettings?.activeProvider] || apiKey,
          providerId: aiSettings?.activeProvider || 'gemini',
          modelId: aiSettings?.models?.[aiSettings?.activeProvider] || ''
        })
      });

      const data = await response.json();
      if (data.success) {
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          provider: data.provider,
          model: data.model,
          citations: data.citations || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updated = [...nextMessages, assistantMessage];
        persistChatMessages(updated);
      } else {
        throw new Error(data.error || 'Failed to complete AI response');
      }
    } catch (err) {
      console.error('Chat inference error:', err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Advisory Notice:** Encountered an inference notice (${err.message}). Your company dossier and valuation model remain fully active on the right canvas.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      persistChatMessages([...nextMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run Autonomous Multi-Agent Deep Research
  const handleRunDeepResearch = async () => {
    setIsAgentRunning(true);
    onToast(`Autonomous agents dispatched for ${activeCompany?.name || 'target'}...`);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: {
            ...activeCompany,
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
        setReportMarkdown(data.reportMarkdown || '');
        setGroundingSources(data.groundingSources || []);
        if (Array.isArray(data.comparableDeals) && data.comparableDeals.length > 0) {
          setComparableDeals(data.comparableDeals);
        }

        // Save into workspace
        saveCompanyWorkspace(activeCompanyId, {
          financials: { revenue, growth, margin, retention, netDebt },
          research: {
            agentStatus: 'completed',
            generatedReportMarkdown: data.reportMarkdown || '',
            agentLogs: data.agentLogs || [],
            groundingSources: data.groundingSources || [],
            activeDeals: data.comparableDeals || comparableDeals,
            reviewed: false,
            lastResearchedAt: new Date().toISOString()
          }
        });
        setWorkspacesRev(v => v + 1);

        // Add a message into the chat acknowledging research completion
        const notifyMsg = {
          id: `research-done-${Date.now()}`,
          role: 'assistant',
          content: `### 🎯 Autonomous Research Complete for **${activeCompany?.name}**
I have synthesized market intelligence, verified precedent transactions, and generated an institutional valuation brief.
* **Indicative Enterprise Range:** $${lowEV}M to $${highEV}M (Median: $${medianEV}M)
* **Precedent Benchmark Comps:** ${(data.comparableDeals || []).length} sector acquisitions calibrated.
* **Canvas Updated:** The full 8-section report and valuation models are now live on your right canvas.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        persistChatMessages([...displayedMessages, notifyMsg]);
        setIsCanvasOpen(true);
        setActiveCanvasTab('brief');
        onToast('Deep research synthesized! Dossier updated on canvas.');
      } else {
        throw new Error(data.error || 'Failed to complete agent research');
      }
    } catch (err) {
      console.error('Deep research error:', err);
      onToast(`Research agent error: ${err.message}`);
    } finally {
      setIsAgentRunning(false);
    }
  };

  const handleClearSessionChat = () => {
    persistChatMessages([]);
    onToast(`Cleared conversation for "${activeCompany?.name}".`);
  };

  // Quick Starters
  const starterPrompts = [
    { label: '📊 Precedent Multiples', query: `Analyze precedent M&A benchmark multiples for ${activeCompany?.name} and explain the median valuation spread.` },
    { label: '🔍 Diligence Checklist', query: `What are the top 3 financial and operational diligence red flags to audit before issuing an LOI for ${activeCompany?.name}?` },
    { label: '🏢 Strategic Consolidators', query: `Identify the top 4 strategic and financial sponsor acquirers most likely to bid for ${activeCompany?.name} and explain their acquisition rationale.` },
    { label: '⚡ Stress-Test (20% Growth)', query: `If ${activeCompany?.name} revenue growth contracts to 20% over the next 12 months, what is the impact on Enterprise Value and EBITDA multiples?` },
    { label: '📑 Draft Executive Teaser', query: `Draft a confidential 1-page executive acquisition teaser for PE sponsors highlighting ${activeCompany?.name}'s unit economics and moat.` }
  ];

  const filteredCompanies = companies.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.sector || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const storedAll = getStoredWorkspaces();

  return (
    <div className="chat-workspace-shell">
      {/* ========================================================
          COLUMN 1: TARGET SESSIONS SIDEBAR
          ======================================================== */}
      <aside className="chat-workspace-sidebar">
        {/* Brand / Logo Area */}
        <div className="sidebar-brand-row">
          <div className="brand-badge-wrap">
            <div className="brand-icon-box">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="brand-title">DealBridge AI</span>
              <span className="brand-subtitle">Intelligence Workspace</span>
            </div>
          </div>
          <span className="badge badge-outline" style={{ fontSize: '0.625rem' }}>Chat-First</span>
        </div>

        {/* Primary Action: New Company Research */}
        <div className="sidebar-action-wrap">
          <button
            type="button"
            className="btn btn-primary sidebar-new-btn"
            onClick={onOpenCustomModal}
          >
            <Plus size={15} />
            <span>New Target Research</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="sidebar-search-wrap">
          <Search size={13} className="sidebar-search-icon" />
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Filter target sessions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Target Sessions List */}
        <div className="sidebar-sessions-list">
          <div className="sidebar-section-label">
            <span>Diligence Sessions ({filteredCompanies.length})</span>
          </div>

          {filteredCompanies.map(comp => {
            const isSelected = comp.id === activeCompanyId;
            const ws = storedAll[comp.id];
            const hasReport = Boolean(ws?.research?.generatedReportMarkdown);
            const msgCount = ws?.chat?.messages?.length || 0;

            return (
              <button
                key={comp.id}
                type="button"
                className={`sidebar-session-item ${isSelected ? 'active' : ''}`}
                onClick={() => setActiveCompanyId(comp.id)}
              >
                <div
                  className="session-avatar"
                  style={{ background: getSectorGradient(comp.sector) }}
                >
                  {comp.initials || comp.name?.slice(0, 2).toUpperCase() || 'CO'}
                </div>

                <div className="session-info">
                  <div className="session-title-row">
                    <span className="session-name">{comp.name}</span>
                    {hasReport && <span className="session-verified-dot" title="Institutional brief ready" />}
                  </div>
                  <span className="session-meta">
                    {comp.revenue || '$25M'} · {comp.sector}
                  </span>
                </div>

                {msgCount > 0 && (
                  <span className="session-msg-badge" title={`${msgCount} messages stored`}>
                    {msgCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Controls */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-tools">
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={onOpenApiKeyModal}
              title="Configure AI Provider & API Keys"
            >
              <KeyRound size={12} />
              <span>{aiSettings?.activeProvider ? aiSettings.activeProvider.toUpperCase() : 'Gemini'}</span>
            </button>

            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={onOpenKnowledgeBaseModal}
              title="Manage Grounding Knowledge Base"
            >
              <BookOpen size={12} />
              <span>KB ({(knowledgeBase || []).filter(k => k.enabled).length})</span>
            </button>

            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={onOpenSkillsModal}
              title="Agent Analysis Skills"
            >
              <Zap size={12} />
              <span>Skills ({(skills || []).filter(s => s.enabled).length})</span>
            </button>

            <button
              type="button"
              className="btn btn-outline btn-xs btn-icon"
              onClick={onToggleTheme}
              title="Toggle Dark / Light Theme"
            >
              {isDarkMode ? <Sun size={12} /> : <Moon size={12} />}
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================
          COLUMN 2: CONVERSATIONAL DILIGENCE AGENT
          ======================================================== */}
      <main className="chat-workspace-center">
        {/* Active Target Header Bar */}
        <header className="workspace-center-header">
          <div className="center-header-left">
            <div
              className="active-target-mark"
              style={{ background: getSectorGradient(activeCompany?.sector) }}
            >
              {activeCompany?.initials || 'CO'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 className="active-target-title">{activeCompany?.name}</h2>
                <span className="badge badge-secondary" style={{ fontSize: '0.6875rem' }}>
                  {activeCompany?.sector}
                </span>
                {reportMarkdown && (
                  <span className="badge badge-success" style={{ fontSize: '0.625rem', gap: '0.2rem' }}>
                    <CheckCircle2 size={10} /> Dossier Ready
                  </span>
                )}
              </div>
              <div className="active-target-metrics">
                <span><strong>${revenue}M</strong> LTM Revenue</span>
                <span className="dot-divider">·</span>
                <span><strong>{growth}%</strong> Growth</span>
                <span className="dot-divider">·</span>
                <span><strong>{margin}%</strong> EBITDA</span>
                <span className="dot-divider">·</span>
                <span><strong>{retention}%</strong> NRR</span>
                <span className="dot-divider">·</span>
                <span>Net Debt: <strong>${netDebt}M</strong></span>
              </div>
            </div>
          </div>

          <div className="center-header-right">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleRunDeepResearch}
              disabled={isAgentRunning}
              title="Dispatch multi-agent research and update dossier canvas"
            >
              <Sparkles size={13} className={isAgentRunning ? 'spin-slow' : ''} />
              <span>{isAgentRunning ? 'Agents Researching...' : reportMarkdown ? 'Re-run Deep Research' : 'Run Deep Research'}</span>
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsCanvasOpen(!isCanvasOpen)}
              title={isCanvasOpen ? 'Collapse Deal Canvas' : 'Expand Deal Canvas'}
            >
              <Layers size={13} />
              <span>{isCanvasOpen ? 'Hide Canvas' : 'View Canvas'}</span>
              {isCanvasOpen ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm btn-icon"
              onClick={handleClearSessionChat}
              title="Reset conversation for this target"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </header>

        {/* Message Stream Thread */}
        <div className="workspace-messages-scroll">
          {displayedMessages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`workspace-msg-row ${isUser ? 'is-user' : 'is-assistant'}`}
              >
                <div className="msg-avatar">
                  {isUser ? <User size={14} /> : <Bot size={14} />}
                </div>

                <div className="msg-bubble-wrap">
                  <div className={`msg-bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}`}>
                    {isUser ? (
                      <div className="msg-user-text">{msg.content}</div>
                    ) : (
                      <div
                        className="prose-chat"
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(msg.content, { gfm: true, breaks: false })
                        }}
                      />
                    )}

                    {/* Web Search Citations */}
                    {Array.isArray(msg.citations) && msg.citations.length > 0 && (
                      <div className="msg-citations-wrap">
                        <span className="citations-header">Verified Online Citations:</span>
                        <div className="citations-chips">
                          {msg.citations.map((c, i) => (
                            <a
                              key={i}
                              href={c.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="citation-chip"
                            >
                              <ExternalLink size={10} />
                              <span>{c.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="msg-meta-row">
                    <span>{msg.timestamp}</span>
                    {msg.provider && (
                      <span className="badge badge-outline badge-xs">{msg.provider}</span>
                    )}
                    {!isUser && (
                      <button
                        type="button"
                        className="msg-copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                          onToast('Copied to clipboard');
                        }}
                        title="Copy message"
                      >
                        <Copy size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="workspace-msg-row is-assistant">
              <div className="msg-avatar">
                <Bot size={14} />
              </div>
              <div className="msg-bubble bubble-assistant" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem' }}>
                <Sparkles size={14} className="spin-slow" style={{ color: 'hsl(var(--primary))' }} />
                <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
                  Deal intelligence agent synthesizing financial models & precedent transactions...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Diligence Starter Prompt Chips */}
        <div className="workspace-prompts-bar">
          <div className="prompts-scroll">
            {starterPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="starter-chip-btn"
                onClick={() => handleSend(p.query)}
                disabled={isLoading}
              >
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conversational Message Input */}
        <div className="workspace-input-container">
          <div className="input-box-wrapper">
            <textarea
              rows={2}
              className="workspace-textarea"
              placeholder={`Ask the agent anything about ${activeCompany?.name || 'the target'}, adjust assumptions, or request M&A materials... (Enter to send)`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
            />
            <button
              type="button"
              className="btn btn-primary workspace-send-btn"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              title="Send message (Enter)"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </main>

      {/* ========================================================
          COLUMN 3: LIVING DEAL CANVAS (INTERACTIVE ARTIFACT)
          ======================================================== */}
      {isCanvasOpen && (
        <aside className="chat-workspace-canvas">
          {/* Canvas Navigation Header */}
          <div className="canvas-header">
            <div className="canvas-header-title">
              <FileText size={15} className="text-emerald-500" />
              <strong>Living Deal Canvas</strong>
            </div>

            <div className="canvas-header-actions">
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => {
                  if (reportMarkdown) {
                    navigator.clipboard.writeText(reportMarkdown);
                    onToast('Dossier markdown copied to clipboard');
                  } else {
                    onToast('Run deep research first to generate report.');
                  }
                }}
                title="Copy full markdown report"
              >
                <Copy size={11} />
                <span>Copy</span>
              </button>

              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => window.print()}
                title="Print or Save as PDF"
              >
                <Printer size={11} />
                <span>PDF</span>
              </button>

              <button
                type="button"
                className="btn btn-outline btn-xs btn-icon"
                onClick={() => setIsCanvasOpen(false)}
                title="Close Canvas"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Canvas Tab Selector */}
          <div className="canvas-tabs-bar">
            {[
              { id: 'corridor', label: 'Valuation Corridor', icon: BarChart3 },
              { id: 'brief', label: 'Institutional Brief', icon: FileText, isDone: Boolean(reportMarkdown) },
              { id: 'comps', label: 'Precedents', count: `${comparableDeals.length}`, icon: TrendingUp },
              { id: 'financials', label: 'Model Assumptions', icon: Sliders }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`canvas-tab-btn ${activeCanvasTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveCanvasTab(tab.id)}
                >
                  <Icon size={12} />
                  <span>{tab.label}</span>
                  {tab.count && <span className="tab-count-pill">{tab.count}</span>}
                  {tab.isDone && <CheckCircle2 size={10} className="text-emerald-500" />}
                </button>
              );
            })}
          </div>

          {/* Canvas Body Content */}
          <div className="canvas-content-body">
            {/* 1. VALUATION CORRIDOR TAB */}
            {activeCanvasTab === 'corridor' && (
              <div className="canvas-corridor-view">
                <div className="corridor-overview-banner">
                  <div>
                    <span className="corridor-banner-eyebrow">Enterprise Value Range</span>
                    <h3 className="corridor-banner-val">{money(medianEV)}</h3>
                    <p className="corridor-banner-sub">
                      Central reference implies <strong>{multiples.median.toFixed(1)}x EV/Revenue</strong> on ${revenue}M LTM revenue.
                    </p>
                  </div>
                  <span className="badge badge-success" style={{ height: 'fit-content' }}>
                    Indicative Equity: {money(medianEquity)}
                  </span>
                </div>

                {/* Precedent Multiple Spread */}
                <div className="card-sub-block">
                  <div className="sub-block-title-row">
                    <span className="sub-block-title">Precedent Multiple Spread</span>
                    <span className="badge badge-secondary badge-xs">EV / LTM Revenue</span>
                  </div>

                  <div className="spread-values-grid">
                    <div className="spread-val-col val-low">
                      <span className="spread-label">Low ({multiples.low.toFixed(1)}x)</span>
                      <strong className="spread-num">{money(lowEV)}</strong>
                    </div>
                    <div className="spread-val-col val-median highlight">
                      <span className="spread-label">Median Benchmark ({multiples.median.toFixed(1)}x)</span>
                      <strong className="spread-num text-emerald-500">{money(medianEV)}</strong>
                    </div>
                    <div className="spread-val-col val-high">
                      <span className="spread-label">High ({multiples.high.toFixed(1)}x)</span>
                      <strong className="spread-num">{money(highEV)}</strong>
                    </div>
                  </div>

                  <div className="spread-track-wrap">
                    <div className="spread-track-bar">
                      <div className="spread-pin pin-low" style={{ left: '15%' }} />
                      <div className="spread-pin pin-median" style={{ left: '50%' }} />
                      <div className="spread-pin pin-high" style={{ left: '85%' }} />
                    </div>
                  </div>
                </div>

                {/* Mathematical Equity Value Bridge */}
                <div className="card-sub-block">
                  <div className="sub-block-title-row">
                    <span className="sub-block-title">Enterprise to Equity Value Bridge</span>
                    <span className="text-muted-foreground" style={{ fontSize: '0.6875rem' }}>Median Reference</span>
                  </div>

                  <div className="bridge-equation-grid">
                    <div className="bridge-calc-card">
                      <span className="bridge-calc-label">Enterprise Value</span>
                      <strong className="bridge-calc-value">{money(medianEV)}</strong>
                      <small className="bridge-calc-sub">{multiples.median.toFixed(1)}x EV</small>
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
                      <strong className="bridge-calc-value text-emerald-500">{money(medianEquity)}</strong>
                      <small className="bridge-calc-sub text-emerald-600">Net to Seller</small>
                    </div>
                  </div>
                </div>

                {/* Valuation Scenarios Summary */}
                <div className="card-sub-block">
                  <span className="sub-block-title" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Benchmark Scenario Corridor
                  </span>
                  <div className="canvas-cases-list">
                    <div className="canvas-case-card">
                      <div>
                        <strong>Lower Reference</strong>
                        <span className="text-muted-foreground"> · {multiples.low.toFixed(1)}x multiple</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="case-ev-text">{money(lowEV)} EV</span>
                        <small className="case-equity-text">({money(lowEV - netDebt)} Equity)</small>
                      </div>
                    </div>

                    <div className="canvas-case-card is-active">
                      <div>
                        <strong className="text-emerald-500">Central Reference (Median)</strong>
                        <span className="text-muted-foreground"> · {multiples.median.toFixed(1)}x multiple</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="case-ev-text text-emerald-500">{money(medianEV)} EV</span>
                        <small className="case-equity-text">({money(medianEquity)} Equity)</small>
                      </div>
                    </div>

                    <div className="canvas-case-card">
                      <div>
                        <strong>Strong-Buyer Reference</strong>
                        <span className="text-muted-foreground"> · {multiples.high.toFixed(1)}x multiple</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="case-ev-text">{money(highEV)} EV</span>
                        <small className="case-equity-text">({money(highEV - netDebt)} Equity)</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. INSTITUTIONAL BRIEF TAB */}
            {activeCanvasTab === 'brief' && (
              <div className="canvas-report-view">
                {reportMarkdown ? (
                  <div
                    className="prose-chat prose-dossier"
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(reportMarkdown, { gfm: true })
                    }}
                  />
                ) : (
                  <div className="canvas-empty-state">
                    <Sparkles size={28} className="text-muted-foreground" />
                    <h4>No Dossier Generated Yet</h4>
                    <p>Click &quot;Run Deep Research&quot; or ask the agent in chat to synthesize a comprehensive 8-section valuation brief for {activeCompany?.name}.</p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleRunDeepResearch}
                      disabled={isAgentRunning}
                      style={{ marginTop: '0.75rem' }}
                    >
                      <Sparkles size={13} />
                      <span>Generate Dossier Now</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. PRECEDENT COMPS TAB */}
            {activeCanvasTab === 'comps' && (
              <div className="canvas-comps-view">
                <div className="comps-header-summary">
                  <div>
                    <span className="sub-block-title">Calibrated Sector Transactions</span>
                    <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                      Recent acquisitions in {activeCompany?.sector}
                    </p>
                  </div>
                  <span className="badge badge-secondary">{comparableDeals.length} Deals</span>
                </div>

                <div className="canvas-comps-list">
                  {comparableDeals.map(deal => (
                    <div key={deal.id} className="comp-deal-card">
                      <div className="comp-deal-header">
                        <div>
                          <strong className="comp-target-name">{deal.name}</strong>
                          <span className="comp-buyer-name">Acquirer: {deal.buyer}</span>
                        </div>
                        <div className="comp-deal-pill">
                          <span className="comp-multiple">{deal.multiple ? `${deal.multiple.toFixed(1)}x` : '—'}</span>
                          <span className="comp-ev">${deal.ev}M EV</span>
                        </div>
                      </div>
                      <div className="comp-deal-meta">
                        <span>Date: {deal.date}</span>
                        <span>Rev: ${deal.revenue}M</span>
                        {deal.ebitdaMultiple && <span>EBITDA: {deal.ebitdaMultiple}x</span>}
                      </div>
                      {deal.rationale && (
                        <p className="comp-deal-rationale">{deal.rationale}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. FINANCIAL ASSUMPTIONS & SENSITIVITY TAB */}
            {activeCanvasTab === 'financials' && (
              <div className="canvas-financials-view">
                <div className="sub-block-title-row" style={{ marginBottom: '0.75rem' }}>
                  <span className="sub-block-title">Target Financial Model Baseline</span>
                  <span className="badge badge-secondary badge-xs">Real-Time Sensitivity</span>
                </div>

                <div className="assumption-input-group">
                  <div className="assumption-header">
                    <label>LTM Revenue ($M)</label>
                    <span className="assumption-val">${revenue}M</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    step="1"
                    value={revenue}
                    onChange={e => handleUpdateFinancials({ revenue: Number(e.target.value) })}
                    className="assumption-slider"
                  />
                </div>

                <div className="assumption-input-group">
                  <div className="assumption-header">
                    <label>YoY Revenue Growth (%)</label>
                    <span className="assumption-val">{growth}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="1"
                    value={growth}
                    onChange={e => handleUpdateFinancials({ growth: Number(e.target.value) })}
                    className="assumption-slider"
                  />
                </div>

                <div className="assumption-input-group">
                  <div className="assumption-header">
                    <label>EBITDA Margin (%)</label>
                    <span className="assumption-val">{margin}%</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="50"
                    step="1"
                    value={margin}
                    onChange={e => handleUpdateFinancials({ margin: Number(e.target.value) })}
                    className="assumption-slider"
                  />
                </div>

                <div className="assumption-input-group">
                  <div className="assumption-header">
                    <label>Net Revenue Retention (NRR %)</label>
                    <span className="assumption-val">{retention}%</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="150"
                    step="1"
                    value={retention}
                    onChange={e => handleUpdateFinancials({ retention: Number(e.target.value) })}
                    className="assumption-slider"
                  />
                </div>

                <div className="assumption-input-group">
                  <div className="assumption-header">
                    <label>Net Debt ($M)</label>
                    <span className="assumption-val">${netDebt}M</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={netDebt}
                    onChange={e => handleUpdateFinancials({ netDebt: Number(e.target.value) })}
                    className="assumption-slider"
                  />
                </div>

                <div className="sensitivity-recalc-action">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleSend(`I updated ${activeCompany?.name}'s model to: $${revenue}M Revenue, ${growth}% Growth, ${margin}% EBITDA margin, and $${netDebt}M Net Debt. Re-evaluate our valuation corridor and recommend positioning.`)}
                    disabled={isLoading}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Sparkles size={12} />
                    <span>Ask AI to Re-Evaluate Model</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

// Helpers
function parseAmountM(val) {
  const text = String(val ?? '').trim().toUpperCase();
  const num = Number.parseFloat(text.replace(/[^0-9.\-]/g, ''));
  if (!Number.isFinite(num)) return 25;
  if (text.includes('B')) return num * 1000;
  if (text.includes('K')) return num / 1000;
  return num;
}

function parsePercent(val) {
  const num = Number.parseFloat(String(val ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(num) ? num : 25;
}

function money(val) {
  if (typeof val !== 'number' || isNaN(val)) return '$0M';
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
}

function getSectorGradient(sec = '') {
  const s = (sec || '').toLowerCase();
  if (s.includes('health')) return 'linear-gradient(135deg, #059669 0%, #0d9488 100%)';
  if (s.includes('fin') || s.includes('pay')) return 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)';
  if (s.includes('cyber') || s.includes('sec')) return 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)';
  return 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)';
}

function getDefaultComps(sector = '') {
  const s = (sector || '').toLowerCase();
  if (s.includes('health')) {
    return [
      { id: 'c1', name: 'CareLogic Clinical SaaS', buyer: 'Symplr (Clearlake)', date: 'Jan 2026', ev: 135, revenue: 28, multiple: 4.8, ebitdaMultiple: 24.0, rationale: 'Clinical workflow consolidation' },
      { id: 'c2', name: 'VitalAccess Health Tools', buyer: 'R1 RCM / TowerBrook', date: 'Oct 2025', ev: 110, revenue: 28, multiple: 3.9, ebitdaMultiple: 19.5, rationale: 'Ambulatory patient engagement' },
      { id: 'c3', name: 'Apex Revenue Cycle AI', buyer: 'Waystar (EQT Partners)', date: 'Nov 2024', ev: 142, revenue: 28, multiple: 5.1, ebitdaMultiple: 26.5, rationale: 'Automated claim adjudication' }
    ];
  }
  if (s.includes('fin') || s.includes('pay')) {
    return [
      { id: 'f1', name: 'LedgerFlow Embedded Billing', buyer: 'Stripe Corp', date: 'Jan 2026', ev: 235, revenue: 42, multiple: 5.6, ebitdaMultiple: 28.0, rationale: 'B2B invoice reconciliation' },
      { id: 'f2', name: 'OmniPay Treasury Engine', buyer: 'Fiserv Group', date: 'Sep 2025', ev: 190, revenue: 42, multiple: 4.5, ebitdaMultiple: 22.0, rationale: 'Mid-tier banking treasury tools' },
      { id: 'f3', name: 'PayBridge Rails SaaS', buyer: 'Flywire Corp', date: 'Dec 2024', ev: 210, revenue: 42, multiple: 5.0, ebitdaMultiple: 25.0, rationale: 'Cross-border payout settlement' }
    ];
  }
  return [
    { id: 'g1', name: 'Apex Enterprise Orchestration', buyer: 'ServiceNow Platform', date: 'Feb 2026', ev: 165, revenue: 30, multiple: 5.5, ebitdaMultiple: 27.5, rationale: 'Autonomous enterprise workflows' },
    { id: 'g2', name: 'InsightSphere Analytics', buyer: 'Salesforce (MuleSoft)', date: 'Oct 2025', ev: 135, revenue: 30, multiple: 4.5, ebitdaMultiple: 22.5, rationale: 'Conversational reporting layer' },
    { id: 'g3', name: 'CloudScale Infrastructure', buyer: 'Datadog Systems', date: 'Jun 2025', ev: 155, revenue: 30, multiple: 5.2, ebitdaMultiple: 25.0, rationale: 'Multi-cloud observability' }
  ];
}
