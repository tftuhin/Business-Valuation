'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send, Bot, User, Sparkles, Building2, BarChart3, TrendingUp,
  ShieldCheck, DollarSign, ArrowRight, Check, Copy, RotateCcw,
  FileText, ChevronRight, ChevronLeft, Plus, Trash2, Search,
  Sliders, ExternalLink, Printer, Download, BookOpen, Zap,
  KeyRound, Sun, Moon, Info, CheckCircle2, AlertCircle, Clock,
  Layers, Users, Share2, Compass, Cpu, Maximize2, Minimize2,
  PanelLeft, PanelLeftClose, X
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
  onAddCompany = () => {},
  isDarkMode = true,
  onToggleTheme = () => {},
  onToast = () => {}
}) {
  const [companies, setCompanies] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('dealbrief_custom_companies_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(initialCompanies.map(c => c.id));
            const customs = parsed.filter(c => !existingIds.has(c.id));
            return [...customs, ...initialCompanies];
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    return initialCompanies;
  });

  const [activeCompanyId, setActiveCompanyId] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('dealbrief_custom_companies_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0].id;
          }
        }
      } catch (e) {}
    }
    return initialCompanies[0]?.id || '';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCanvasOpen, setIsCanvasOpen] = useState(true);
  const [activeCanvasTab, setActiveCanvasTab] = useState('corridor'); // 'brief' | 'corridor' | 'comps' | 'financials'
  const [workspacesRev, setWorkspacesRev] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);

  // Responsive handling: auto-collapse panels on smaller screens
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      setWindowWidth(w);
      if (w < 1100) {
        setIsCanvasOpen(false);
      }
      if (w < 840) {
        setIsSidebarOpen(false);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    const isDraft = Boolean(activeCompany.isDraft || ws.financials?.isDraft);

    setRevenue(ws.financials?.revenue !== undefined ? ws.financials.revenue : (isDraft ? 0 : parseAmountM(activeCompany.revenue)));
    setGrowth(ws.financials?.growth !== undefined ? ws.financials.growth : (isDraft ? 0 : parsePercent(activeCompany.growth)));
    setMargin(ws.financials?.margin !== undefined ? ws.financials.margin : (isDraft ? 0 : parsePercent(activeCompany.margin)));
    setRetention(ws.financials?.retention !== undefined ? ws.financials.retention : (isDraft ? 100 : parsePercent(activeCompany.retention)));
    setNetDebt(ws.financials?.netDebt !== undefined ? ws.financials.netDebt : (isDraft ? 0 : (activeCompany.netDebt ?? 4)));

    setReportMarkdown(ws.research?.generatedReportMarkdown || '');
    setComparableDeals(Array.isArray(ws.research?.activeDeals) && ws.research.activeDeals.length > 0 ? ws.research.activeDeals : getDefaultComps(activeCompany.sector));
    setGroundingSources(ws.research?.groundingSources || []);
    setChatMessages(Array.isArray(ws.chat?.messages) ? ws.chat.messages : []);
  }, [activeCompanyId]);

  // Create New Target Session (Conversational Intake - No Modal!)
  const handleCreateNewSession = () => {
    const customCount = companies.filter(c => c.isCustom || c.isDraft).length + 1;
    const newId = `target-${Date.now()}`;
    const newCompany = {
      id: newId,
      name: `New Target ${customCount}`,
      initials: '🎯',
      sector: 'Sector Pending',
      website: '',
      revenue: '$0M',
      growth: '0%',
      margin: '0%',
      retention: '100%',
      netDebt: 0,
      isDraft: true,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    const welcomeMsg = {
      id: `welcome-${newId}`,
      role: 'assistant',
      content: `### 🎯 New Diligence Session Initiated
Welcome! I am your **Autonomous Deal Intelligence & Valuation Copilot**.

Let's build a live valuation model and institutional research dossier for this new target.

1. **What is the company name and industry/sector?**
   *(e.g., Acme Cloud AI, Enterprise SaaS, acmecloud.ai)*
2. **What are their core financials?**
   *(LTM Revenue, YoY Growth %, EBITDA Margin %, Net Debt)*

*(You can answer step-by-step or send everything at once in a single message!)*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Save into workspace store
    saveCompanyWorkspace(newId, {
      financials: { revenue: 0, growth: 0, margin: 0, retention: 100, netDebt: 0, isDraft: true },
      research: {
        agentStatus: 'idle',
        generatedReportMarkdown: '',
        agentLogs: [],
        groundingSources: [],
        activeDeals: getDefaultComps('Enterprise B2B SaaS & AI')
      },
      chat: {
        messages: [welcomeMsg],
        lastUpdated: new Date().toISOString()
      }
    });

    const nextCompanies = [newCompany, ...companies];
    setCompanies(nextCompanies);
    setActiveCompanyId(newId);

    // Reset local state for this new target
    setRevenue(0);
    setGrowth(0);
    setMargin(0);
    setRetention(100);
    setNetDebt(0);
    setReportMarkdown('');
    setComparableDeals(getDefaultComps('Enterprise B2B SaaS & AI'));
    setGroundingSources([]);
    setChatMessages([welcomeMsg]);
    setActiveCanvasTab('corridor');
    setIsCanvasOpen(true);
    setWorkspacesRev(v => v + 1);

    // Persist to custom companies localStorage
    try {
      localStorage.setItem('dealbrief_custom_companies_v1', JSON.stringify(nextCompanies.filter(c => c.isCustom)));
    } catch (e) {
      console.error(e);
    }

    if (onAddCompany) {
      onAddCompany(newCompany);
    }

    if (windowWidth <= 840) {
      setIsSidebarOpen(false);
    }

    onToast('New target session opened! Provide company details in chat.');
  };

  // Delete / Archive a custom or draft session
  const handleDeleteSession = (companyId) => {
    const targetComp = companies.find(c => c.id === companyId);
    if (!targetComp) return;

    clearCompanyWorkspace(companyId);
    const updatedCompanies = companies.filter(c => c.id !== companyId);
    setCompanies(updatedCompanies);

    try {
      localStorage.setItem('dealbrief_custom_companies_v1', JSON.stringify(updatedCompanies.filter(c => c.isCustom)));
    } catch (e) {
      console.error(e);
    }

    if (activeCompanyId === companyId) {
      const nextActive = updatedCompanies[0]?.id || '';
      setActiveCompanyId(nextActive);
    }

    setWorkspacesRev(v => v + 1);
    onToast(`Deleted session for "${targetComp.name}".`);
  };

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
  const defaultWelcomeMessage = useMemo(() => {
    if (activeCompany?.isDraft || revenue === 0) {
      return {
        id: `welcome-${activeCompany?.id || 'target'}`,
        role: 'assistant',
        content: `### 🎯 Diligence Session Initiated for **${activeCompany?.name || 'New Target'}**
I am your **Autonomous Deal Intelligence & Valuation Copilot**.

Let's calibrate a live valuation model and institutional research dossier for this company.

1. **What is the company name and sector / industry?**
   *(e.g., Acme Cloud AI, Enterprise SaaS, acmecloud.ai)*
2. **What are their core financials?**
   *(LTM Revenue, YoY Growth %, EBITDA Margin %, Net Debt)*

*(Tip: You can answer step-by-step or send everything at once in a single message!)*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
    return {
      id: `welcome-${activeCompany?.id || 'target'}`,
      role: 'assistant',
      content: `Hello! I am your **Autonomous Deal Intelligence & Valuation Copilot** for **${activeCompany?.name || 'Target Asset'}**.

I have structured a living research dossier for this company:
* **Financial Baseline:** $${revenue}M LTM Revenue · ${growth}% YoY Growth · ${margin}% EBITDA · ${retention}% NRR.
* **Precedent Comps:** ${comparableDeals.length} calibrated M&A transactions.
* **Dossier Canvas:** ${reportMarkdown ? 'Institutional brief synthesized & live on the right canvas.' : 'Ready to analyze market dynamics and calculate valuation corridors.'}

Ask me to analyze valuation multiples, stress-test growth or margins, identify strategic buyers, or draft investment committee memos.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }, [activeCompany?.id, activeCompany?.name, activeCompany?.isDraft, revenue, growth, margin, retention, comparableDeals.length, Boolean(reportMarkdown)]);

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

  // Send Chat Query with Conversational Target Parameter Extraction
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

    // Extract any target entities from the user's message
    const isTargetDraft = Boolean(activeCompany?.isDraft || revenue === 0);
    const entities = extractTargetEntities(text, activeCompany, isTargetDraft);
    const hasAnyEntity = Object.keys(entities).length > 0;

    let updatedCompany = { ...activeCompany };
    let companyChanged = false;

    if (entities.name && entities.name !== activeCompany.name) {
      updatedCompany.name = entities.name;
      const words = entities.name.trim().split(/\s+/);
      updatedCompany.initials = words.length > 1
        ? (words[0][0] + words[1][0]).toUpperCase()
        : entities.name.slice(0, 2).toUpperCase();
      companyChanged = true;
    }
    if (entities.sector && entities.sector !== activeCompany.sector) {
      updatedCompany.sector = entities.sector;
      companyChanged = true;
    }
    if (entities.website) {
      updatedCompany.website = entities.website;
      companyChanged = true;
    }

    let nextRevenue = entities.revenue !== undefined ? entities.revenue : revenue;
    let nextGrowth = entities.growth !== undefined ? entities.growth : growth;
    let nextMargin = entities.margin !== undefined ? entities.margin : margin;
    let nextRetention = entities.retention !== undefined ? entities.retention : retention;
    let nextNetDebt = entities.netDebt !== undefined ? entities.netDebt : netDebt;

    if (entities.revenue !== undefined) {
      setRevenue(nextRevenue);
      updatedCompany.revenue = `$${nextRevenue}M`;
      companyChanged = true;
    }
    if (entities.growth !== undefined) {
      setGrowth(nextGrowth);
      updatedCompany.growth = `${nextGrowth}%`;
      companyChanged = true;
    }
    if (entities.margin !== undefined) {
      setMargin(nextMargin);
      updatedCompany.margin = `${nextMargin}%`;
      companyChanged = true;
    }
    if (entities.retention !== undefined) {
      setRetention(nextRetention);
      updatedCompany.retention = `${nextRetention}%`;
      companyChanged = true;
    }
    if (entities.netDebt !== undefined) {
      setNetDebt(nextNetDebt);
      updatedCompany.netDebt = nextNetDebt;
      companyChanged = true;
    }

    let nextComps = comparableDeals;
    if (entities.sector) {
      nextComps = getDefaultComps(entities.sector);
      setComparableDeals(nextComps);
    }

    // Check if ready to exit draft
    if (updatedCompany.isDraft && nextRevenue > 0 && updatedCompany.name && !updatedCompany.name.startsWith('New Target')) {
      updatedCompany.isDraft = false;
      companyChanged = true;
    }

    if (companyChanged) {
      const updatedList = companies.map(c => c.id === activeCompany.id ? updatedCompany : c);
      setCompanies(updatedList);
      try {
        localStorage.setItem('dealbrief_custom_companies_v1', JSON.stringify(updatedList.filter(c => c.isCustom)));
      } catch (e) {}

      saveCompanyWorkspace(activeCompany.id, {
        financials: {
          revenue: nextRevenue,
          growth: nextGrowth,
          margin: nextMargin,
          retention: nextRetention,
          netDebt: nextNetDebt,
          isDraft: updatedCompany.isDraft
        },
        research: {
          activeDeals: nextComps
        }
      });
      setWorkspacesRev(v => v + 1);
    }

    // Check if user has requested extensive research or report generation
    const isResearchRequest = /\b(?:do\s+(?:extensive\s+|deep\s+|market\s+)?research|extensive\s+research|deep\s+research|run\s+(?:deep\s+)?research|research\s+(?:this|the|our)?\s*(?:company|target|asset)?|generate\s+(?:the\s+|a\s+)?(?:report|brief|dossier)|create\s+(?:the\s+|a\s+)?(?:report|brief|dossier)|build\s+(?:the\s+|a\s+)?(?:report|brief|dossier)|make\s+(?:the\s+|a\s+)?(?:report|brief|dossier)|institutional\s+report|valuation\s+report|market\s+brief|synthesize\s+(?:the\s+)?(?:dossier|report|research)|conduct\s+(?:market\s+)?research)\b/i.test(text);

    if (isResearchRequest) {
      await executeDeepResearch(
        updatedCompany,
        {
          revenue: nextRevenue > 0 ? nextRevenue : (revenue > 0 ? revenue : 25),
          growth: nextGrowth > 0 ? nextGrowth : (growth > 0 ? growth : 30),
          margin: nextMargin > 0 ? nextMargin : (margin > 0 ? margin : 18),
          retention: nextRetention > 0 ? nextRetention : (retention > 0 ? retention : 110),
          netDebt: nextNetDebt !== undefined ? nextNetDebt : (netDebt !== undefined ? netDebt : 0)
        },
        nextMessages
      );
      return;
    }

    // Conversational Intake Response (No modal required):
    // If activeCompany was in draft, or revenue was 0, or new target parameters were provided during intake
    if (isTargetDraft || (hasAnyEntity && (activeCompany?.isDraft || revenue === 0))) {
      setIsLoading(true);
      setTimeout(() => {
        const assistantReply = generateConversationalIntakeReply({
          entities,
          company: updatedCompany,
          revenue: nextRevenue,
          growth: nextGrowth,
          margin: nextMargin,
          netDebt: nextNetDebt,
          comparableDeals: nextComps
        });

        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: assistantReply,
          provider: 'M&A Deal Advisory Engine',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        persistChatMessages([...nextMessages, assistantMessage]);
        setIsLoading(false);
      }, 350);
      return;
    }

    // Standard deep chat query
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          company: {
            ...updatedCompany,
            revenue: nextRevenue,
            growth: nextGrowth,
            margin: nextMargin,
            retention: nextRetention,
            netDebt: nextNetDebt
          },
          comparableDeals: nextComps,
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

  // Run Autonomous Multi-Agent Deep Research (Used by both Chat and Header Button)
  const executeDeepResearch = async (
    targetCompany = activeCompany,
    targetFin = { revenue, growth, margin, retention, netDebt },
    baseMessages = displayedMessages
  ) => {
    setIsAgentRunning(true);
    setIsLoading(true);
    onToast(`Autonomous research agents dispatched for ${targetCompany?.name || 'target'}...`);

    const calcRevenue = targetFin.revenue > 0 ? targetFin.revenue : (revenue > 0 ? revenue : 25);
    const calcGrowth = targetFin.growth > 0 ? targetFin.growth : (growth > 0 ? growth : 30);
    const calcMargin = targetFin.margin > 0 ? targetFin.margin : (margin > 0 ? margin : 18);
    const calcRetention = targetFin.retention > 0 ? targetFin.retention : (retention > 0 ? retention : 110);
    const calcDebt = targetFin.netDebt !== undefined ? targetFin.netDebt : (netDebt !== undefined ? netDebt : 0);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: {
            ...targetCompany,
            revenue: calcRevenue,
            growth: calcGrowth,
            margin: calcMargin,
            retention: calcRetention,
            netDebt: calcDebt
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
        const activeDeals = (Array.isArray(data.comparableDeals) && data.comparableDeals.length > 0)
          ? data.comparableDeals
          : (comparableDeals.length > 0 ? comparableDeals : getDefaultComps(targetCompany.sector));

        const multList = activeDeals.map(d => d.multiple).filter(Boolean).sort((a, b) => a - b);
        const lowM = multList.length ? multList[0] : 3.5;
        const medM = multList.length ? multList[Math.floor(multList.length / 2)] : 4.5;
        const highM = multList.length ? multList[multList.length - 1] : 5.5;

        const rLowEV = (calcRevenue * lowM).toFixed(1);
        const rMedEV = (calcRevenue * medM).toFixed(1);
        const rHighEV = (calcRevenue * highM).toFixed(1);
        const rEquity = (Number(rMedEV) - calcDebt).toFixed(1);

        setReportMarkdown(data.reportMarkdown || '');
        setGroundingSources(data.groundingSources || []);
        setComparableDeals(activeDeals);

        // Save into workspace store so it stays inside this company's session context permanently
        saveCompanyWorkspace(targetCompany.id, {
          financials: {
            revenue: calcRevenue,
            growth: calcGrowth,
            margin: calcMargin,
            retention: calcRetention,
            netDebt: calcDebt
          },
          research: {
            agentStatus: 'completed',
            generatedReportMarkdown: data.reportMarkdown || '',
            agentLogs: data.agentLogs || [],
            groundingSources: data.groundingSources || [],
            activeDeals,
            reviewed: false,
            lastResearchedAt: new Date().toISOString()
          }
        });
        setWorkspacesRev(v => v + 1);

        // Automatically open canvas and switch to the generated report
        setIsCanvasOpen(true);
        setActiveCanvasTab('brief');

        // Synthesize conversational response informing the user of the research findings
        const researchReply = `### 🎯 Extensive Market Research & Valuation Brief Synthesized for **${targetCompany.name}**

Autonomous research agents have analyzed the market, benchmarked unit economics, and generated an institutional **8-section valuation report**.

---

### 📊 Valuation Benchmark Summary:
* **Target Asset:** **${targetCompany.name}** ${targetCompany.website ? `(\`${targetCompany.website}\`)` : ''}
* **Sector:** ${targetCompany.sector || 'Enterprise Software'}
* **LTM Revenue:** $${calcRevenue}M | **YoY Growth:** ${calcGrowth}% | **EBITDA Margin:** ${calcMargin}%
* **Precedent Multiple Range:** **${lowM.toFixed(1)}x – ${highM.toFixed(1)}x EV/Revenue** (Median: **${medM.toFixed(1)}x**)
* **Indicative Enterprise Value (EV):** **$${rLowEV}M – $${rHighEV}M** (Median Case: **$${rMedEV}M**)
* **Net Debt Deduction:** **−$${calcDebt}M**
* **Implied Equity Value:** **$${rEquity}M**

---

### 📑 Stored in Context & Available on Canvas:
1. **Executive Summary & Investment Thesis**
2. **Business Overview & Operational Profile**
3. **Financial Summary & Operational KPIs (Benchmarked)**
4. **Market Dynamics & Industry Landscape (TAM $12.5B+, 14.2% CAGR)**
5. **${activeDeals.length} Verified Precedent Transactions**
6. **Indicative Valuation Analysis & Range Corridor**
7. **Strategic & Financial Buyer Universe**
8. **Due Diligence Red Flags & Priority Checklist**

> *The full 8-section report has been stored in this target's context and is now open on your **Living Deal Canvas** (Brief tab). You can now ask me any specific questions about competitors, valuation sensitivity, buyer synergies, or diligence risks!*`;

        const assistantMsg = {
          id: `research-done-${Date.now()}`,
          role: 'assistant',
          content: researchReply,
          provider: data.engine || 'Autonomous Research Agent Fleet',
          model: aiSettings?.models?.[aiSettings?.activeProvider] || 'gemini-2.5-flash',
          citations: (data.groundingSources || []).slice(0, 5),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        persistChatMessages([...baseMessages, assistantMsg]);
        onToast(`Extensive research generated and saved for ${targetCompany.name}!`);
      } else {
        throw new Error(data.error || 'Failed to complete agent research');
      }
    } catch (err) {
      console.error('Deep research error:', err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Research Notice:** Encountered an issue connecting to live research agents (${err.message}). Default sector benchmarks and comps remain active on your right canvas.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      persistChatMessages([...baseMessages, errorMsg]);
      onToast(`Research agent error: ${err.message}`);
    } finally {
      setIsAgentRunning(false);
      setIsLoading(false);
    }
  };

  const handleRunDeepResearch = async () => {
    await executeDeepResearch(
      activeCompany,
      { revenue, growth, margin, retention, netDebt },
      displayedMessages
    );
  };

  const handleClearSessionChat = () => {
    persistChatMessages([]);
    onToast(`Cleared conversation for "${activeCompany?.name}".`);
  };

  // Quick Starters (Dynamic: Fast-track intake templates for draft mode vs deep diligence for established targets)
  const starterPrompts = useMemo(() => {
    if (activeCompany?.isDraft || revenue === 0) {
      return [
        {
          label: '🚀 Acme Cloud AI ($25M Rev, 40% Growth)',
          query: 'The company is Acme Cloud AI, Enterprise SaaS, acmecloud.ai, $25M revenue, 40% YoY growth, 18% EBITDA margin, $2M net debt.'
        },
        {
          label: '🏥 CarePulse Health ($18M Rev, 25% Growth)',
          query: 'Target is CarePulse Health, Digital Health EHR, carepulse.com, $18M revenue, 25% growth, 15% EBITDA, zero debt.'
        },
        {
          label: '💳 FinBridge Pay ($35M Rev, 50% Growth)',
          query: 'FinBridge Pay, FinTech & B2B Payments, finbridge.io, $35M revenue, 50% growth, 22% EBITDA margin, $4M net debt.'
        },
        {
          label: '🛡️ SentinelDefense ($40M Rev, 35% Growth)',
          query: 'SentinelDefense, CyberSecurity & Zero-Trust, sentineldefense.io, $40M revenue, 35% growth, 20% EBITDA, $1M net debt.'
        }
      ];
    }
    return [
      { label: '📊 Precedent Multiples', query: `Analyze precedent M&A benchmark multiples for ${activeCompany?.name} and explain the median valuation spread.` },
      { label: '🔍 Diligence Checklist', query: `What are the top 3 financial and operational diligence red flags to audit before issuing an LOI for ${activeCompany?.name}?` },
      { label: '🏢 Strategic Consolidators', query: `Identify the top 4 strategic and financial sponsor acquirers most likely to bid for ${activeCompany?.name} and explain their acquisition rationale.` },
      { label: '⚡ Stress-Test (20% Growth)', query: `If ${activeCompany?.name} revenue growth contracts to 20% over the next 12 months, what is the impact on Enterprise Value and EBITDA multiples?` },
      { label: '📑 Draft Executive Teaser', query: `Draft a confidential 1-page executive acquisition teaser for PE sponsors highlighting ${activeCompany?.name}'s unit economics and moat.` }
    ];
  }, [activeCompany?.isDraft, activeCompany?.name, revenue]);

  const filteredCompanies = companies.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.sector || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const storedAll = getStoredWorkspaces();

  return (
    <div className="chat-workspace-shell">
      {/* Mobile Backdrop for Sidebar Drawer */}
      {isSidebarOpen && windowWidth <= 840 && (
        <div
          className="workspace-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Backdrop for Living Canvas Drawer on smaller screens */}
      {isCanvasOpen && windowWidth <= 1100 && (
        <div
          className="workspace-backdrop"
          onClick={() => setIsCanvasOpen(false)}
          aria-label="Close canvas"
        />
      )}

      {/* ========================================================
          COLUMN 1: TARGET SESSIONS SIDEBAR
          ======================================================== */}
      <aside className={`chat-workspace-sidebar ${isSidebarOpen ? 'is-open' : 'is-collapsed'}`}>
        {/* Sidebar Header Bar */}
        <div className="sidebar-top-bar">
          <div className="sidebar-brand-group">
            <Building2 size={15} style={{ color: 'hsl(var(--emerald))' }} />
            <span className="sidebar-brand-title">Diligence Targets</span>
            <span className="badge badge-secondary badge-xs">
              {filteredCompanies.length}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={handleCreateNewSession}
              title="Add New Target (Conversational Intake)"
            >
              <Plus size={12} />
              <span>New</span>
            </button>

            {windowWidth <= 840 && (
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-icon"
                onClick={() => setIsSidebarOpen(false)}
                title="Close Sidebar"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="sidebar-search-wrap">
          <Search size={13} className="sidebar-search-icon" />
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Search company sessions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Target Sessions List */}
        <div className="sidebar-sessions-list">
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
                onClick={() => {
                  setActiveCompanyId(comp.id);
                  if (windowWidth <= 840) setIsSidebarOpen(false);
                }}
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
                    {comp.isDraft && <span className="session-draft-pill">Intake</span>}
                    {hasReport && <span className="session-verified-dot" title="Institutional brief ready" />}
                  </div>
                  <span className="session-meta">
                    {comp.revenue || '$0M'} · {comp.sector}
                  </span>
                </div>

                {msgCount > 0 && (
                  <span className="session-msg-badge" title={`${msgCount} messages stored`}>
                    {msgCount}
                  </span>
                )}

                {(comp.isCustom || comp.isDraft) && (
                  <button
                    type="button"
                    className="session-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(comp.id);
                    }}
                    title="Delete session"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Status */}
        <div className="sidebar-footer">
          <div className="sidebar-status-note">
            <span className="status-dot-pulse" style={{ backgroundColor: '#10b981' }} />
            <span>Target Context Encrypted & Saved</span>
          </div>
        </div>
      </aside>

      {/* ========================================================
          COLUMN 2: CONVERSATIONAL DILIGENCE AGENT
          ======================================================== */}
      <main className="chat-workspace-center">
        {/* Compact, Single-Row Active Target Header Bar */}
        <header className="workspace-center-header">
          <div className="center-header-left">
            {/* Toggle Target Sidebar */}
            <button
              type="button"
              className="btn btn-outline btn-xs sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(prev => !prev)}
              title={isSidebarOpen ? "Collapse Target Sessions Sidebar" : "Expand Target Sessions Sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose size={13} /> : <PanelLeft size={13} />}
              <span className="sidebar-toggle-text">{isSidebarOpen ? 'Hide' : 'Targets'}</span>
            </button>

            <div
              className="active-target-mark"
              style={{ background: getSectorGradient(activeCompany?.sector) }}
            >
              {activeCompany?.initials || 'CO'}
            </div>

            <div className="active-target-meta-group">
              <div className="target-title-line">
                <h2 className="active-target-title">{activeCompany?.name}</h2>
                <span className="badge badge-secondary sector-badge">
                  {activeCompany?.sector}
                </span>
                {reportMarkdown && (
                  <span className="badge badge-success dossier-badge">
                    <CheckCircle2 size={10} /> Dossier Ready
                  </span>
                )}
              </div>

              <div className="target-kpi-strip">
                <span className="kpi-tag"><strong>${revenue}M</strong> Rev</span>
                <span className="kpi-tag"><strong>{growth}%</strong> YoY</span>
                <span className="kpi-tag"><strong>{margin}%</strong> EBITDA</span>
                <span className="kpi-tag"><strong>{retention}%</strong> NRR</span>
                <span className="kpi-tag debt-tag">Debt: <strong>${netDebt}M</strong></span>
              </div>
            </div>
          </div>

          <div className="center-header-right">
            <button
              type="button"
              className="btn btn-primary btn-xs header-action-btn"
              onClick={handleRunDeepResearch}
              disabled={isAgentRunning}
              title="Dispatch multi-agent research and update dossier canvas"
            >
              <Sparkles size={12} className={isAgentRunning ? 'spin-slow' : ''} />
              <span className="btn-label-text">
                {isAgentRunning ? 'Researching...' : reportMarkdown ? 'Re-run Agent' : 'Deep Research'}
              </span>
            </button>

            <button
              type="button"
              className={`btn btn-xs header-action-btn ${isCanvasOpen ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setIsCanvasOpen(prev => !prev)}
              title={isCanvasOpen ? 'Close Living Canvas' : 'Open Living Canvas'}
            >
              <Layers size={12} />
              <span className="btn-label-text">{isCanvasOpen ? 'Canvas' : 'Canvas'}</span>
              <span className={`canvas-status-dot ${reportMarkdown ? 'dot-active' : ''}`} />
            </button>

            <button
              type="button"
              className="btn btn-outline btn-xs btn-icon"
              onClick={handleClearSessionChat}
              title="Reset conversation for this target"
            >
              <RotateCcw size={12} />
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
              placeholder={
                activeCompany?.isDraft || revenue === 0
                  ? `Tell the AI about ${activeCompany?.name || 'the target'} (e.g. name, sector, revenue, growth, EBITDA, debt)...`
                  : `Ask the agent anything about ${activeCompany?.name || 'the target'}, adjust assumptions, or request M&A materials... (Enter to send)`
              }
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
      <aside className={`chat-workspace-canvas ${isCanvasOpen ? 'is-open' : 'is-collapsed'}`}>
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
                {/* Onboarding Checklist for Target Intake */}
                {(activeCompany?.isDraft || revenue === 0) && (
                  <div className="card-sub-block onboarding-checklist-card">
                    <div className="sub-block-title-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sparkles size={13} style={{ color: 'hsl(var(--emerald))' }} />
                        <span className="sub-block-title">Target Intake Checklist</span>
                      </div>
                      <span className="badge badge-secondary badge-xs">
                        {[
                          Boolean(activeCompany?.name && !activeCompany.name.startsWith('New Target')),
                          Boolean(activeCompany?.sector && activeCompany.sector !== 'Sector Pending' && activeCompany.sector !== 'Discovery Phase'),
                          revenue > 0,
                          growth > 0,
                          margin > 0,
                          netDebt !== undefined
                        ].filter(Boolean).length} of 6 Parameters Ready
                      </span>
                    </div>

                    <div className="onboarding-progress-bar-wrap">
                      <div
                        className="onboarding-progress-bar-fill"
                        style={{
                          width: `${([
                            Boolean(activeCompany?.name && !activeCompany.name.startsWith('New Target')),
                            Boolean(activeCompany?.sector && activeCompany.sector !== 'Sector Pending' && activeCompany.sector !== 'Discovery Phase'),
                            revenue > 0,
                            growth > 0,
                            margin > 0,
                            netDebt !== undefined
                          ].filter(Boolean).length / 6) * 100}%`
                        }}
                      />
                    </div>

                    <div className="onboarding-items-grid">
                      <div className={`onboarding-item ${activeCompany?.name && !activeCompany.name.startsWith('New Target') ? 'is-complete' : 'is-pending'}`}>
                        {activeCompany?.name && !activeCompany.name.startsWith('New Target') ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Clock size={13} className="text-muted" />}
                        <div className="onboarding-item-text">
                          <span className="onboarding-label">Company Name</span>
                          <span className="onboarding-value">{activeCompany?.name && !activeCompany.name.startsWith('New Target') ? activeCompany.name : 'Pending in chat...'}</span>
                        </div>
                      </div>

                      <div className={`onboarding-item ${activeCompany?.sector && activeCompany.sector !== 'Sector Pending' && activeCompany.sector !== 'Discovery Phase' ? 'is-complete' : 'is-pending'}`}>
                        {activeCompany?.sector && activeCompany.sector !== 'Sector Pending' && activeCompany.sector !== 'Discovery Phase' ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Clock size={13} className="text-muted" />}
                        <div className="onboarding-item-text">
                          <span className="onboarding-label">Sector / Vertical</span>
                          <span className="onboarding-value">{activeCompany?.sector && activeCompany.sector !== 'Sector Pending' && activeCompany.sector !== 'Discovery Phase' ? activeCompany.sector : 'Pending in chat...'}</span>
                        </div>
                      </div>

                      <div className={`onboarding-item ${revenue > 0 ? 'is-complete' : 'is-pending'}`}>
                        {revenue > 0 ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Clock size={13} className="text-muted" />}
                        <div className="onboarding-item-text">
                          <span className="onboarding-label">LTM Revenue</span>
                          <span className="onboarding-value">{revenue > 0 ? `$${revenue}M` : 'Pending in chat...'}</span>
                        </div>
                      </div>

                      <div className={`onboarding-item ${growth > 0 ? 'is-complete' : 'is-pending'}`}>
                        {growth > 0 ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Clock size={13} className="text-muted" />}
                        <div className="onboarding-item-text">
                          <span className="onboarding-label">YoY Growth</span>
                          <span className="onboarding-value">{growth > 0 ? `${growth}%` : 'Pending in chat...'}</span>
                        </div>
                      </div>

                      <div className={`onboarding-item ${margin > 0 ? 'is-complete' : 'is-pending'}`}>
                        {margin > 0 ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Clock size={13} className="text-muted" />}
                        <div className="onboarding-item-text">
                          <span className="onboarding-label">EBITDA Margin</span>
                          <span className="onboarding-value">{margin > 0 ? `${margin}%` : 'Pending in chat...'}</span>
                        </div>
                      </div>

                      <div className={`onboarding-item ${netDebt !== undefined ? 'is-complete' : 'is-pending'}`}>
                        {netDebt !== undefined ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Clock size={13} className="text-muted" />}
                        <div className="onboarding-item-text">
                          <span className="onboarding-label">Net Debt</span>
                          <span className="onboarding-value">{netDebt !== undefined ? `$${netDebt}M` : 'Pending in chat...'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="onboarding-hint-box">
                      <Bot size={13} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
                      <span>
                        Provide target parameters directly in the chat, or click one of the quick starter templates below the chat box!
                      </span>
                    </div>
                  </div>
                )}

                {/* 1. Executive Valuation Overview Hero Banner */}
                <div className="corridor-overview-banner">
                  <div className="corridor-banner-main">
                    <div className="corridor-banner-header">
                      <div className="corridor-eyebrow-group">
                        <span className="corridor-banner-eyebrow">Enterprise Value Range</span>
                        <span className="corridor-banner-hint">Precedent Comps</span>
                      </div>
                      {revenue > 0 ? (
                        <div className="corridor-equity-pill">
                          <span className="equity-pill-dot" />
                          <span className="equity-pill-label">Indicative Equity</span>
                          <strong className="equity-pill-val">{money(medianEquity)}</strong>
                        </div>
                      ) : (
                        <span className="badge badge-secondary badge-xs">Intake Phase</span>
                      )}
                    </div>

                    <div className="corridor-banner-metric-row">
                      <h3 className="corridor-banner-val">
                        {revenue > 0 ? (
                          <>
                            <span className="corridor-range-txt">{money(lowEV)} – {money(highEV)}</span>
                            <span className="corridor-median-tag">
                              Median: <strong>{money(medianEV)}</strong>
                            </span>
                          </>
                        ) : (
                          'Pending Metrics'
                        )}
                      </h3>
                    </div>

                    <p className="corridor-banner-sub">
                      {revenue > 0 ? (
                        <>Central reference implies <strong>{multiples.median.toFixed(1)}x EV/Revenue</strong> on ${revenue}M LTM revenue.</>
                      ) : (
                        <>Provide target revenue and margins in the chat to calculate enterprise value.</>
                      )}
                    </p>
                  </div>
                </div>

                {/* 2. Precedent Multiple Spread */}
                <div className="card-sub-block">
                  <div className="sub-block-title-row">
                    <div>
                      <span className="sub-block-title">Precedent Multiple Spread</span>
                      <span className="sub-block-sub">EV / LTM Revenue Multiples</span>
                    </div>
                    <span className="badge badge-secondary badge-xs">M&A Comps</span>
                  </div>

                  {/* 3 Value Columns */}
                  <div className="spread-values-grid">
                    <div className="spread-val-col val-low">
                      <span className="spread-label">Low (25th Pct)</span>
                      <span className="spread-multiple-pill">{multiples.low.toFixed(1)}x</span>
                      <strong className="spread-num">{money(lowEV)}</strong>
                    </div>
                    <div className="spread-val-col val-median highlight">
                      <div className="spread-median-tag">Benchmark</div>
                      <span className="spread-label">Median</span>
                      <span className="spread-multiple-pill highlight">{multiples.median.toFixed(1)}x</span>
                      <strong className="spread-num text-emerald-500">{money(medianEV)}</strong>
                    </div>
                    <div className="spread-val-col val-high">
                      <span className="spread-label">High (75th Pct)</span>
                      <span className="spread-multiple-pill">{multiples.high.toFixed(1)}x</span>
                      <strong className="spread-num">{money(highEV)}</strong>
                    </div>
                  </div>

                  {/* Visual Range Track (Football Field Corridor) */}
                  <div className="spread-track-wrap">
                    <div className="spread-track-bar">
                      <div className="spread-active-band" style={{ left: '16%', right: '16%' }} />
                      <div className="spread-pin pin-low" style={{ left: '16%' }} title={`Low: ${money(lowEV)} (${multiples.low.toFixed(1)}x)`} />
                      <div className="spread-pin pin-median" style={{ left: '50%' }} title={`Median: ${money(medianEV)} (${multiples.median.toFixed(1)}x)`} />
                      <div className="spread-pin pin-high" style={{ left: '84%' }} title={`High: ${money(highEV)} (${multiples.high.toFixed(1)}x)`} />
                    </div>
                    <div className="spread-axis-row">
                      <span>Low {money(lowEV)}</span>
                      <span className="axis-median">Median {money(medianEV)}</span>
                      <span>High {money(highEV)}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Enterprise to Equity Value Bridge */}
                <div className="card-sub-block bridge-block">
                  <div className="sub-block-title-row">
                    <div>
                      <span className="sub-block-title">Enterprise to Equity Value Bridge</span>
                      <span className="sub-block-sub">Capital Structure Adjustment</span>
                    </div>
                    <span className="badge badge-secondary badge-xs">Median Reference</span>
                  </div>

                  {/* Clean Institutional Waterfall Bridge */}
                  <div className="institutional-bridge-waterfall">
                    <div className="waterfall-item-row step-ev">
                      <div className="waterfall-lead">
                        <span className="waterfall-badge-op op-add">+</span>
                        <div className="waterfall-text">
                          <span className="waterfall-title">Enterprise Value</span>
                          <span className="waterfall-meta">{multiples.median.toFixed(1)}x EV/Rev on ${revenue}M LTM</span>
                        </div>
                      </div>
                      <span className="waterfall-val">{money(medianEV)}</span>
                    </div>

                    <div className="waterfall-item-row step-debt">
                      <div className="waterfall-lead">
                        <span className="waterfall-badge-op op-sub">−</span>
                        <div className="waterfall-text">
                          <span className="waterfall-title">Less: Net Funded Debt</span>
                          <span className="waterfall-meta">{netDebt > 0 ? `Funded debt deduction` : `Zero net funded debt`}</span>
                        </div>
                      </div>
                      <span className={`waterfall-val ${netDebt > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {netDebt > 0 ? `− ${money(netDebt)}` : `$0M`}
                      </span>
                    </div>

                    <div className="waterfall-divider" />

                    <div className="waterfall-item-row step-equity highlight">
                      <div className="waterfall-lead">
                        <span className="waterfall-badge-op op-eq">=</span>
                        <div className="waterfall-text">
                          <strong className="waterfall-title-equity">Indicative Equity Value</strong>
                          <span className="waterfall-meta">Net to Shareholders</span>
                        </div>
                      </div>
                      <strong className="waterfall-val-equity text-emerald-500">{money(medianEquity)}</strong>
                    </div>
                  </div>

                  {/* Clean Math Equation Ribbon */}
                  <div className="bridge-equation-ribbon">
                    <div className="equation-part">
                      <span className="equation-lbl">EV</span>
                      <strong className="equation-val">{money(medianEV)}</strong>
                    </div>
                    <span className="equation-sym">−</span>
                    <div className="equation-part">
                      <span className="equation-lbl">Debt</span>
                      <strong className={`equation-val ${netDebt > 0 ? 'text-destructive' : ''}`}>{money(netDebt)}</strong>
                    </div>
                    <span className="equation-sym">=</span>
                    <div className="equation-part is-result">
                      <span className="equation-lbl">Equity</span>
                      <strong className="equation-val text-emerald-500">{money(medianEquity)}</strong>
                    </div>
                  </div>
                </div>

                {/* 4. Valuation Scenarios Summary */}
                <div className="card-sub-block">
                  <div className="sub-block-title-row">
                    <div>
                      <span className="sub-block-title">Benchmark Scenario Corridor</span>
                      <span className="sub-block-sub">3 Comparative Sensitivities</span>
                    </div>
                    <span className="badge badge-secondary badge-xs">Corridor</span>
                  </div>
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
                    <label htmlFor="input-assumption-revenue">LTM Revenue ($M)</label>
                  </div>
                  <div className="assumption-controls-row">
                    <input
                      type="range"
                      min="0"
                      max="300"
                      step="0.1"
                      value={revenue}
                      onChange={e => handleUpdateFinancials({ revenue: Number(parseFloat(e.target.value).toFixed(1)) })}
                      className="assumption-slider"
                      aria-label="LTM Revenue slider"
                    />
                    <div className="assumption-typed-wrap">
                      <span className="typed-symbol">$</span>
                      <input
                        id="input-assumption-revenue"
                        type="number"
                        min="0"
                        max="10000"
                        step="any"
                        value={revenue}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          handleUpdateFinancials({ revenue: isNaN(val) ? 0 : Math.max(0, val) });
                        }}
                        className="assumption-typed-input"
                        aria-label="LTM Revenue in Millions"
                      />
                      <span className="typed-symbol">M</span>
                    </div>
                  </div>
                </div>

                <div className="assumption-input-group">
                  <div className="assumption-header">
                    <label htmlFor="input-assumption-growth">YoY Revenue Growth (%)</label>
                  </div>
                  <div className="assumption-controls-row">
                    <input
                      type="range"
                      min="0"
                      max="150"
                      step="0.1"
                      value={growth}
                      onChange={e => handleUpdateFinancials({ growth: Number(parseFloat(e.target.value).toFixed(1)) })}
                      className="assumption-slider"
                      aria-label="YoY Revenue Growth slider"
                    />
                    <div className="assumption-typed-wrap">
                      <input
                        id="input-assumption-growth"
                        type="number"
                        min="0"
                        max="500"
                        step="any"
                        value={growth}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          handleUpdateFinancials({ growth: isNaN(val) ? 0 : Math.max(0, val) });
                        }}
                        className="assumption-typed-input"
                        aria-label="YoY Revenue Growth percentage"
                      />
                      <span className="typed-symbol">%</span>
                    </div>
                  </div>
                </div>

                <div className="assumption-input-group">
                  <div className="assumption-header">
                    <label htmlFor="input-assumption-margin">EBITDA Margin (%)</label>
                  </div>
                  <div className="assumption-controls-row">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.1"
                      value={margin}
                      onChange={e => handleUpdateFinancials({ margin: Number(parseFloat(e.target.value).toFixed(1)) })}
                      className="assumption-slider"
                      aria-label="EBITDA Margin slider"
                    />
                    <div className="assumption-typed-wrap">
                      <input
                        id="input-assumption-margin"
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={margin}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          handleUpdateFinancials({ margin: isNaN(val) ? 0 : Math.max(0, val) });
                        }}
                        className="assumption-typed-input"
                        aria-label="EBITDA Margin percentage"
                      />
                      <span className="typed-symbol">%</span>
                    </div>
                  </div>
                </div>

                <div className="assumption-input-group">
                  <div className="assumption-header">
                    <label htmlFor="input-assumption-retention">Net Revenue Retention (NRR %)</label>
                  </div>
                  <div className="assumption-controls-row">
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="0.1"
                      value={retention}
                      onChange={e => handleUpdateFinancials({ retention: Number(parseFloat(e.target.value).toFixed(1)) })}
                      className="assumption-slider"
                      aria-label="Net Revenue Retention slider"
                    />
                    <div className="assumption-typed-wrap">
                      <input
                        id="input-assumption-retention"
                        type="number"
                        min="0"
                        max="300"
                        step="any"
                        value={retention}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          handleUpdateFinancials({ retention: isNaN(val) ? 0 : Math.max(0, val) });
                        }}
                        className="assumption-typed-input"
                        aria-label="Net Revenue Retention percentage"
                      />
                      <span className="typed-symbol">%</span>
                    </div>
                  </div>
                </div>

                <div className="assumption-input-group">
                  <div className="assumption-header">
                    <label htmlFor="input-assumption-debt">Net Debt ($M)</label>
                  </div>
                  <div className="assumption-controls-row">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.1"
                      value={netDebt}
                      onChange={e => handleUpdateFinancials({ netDebt: Number(parseFloat(e.target.value).toFixed(1)) })}
                      className="assumption-slider"
                      aria-label="Net Debt slider"
                    />
                    <div className="assumption-typed-wrap">
                      <span className="typed-symbol">$</span>
                      <input
                        id="input-assumption-debt"
                        type="number"
                        min="0"
                        max="5000"
                        step="any"
                        value={netDebt}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          handleUpdateFinancials({ netDebt: isNaN(val) ? 0 : Math.max(0, val) });
                        }}
                        className="assumption-typed-input"
                        aria-label="Net Debt in Millions"
                      />
                      <span className="typed-symbol">M</span>
                    </div>
                  </div>
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
    </div>
  );
}

// Helpers
function parseAmountM(val) {
  if (val === 0 || val === '0' || val === '$0M') return 0;
  const text = String(val ?? '').trim().toUpperCase();
  const num = Number.parseFloat(text.replace(/[^0-9.\-]/g, ''));
  if (!Number.isFinite(num)) return 0;
  if (text.includes('B')) return num * 1000;
  if (text.includes('K')) return num / 1000;
  return num;
}

function parsePercent(val) {
  if (val === 0 || val === '0' || val === '0%') return 0;
  const num = Number.parseFloat(String(val ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(num) ? num : 0;
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

// Financial and M&A Stop-Words (Never accept these as company names)
const FINANCIAL_STOPWORDS = new Set([
  'ltm', 'ttm', 'arr', 'mrr', 'fy', 'fy23', 'fy24', 'fy25', 'fy26', 'cagr',
  'ebitda', 'nrr', 'ndr', 'gmv', 'cac', 'ltv', 'acv', 'qoe', 'ev', 'pe',
  'revenue', 'rev', 'sales', 'growth', 'margin', 'debt', 'netdebt', 'cash',
  'multiple', 'valuation', 'corridor', 'bridge', 'equity', 'intake',
  'target', 'company', 'asset', 'sector', 'industry', 'category', 'vertical',
  'new', 'the', 'a', 'an', 'this', 'that', 'our', 'my', 'their',
  'hi', 'hello', 'hey', 'please', 'thanks', 'thank you', 'yes', 'no', 'ok',
  'research', 'report', 'brief', 'dossier', 'model', 'sensitivity', 'assumptions',
  'what', 'how', 'why', 'can', 'could', 'is', 'are', 'was', 'were'
]);

/**
 * Intelligent financial number parser:
 * Accurately parses values entered in human notation (e.g. 70000, $70,000, 70M, 70k, 1.2B)
 * and scales them properly into Millions ($M) without falsely expanding 70000 into 70000M.
 */
export function parseSmartFinancialNumber(numStr, unitStr = '') {
  if (numStr === null || numStr === undefined || numStr === '') return null;
  const cleaned = numStr.toString().replace(/,/g, '').replace(/[\$\s]/g, '').trim();
  const val = parseFloat(cleaned);
  if (isNaN(val)) return null;

  const unit = (unitStr || '').toLowerCase().trim();

  // Billion notation: 1.5B -> 1500 ($M)
  if (unit.startsWith('b') || unit === 'billion' || unit === 'bn') {
    return Number((val * 1000).toFixed(1));
  }

  // Explicit Million notation: 25M -> 25 ($M)
  if (unit.startsWith('m') || unit === 'million' || unit === 'mm') {
    return Number(val.toFixed(1));
  }

  // Explicit Thousand notation: 70k -> 0.07 ($M)
  if (unit.startsWith('k') || unit === 'thousand' || unit === 'th') {
    const inM = val / 1000;
    return Number(inM >= 1 ? inM.toFixed(1) : inM.toFixed(2));
  }

  // No explicit unit provided:
  // e.g. 70,000,000 (70 million dollars) -> 70 ($M)
  if (val >= 1000000) {
    const inM = val / 1000000;
    return Number(inM >= 1 ? inM.toFixed(1) : inM.toFixed(2));
  }

  // e.g. 70,000 or 70000 (70 thousand dollars) -> 0.07 ($M)
  if (val >= 1000) {
    const inM = val / 1000000;
    return Number(inM.toFixed(2));
  }

  // Value < 1000 (e.g. 25, 14.5, 5, 0): already expressed in Millions
  return Number(val.toFixed(1));
}

function isInvalidCompanyName(cand = '') {
  if (!cand) return true;
  const trimmed = cand.trim().toLowerCase();
  if (trimmed.length < 2) return true;
  // Cannot be pure numbers or punctuation
  if (/^[0-9$,.%\s\-]+$/.test(trimmed)) return true;
  // Cannot be generic placeholder phrases
  if (/^(new target|target company|the company|my company|our target|sample company)$/i.test(trimmed)) return true;

  const words = trimmed.split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(Boolean);
  if (words.length === 0) return true;

  // If candidate itself or first word is in financial stop words
  if (FINANCIAL_STOPWORDS.has(trimmed) || FINANCIAL_STOPWORDS.has(words[0])) return true;

  // If candidate contains any critical financial/deal terms as any of its words
  const criticalFinancialTerms = new Set([
    'ltm', 'ttm', 'arr', 'mrr', 'ebitda', 'revenue', 'rev', 'sales', 'growth',
    'margin', 'debt', 'netdebt', 'valuation', 'multiple', 'corridor', 'target', 'company'
  ]);
  for (const w of words) {
    if (criticalFinancialTerms.has(w)) return true;
  }

  return false;
}

// Conversational Target Entity Extractor
export function extractTargetEntities(text, currentCompany = {}, isDraft = false) {
  const extracted = {};
  const cleaned = text.trim();

  // 1. Website / domain: e.g. stripe.com, https://acme.ai, www.nexus.io
  const urlMatch = cleaned.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]+\.(?:com|io|ai|co|org|net|app|tech|dev|cloud|health|finance))\b/i);
  if (urlMatch) {
    extracted.website = urlMatch[1].toLowerCase();
  }

  // Reusable token for numbers with optional commas and decimals
  const numToken = `([0-9]{1,3}(?:,[0-9]{3})+(?:\\.[0-9]+)?|[0-9]+(?:\\.[0-9]+)?)`;
  const unitToken = `(?:\\s*(m|million|mm|b|billion|bn|k|thousand))?`;

  // 2. Revenue / ARR (LTM):
  // e.g. "revenue is $25M", "LTM revenue $70,000", "rev: 25m", "ARR of $30M", "70000 revenue"
  const revPatterns = [
    new RegExp(`(?:ltm\\s+revenue|ltm\\s+rev|ltm|arr|revenue|rev|sales|topline|top-line)\\s*(?:is|of|:|around|=|approx|approx\\.|\\s)\\s*\\$?${numToken}${unitToken}\\b`, 'i'),
    new RegExp(`\\$${numToken}${unitToken}\\s*(?:in\\s*)?(?:revenue|rev|arr|sales|ltm)\\b`, 'i'),
    new RegExp(`(?:revenue|rev|arr|ltm)\\s*=\\s*\\$?${numToken}${unitToken}\\b`, 'i')
  ];
  for (const pat of revPatterns) {
    const m = cleaned.match(pat);
    if (m) {
      const parsedRev = parseSmartFinancialNumber(m[1], m[2]);
      if (parsedRev !== null) {
        extracted.revenue = parsedRev;
        break;
      }
    }
  }

  // 3. Growth:
  // e.g. "growth is 35%", "growing at 40%", "growth: 30%", "35% yoy", "35% growth"
  const growthPatterns = [
    new RegExp(`(?:growth|growth rate|yoy growth|yoy|growing at)\\s*(?:is|of|:|around|=|approx|approx\\.|\\s)\\s*${numToken}\\s*%?`, 'i'),
    new RegExp(`${numToken}\\s*%\\s*(?:yoy|growth|yoy growth)\\b`, 'i'),
    new RegExp(`(?:growth|yoy)\\s*=\\s*${numToken}\\s*%?`, 'i')
  ];
  for (const pat of growthPatterns) {
    const m = cleaned.match(pat);
    if (m) {
      const num = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(num)) {
        extracted.growth = Number(num.toFixed(1));
        break;
      }
    }
  }

  // 4. EBITDA Margin:
  // e.g. "ebitda is 20%", "margin is 18%", "ebitda margin: 25%", "20% ebitda", "15% margin"
  const marginPatterns = [
    new RegExp(`(?:ebitda margin|ebitda|margin|profit margin|operating margin)\\s*(?:is|of|:|around|=|approx|approx\\.|\\s)\\s*${numToken}\\s*%?`, 'i'),
    new RegExp(`${numToken}\\s*%\\s*(?:ebitda|ebitda margin|margin)\\b`, 'i'),
    new RegExp(`(?:ebitda|margin)\\s*=\\s*${numToken}\\s*%?`, 'i')
  ];
  for (const pat of marginPatterns) {
    const m = cleaned.match(pat);
    if (m) {
      const num = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(num)) {
        extracted.margin = Number(num.toFixed(1));
        break;
      }
    }
  }

  // 5. Net Debt:
  // e.g. "net debt is $5M", "debt: 50000", "$3M net debt", "debt-free", "zero debt", "no debt"
  if (/(?:debt-free|zero debt|no debt|\$0 debt|\$0 net debt|no net debt|0 debt)/i.test(cleaned)) {
    extracted.netDebt = 0;
  } else {
    const debtPatterns = [
      new RegExp(`(?:net debt|debt|net-debt|borrowings)\\s*(?:is|of|:|around|=|approx|approx\\.|\\s)\\s*\\$?${numToken}${unitToken}\\b`, 'i'),
      new RegExp(`\\$${numToken}${unitToken}\\s*(?:in\\s*)?(?:net debt|debt)\\b`, 'i'),
      new RegExp(`(?:net debt|debt)\\s*=\\s*\\$?${numToken}${unitToken}\\b`, 'i')
    ];
    for (const pat of debtPatterns) {
      const m = cleaned.match(pat);
      if (m) {
        const parsedDebt = parseSmartFinancialNumber(m[1], m[2]);
        if (parsedDebt !== null) {
          extracted.netDebt = parsedDebt;
          break;
        }
      }
    }
  }

  // 6. Retention / NRR:
  const nrrPatterns = [
    new RegExp(`(?:nrr|ndr|retention|net retention)\\s*(?:is|of|:|around|=|approx|approx\\.|\\s)\\s*${numToken}\\s*%?`, 'i'),
    new RegExp(`(${numToken})\\s*%\\s*(?:nrr|ndr|retention)\\b`, 'i')
  ];
  for (const pat of nrrPatterns) {
    const m = cleaned.match(pat);
    if (m) {
      const num = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(num)) {
        extracted.retention = Number(num.toFixed(1));
        break;
      }
    }
  }

  // 7. Sector / Industry keywords:
  const sectorKeywords = [
    { key: 'Enterprise B2B SaaS & AI', match: /\b(enterprise saas|b2b saas|saas|software|cloud platform|b2b software)\b/i },
    { key: 'FinTech & B2B Payments', match: /\b(fintech|payments|treasury|banking|financial tech|billing|payroll)\b/i },
    { key: 'Digital Health & HealthTech', match: /\b(healthtech|healthcare|health saas|clinical|telehealth|medtech|ehr)\b/i },
    { key: 'CyberSecurity & Zero-Trust', match: /\b(cyber|cybersecurity|security|zero-trust|infosec|soc2|compliance)\b/i },
    { key: 'DevOps & Cloud Infrastructure', match: /\b(devops|infrastructure|observability|kubernetes|cloud infra|developer tools)\b/i },
    { key: 'E-Commerce & Supply Chain', match: /\b(e-commerce|ecommerce|supply chain|logistics|retail tech|dtc)\b/i },
    { key: 'AI / ML & Intelligent Systems', match: /\b(ai|artificial intelligence|machine learning|genai|llm|computer vision)\b/i }
  ];
  const sectorLabelMatch = cleaned.match(/(?:sector|industry|category|vertical|space)\s*(?::|is|\s)\s*([A-Za-z0-9][A-Za-z0-9\s&/\-]{2,40}?)(?:,|\.|\n|website|revenue|rev|growth|margin|ebitda|debt|\$|$)/i);
  if (sectorLabelMatch && sectorLabelMatch[1]?.trim()) {
    extracted.sector = sectorLabelMatch[1].trim();
  } else {
    for (const sk of sectorKeywords) {
      if (sk.match.test(cleaned)) {
        extracted.sector = sk.key;
        break;
      }
    }
  }

  // 8. Company Name (Guaranteed anti-LTM, anti-financial stopword verification):
  // Pattern A: Explicit naming with colon or "is/named"
  const explicitNameMatch = cleaned.match(/(?:company\s*name|target\s*name|company|target|name)\s*(?::|is called|is|named)\s*["']?([A-Za-z0-9][A-Za-z0-9\s&.\-']{1,35}?)["']?(?:,|\.|\n|;|\s+(?:with|operating|in|at|having|revenue|rev|arr|sector|ltm)|$)/i);
  if (explicitNameMatch && !isInvalidCompanyName(explicitNameMatch[1])) {
    extracted.name = explicitNameMatch[1].trim();
  } else {
    // Pattern B: "Add [Target/Company Name]" or "New target [Company Name]"
    const addMatch = cleaned.match(/^(?:add|create|new|onboard)\s+(?:target|company)?\s*["']?([A-Za-z0-9][A-Za-z0-9\s&.\-']{1,35}?)["']?(?:,|\.|\n|;|\s+(?:with|revenue|rev|arr|in|sector|ltm)|$)/i);
    if (addMatch && !isInvalidCompanyName(addMatch[1])) {
      extracted.name = addMatch[1].trim();
    } else if (isDraft || currentCompany.isDraft || currentCompany.name?.startsWith('New Target')) {
      // Pattern C: If in draft onboarding, check first line or segment if it's a valid entity name
      const firstSegment = cleaned.split(/[,;\n]/)[0].trim();
      const stripped = firstSegment.replace(/^(?:it's called|it is called|it's|it is|add|target:?|company:?)\s+/i, '').trim();
      if (!isInvalidCompanyName(stripped) && stripped.length > 1 && stripped.length < 35 && !stripped.includes('$') && !stripped.includes('%')) {
        extracted.name = stripped;
      } else if (extracted.website) {
        // Derive clean company name from website domain (e.g. carepulse.health -> CarePulse)
        const domainBase = extracted.website.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
        if (domainBase && !isInvalidCompanyName(domainBase)) {
          extracted.name = domainBase.charAt(0).toUpperCase() + domainBase.slice(1);
        }
      }
    }
  }

  // Pattern D: Leading company name before financial qualifiers (e.g. "Stripe with revenue $70M", "Datadog: 70000 rev", "Snowflake has $1.2B revenue")
  if (!extracted.name) {
    const leadMatch = cleaned.match(/^([A-Za-z0-9][A-Za-z0-9\s&.\-']{1,35}?)(?:\s*[:]\s*|\s+(?:with|has|having|reports|reported|revenue|rev|arr|sales|ebitda|growth)\b)/i);
    if (leadMatch && !isInvalidCompanyName(leadMatch[1])) {
      extracted.name = leadMatch[1].trim();
    }
  }

  return extracted;
}

// Conversational Intake Formulator (Returns crisp, institutional advisory response)
export function generateConversationalIntakeReply({ entities, company, revenue, growth, margin, netDebt, comparableDeals }) {
  const hasName = Boolean(company.name && !company.name.startsWith('New Target'));
  const hasSector = Boolean(company.sector && company.sector !== 'Sector Pending' && company.sector !== 'Discovery Phase');
  const hasRev = revenue > 0;
  const hasGrowth = growth > 0;
  const hasMargin = margin > 0;
  const hasDebt = netDebt !== undefined;

  const comps = (comparableDeals && comparableDeals.length > 0) ? comparableDeals : getDefaultComps(company.sector);
  const list = comps.map(d => d.multiple).filter(Boolean).sort((a, b) => a - b);
  const medianMult = list.length ? list[Math.floor(list.length / 2)] : 4.5;
  const lowMult = list.length ? list[0] : 3.5;
  const highMult = list.length ? list[list.length - 1] : 5.5;

  const lowEV = (revenue * lowMult).toFixed(1);
  const medEV = (revenue * medianMult).toFixed(1);
  const highEV = (revenue * highMult).toFixed(1);
  const equityVal = (Number(medEV) - netDebt).toFixed(1);

  // If both Name and Revenue are ready:
  if (hasName && hasRev) {
    return `### ✅ Valuation Model Calibrated for **${company.name}**

I have registered the target parameters and updated your **Living Deal Canvas** on the right:
* **Target:** **${company.name}** ${company.website ? `(\`${company.website}\`)` : ''}
* **Sector:** ${company.sector || 'Enterprise Software'}
* **LTM Revenue:** $${revenue}M
* **YoY Growth:** ${growth}%
* **EBITDA Margin:** ${margin}%
* **Net Debt:** $${netDebt}M

---

### 📊 Indicative Valuation Corridor (Benchmark: ${medianMult.toFixed(1)}x EV/Revenue)
* **Enterprise Value Corridor:** **$${lowEV}M – $${highEV}M**
* **Median Reference EV:** **$${medEV}M**
* **Less: Net Debt Deduction:** **−$${netDebt}M**
* **Indicative Equity Value (Net to Equityholders):** **$${equityVal}M**

The precedent comps, waterfall bridge, and sensitivity sliders on the right canvas are now live and interactive.

**Next Recommended Steps:**
1. Click **Deep Research** in the top bar to synthesize an autonomous 8-section institutional brief.
2. Ask me to audit **diligence red flags**, identify **strategic consolidators**, or **stress-test growth scenarios**!`;
  }

  // If Name is provided but Revenue is still missing:
  if (hasName && !hasRev) {
    return `### 👍 Target Registered: **${company.name}**
* **Sector:** ${company.sector || 'Pending discovery'}
${company.website ? `* **Website:** \`${company.website}\`\n` : ''}
I've initialized the diligence workspace for **${company.name}** in the sidebar.

To calculate the indicative valuation corridor and benchmark precedent M&A comps, what are the target's financial metrics?
* **LTM Revenue / ARR** (e.g., *$25M*)
* **YoY Revenue Growth %** (e.g., *35%*)
* **EBITDA Margin %** (e.g., *18%*)
* **Net Debt** (e.g., *$2M*, or *$0* if debt-free)

*(Tip: You can reply: "Revenue $25M, 35% growth, 18% margin, $2M debt")*`;
  }

  // If Financials are provided but Name is still missing:
  if (!hasName && hasRev) {
    return `### 📈 Financial Metrics Recorded:
* **LTM Revenue:** $${revenue}M
* **YoY Growth:** ${growth}%
* **EBITDA Margin:** ${margin}%
* **Net Debt:** $${netDebt}M

What is the **company name** and **sector / website** for this target so I can label the dossier and calibrate sector comps?`;
  }

  // Fallback initial greeting:
  return `### 🎯 Diligence Target Intake
Let's calibrate the valuation model for this session:
* **Company Name:** ${hasName ? company.name : '*(Awaiting input)*'}
* **Sector / Industry:** ${hasSector ? company.sector : '*(Awaiting input)*'}
* **LTM Revenue:** ${hasRev ? `$${revenue}M` : '*(Awaiting input)*'}

What is the target company's name and industry?`;
}
