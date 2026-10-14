'use client';

import { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2, Moon, Sparkles, Sun, X, Building2, KeyRound,
  BookOpen, Zap, LayoutTemplate, ChevronDown, SlidersHorizontal
} from 'lucide-react';
import MarketBriefView from './market-brief-view';
import ApiKeyModal from './api-key-modal';
import CustomCompanyModal from './custom-company-modal';
import KnowledgeBaseModal from './knowledge-base-modal';
import SkillsModal from './skills-modal';
import ReportLayoutsModal from './report-layouts-modal';
import { clearCompanyWorkspace } from './workspace-store';

// Initial pre-loaded industry presets
const defaultCompanies = [
  {
    id: 'sample-health',
    name: 'CareLogic Solutions',
    initials: 'CL',
    sector: 'Healthcare IT & Clinical SaaS',
    website: 'carelogicsolutions.com',
    revenue: '$28M',
    growth: '34%',
    margin: '19%',
    retention: '114%',
    netDebt: 4,
    location: 'Austin, TX',
    notes: 'Specialized EHR workflow automation and patient intake telemetry.'
  },
  {
    id: 'sample-fintech',
    name: 'LedgerFlow Treasury',
    initials: 'LF',
    sector: 'FinTech & B2B Payments',
    website: 'ledgerflowpay.com',
    revenue: '$42M',
    growth: '28%',
    margin: '22%',
    retention: '118%',
    netDebt: 6,
    location: 'Chicago, IL',
    notes: 'Real-time corporate treasury reconciliation and multi-currency payout infrastructure.'
  },
  {
    id: 'sample-cyber',
    name: 'SentinelVault Cyber',
    initials: 'SV',
    sector: 'CyberSecurity & Zero-Trust',
    website: 'sentinelvault.io',
    revenue: '$35M',
    growth: '45%',
    margin: '15%',
    retention: '122%',
    netDebt: 2,
    location: 'Boston, MA',
    notes: 'Identity threat detection and autonomous cloud privilege management.'
  },
  {
    id: 'sample-saas',
    name: 'NexusLogic Enterprise AI',
    initials: 'NL',
    sector: 'Enterprise B2B SaaS & AI',
    website: 'nexuslogic.ai',
    revenue: '$21M',
    growth: '55%',
    margin: '12%',
    retention: '125%',
    netDebt: 3,
    location: 'San Francisco, CA',
    notes: 'Autonomous knowledge graph synthesis and operational agent infrastructure.'
  }
];

const defaultKnowledgeBase = [
  {
    id: 'kb-preset-1',
    title: 'Healthcare SaaS M&A Valuation Guidelines (2025-2026)',
    category: 'M&A Valuation Rubrics',
    type: 'note',
    content: 'Clinical workflow automation solutions with EHR integration command median EV/Revenue multiples between 4.5x and 5.8x when Net Revenue Retention exceeds 112%. Gross revenue retention below 90% triggers a 1.2x multiple discount. Telehealth infrastructure multiple contraction has stabilized at 3.0x - 3.8x.',
    wordCount: 52,
    enabled: true,
    addedAt: 'Pre-loaded'
  },
  {
    id: 'kb-preset-2',
    title: 'Private Equity Technology Diligence Checklist',
    category: 'Diligence Checklists',
    type: 'file',
    content: '1. Quality of Earnings (QoE): Distinguish between true recurring software ARR and one-off professional implementation services.\n2. Customer Concentration: Flag any single logo representing >12% of total ARR.\n3. Cloud Infrastructure Cost: Hosting costs should not exceed 18% of revenue for high-margin SaaS assets.\n4. IP Assignment: Ensure 100% assignment agreements for offshore contractor repositories.',
    wordCount: 65,
    enabled: true,
    addedAt: 'Pre-loaded'
  },
  {
    id: 'kb-preset-3',
    title: 'FinTech Corporate Treasury & Payment Rails Benchmark',
    category: 'Market Intelligence',
    type: 'note',
    content: 'Multi-currency B2B treasury platforms demonstrate average transaction take rates of 18-35 bps. Regulatory compliance moats (MSB licenses, PCI-DSS Level 1) increase strategic buyer valuation premiums by 25-40% compared to unlicensed white-label wrappers.',
    wordCount: 38,
    enabled: true,
    addedAt: 'Pre-loaded'
  }
];

const defaultSkills = [
  {
    id: 'skill-unit-econ',
    name: 'SaaS Unit Economics Audit',
    filename: 'saas-unit-economics-audit.skill',
    description: 'Rigorously audits Magic Number, CAC payback, LTV/CAC, and Rule of 40 quality.',
    instructions: '1. Calculate Rule of 40 score (YoY Growth Rate % + EBITDA Margin %). If score > 40%, assign "Elite Performer" status.\n2. Evaluate Net Revenue Retention (NRR): Above 115% indicates net expansion; below 100% indicates net contraction requiring diligence alert.\n3. Benchmark Gross Margin: Target > 70% for pure-play software.',
    enabled: true,
    isCustom: false
  },
  {
    id: 'skill-comps-calibrator',
    name: 'Precedent Deal Calibrator',
    filename: 'precedent-deal-calibrator.skill',
    description: 'Calibrates precedent M&A transaction multiples against growth and margin velocity.',
    instructions: '1. For every comp transaction, evaluate strategic buyer vs financial sponsor premium.\n2. Scale the central multiple upward if target growth rate exceeds the peer comp median by > 10%.\n3. Discount multiple by 0.5x if target net debt to EBITDA ratio exceeds 3.0x.',
    enabled: true,
    isCustom: false
  },
  {
    id: 'skill-synergy-matrix',
    name: 'Strategic Synergy Evaluator',
    filename: 'strategic-synergy-evaluator.skill',
    description: 'Evaluates revenue cross-sell and cost rationalization potential across potential buyers.',
    instructions: '1. Identify 2 Tier-1 Strategic Consolidators and evaluate customer overlap.\n2. Identify 2 Private Equity sponsors with active tech portfolio platforms for bolt-on acquisition.\n3. Estimate 3-year post-acquisition cost synergy potential (SG&A rationalization and G&A cloud consolidation).',
    enabled: true,
    isCustom: false
  }
];

const defaultLayouts = [
  {
    id: 'layout-standard-ma',
    name: 'Standard Institutional M&A Brief',
    description: 'Industry-standard 8-section investment banking market brief and valuation memorandum.',
    isDefault: true,
    sections: [
      '1. Executive Summary & Investment Thesis',
      '2. Business Overview & Operational Profile',
      '3. Financial Summary & Operational KPIs (Table)',
      '4. Market Dynamics & Industry Landscape',
      '5. Precedent Deal Comparables (Table)',
      '6. Indicative Valuation Analysis & Range Corridor',
      '7. Potential Strategic & Financial Buyer Universe',
      '8. Due Diligence Priorities & Review Checklist'
    ]
  },
  {
    id: 'layout-pe-memo',
    name: 'Private Equity LBO Investment Memo',
    description: 'Structured for Investment Committee reviews focusing on leverage capacity, returns, and risks.',
    isDefault: false,
    sections: [
      '1. Investment Recommendation & Deal Summary',
      '2. Target Market Attractiveness & Barriers to Entry',
      '3. Historical Financials & Free Cash Flow Conversion',
      '4. Precedent Sponsor Buyout Multiples',
      '5. Leverage Capacity & Returns Sensitivity (IRR/MoIC)',
      '6. Value Creation Plan (Organic & M&A Roll-Up)',
      '7. Downside Risks & Mitigations'
    ]
  },
  {
    id: 'layout-exec-teaser',
    name: 'Executive 1-Page Deal Teaser',
    description: 'High-level executive summary tailored for C-suite decision makers and initial outreach.',
    isDefault: false,
    sections: [
      '1. Opportunity Overview & Core Value Proposition',
      '2. Key Financial Highlights (Revenue, Growth, Margin)',
      '3. Market Positioning & Differentiating Moats',
      '4. Valuation Benchmark & Multiple Corridor',
      '5. Strategic Fit & Transaction Rationale'
    ]
  },
  {
    id: 'layout-commercial-dd',
    name: 'Commercial Diligence & Market Study',
    description: 'In-depth market landscape study, customer cohort dynamics, and competitive benchmarking.',
    isDefault: false,
    sections: [
      '1. Market Sizing (TAM/SAM/SOM) & Structural Drivers',
      '2. Competitive Matrix & Feature Differentiation',
      '3. Customer Retention & Cohort Health Analysis',
      '4. Pricing Power & Unit Economics Review',
      '5. Precedent M&A Transactions in Adjacent Niches',
      '6. Strategic Exit Roadmap'
    ]
  }
];

const defaultAiSettings = {
  activeProvider: 'gemini',
  keys: {
    gemini: '',
    openai: '',
    claude: '',
    grok: '',
    perplexity: ''
  },
  models: {
    gemini: 'gemini-3.8-flash',
    openai: 'gpt-4o',
    claude: 'claude-3-7-sonnet-20250219',
    grok: 'grok-2-latest',
    perplexity: 'sonar-pro'
  }
};

export default function Home() {
  const [companies, setCompanies] = useState(defaultCompanies);
  const [toast, setToast] = useState('');
  const [aiSettings, setAiSettings] = useState(defaultAiSettings);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Agent extensions state
  const [knowledgeBase, setKnowledgeBase] = useState(defaultKnowledgeBase);
  const [isKbModalOpen, setIsKbModalOpen] = useState(false);

  const [skills, setSkills] = useState(defaultSkills);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);

  const [reportLayouts, setReportLayouts] = useState(defaultLayouts);
  const [activeLayoutId, setActiveLayoutId] = useState('layout-standard-ma');
  const [isLayoutsModalOpen, setIsLayoutsModalOpen] = useState(false);

  // Dropdown menu state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Active workflow tab state (shared with navbar and MarketBriefView)
  const [activeTab, setActiveTab] = useState('analysis');

  // Global keyboard shortcuts (Cmd/Ctrl + 1-4 for tabs, Cmd/Ctrl + K for tools)
  useEffect(() => {
    function handleKeyDown(event) {
      const activeTag = document.activeElement?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;

      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey) {
        if (event.key === '1') {
          event.preventDefault();
          setActiveTab('analysis');
        } else if (event.key === '2') {
          event.preventDefault();
          setActiveTab('comps');
        } else if (event.key === '3') {
          event.preventDefault();
          setActiveTab('brief');
        } else if (event.key === '4') {
          event.preventDefault();
          setActiveTab('chat');
        } else if (event.key.toLowerCase() === 'k') {
          event.preventDefault();
          setIsDropdownOpen(prev => !prev);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Initialize theme, AI settings, and state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Load Custom Companies
      try {
        const storedCustom = localStorage.getItem('dealbrief_custom_companies_v1');
        if (storedCustom) {
          const parsed = JSON.parse(storedCustom);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCompanies([...parsed, ...defaultCompanies]);
          }
        }
      } catch (e) {
        console.error('Failed to load custom companies:', e);
      }

      // 2. Load AI Settings and Purge Permanent Keys from localStorage
      try {
        // Security: Remove any legacy permanent API keys from localStorage
        localStorage.removeItem('gemini_api_key');
        const storedAi = localStorage.getItem('ai_provider_settings');
        if (storedAi) {
          const parsed = JSON.parse(storedAi);
          // Strip out keys from localStorage if any were inadvertently saved
          if (parsed.keys) {
            delete parsed.keys;
            localStorage.setItem('ai_provider_settings', JSON.stringify(parsed));
          }
          const loadedModels = { ...(parsed.models || {}) };
          if (!loadedModels.gemini || loadedModels.gemini.includes('2.5')) {
            loadedModels.gemini = 'gemini-3.8-flash';
          }
          setAiSettings(prev => ({
            ...prev,
            activeProvider: parsed.activeProvider || prev.activeProvider,
            models: { ...prev.models, ...loadedModels }
          }));
        }

        // Safer Data Handling: Load API keys strictly from ephemeral sessionStorage
        const sessionKeysRaw = sessionStorage.getItem('dealbrief_session_keys');
        if (sessionKeysRaw) {
          const sessionKeys = JSON.parse(sessionKeysRaw);
          setAiSettings(prev => ({
            ...prev,
            keys: { ...prev.keys, ...(sessionKeys || {}) }
          }));
        }
      } catch (e) {
        console.error('Failed to load AI settings or session keys:', e);
      }

      const savedTheme = localStorage.getItem('shadcn_theme');
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      }

      // Load Knowledge Base
      try {
        const storedKb = localStorage.getItem('agent_knowledge_base');
        if (storedKb) {
          const parsed = JSON.parse(storedKb);
          if (Array.isArray(parsed) && parsed.length > 0) setKnowledgeBase(parsed);
        }
      } catch (e) {
        console.error('Failed to load knowledge base from storage:', e);
      }

      // Load Skills
      try {
        const storedSkills = localStorage.getItem('agent_skills');
        if (storedSkills) {
          const parsed = JSON.parse(storedSkills);
          if (Array.isArray(parsed) && parsed.length > 0) setSkills(parsed);
        }
      } catch (e) {
        console.error('Failed to load skills from storage:', e);
      }

      // Load Layouts
      try {
        const storedLayouts = localStorage.getItem('report_layouts');
        if (storedLayouts) {
          const parsed = JSON.parse(storedLayouts);
          if (Array.isArray(parsed) && parsed.length > 0) setReportLayouts(parsed);
        }
        const storedActiveLayout = localStorage.getItem('active_report_layout');
        if (storedActiveLayout) setActiveLayoutId(storedActiveLayout);
      } catch (e) {
        console.error('Failed to load layouts from storage:', e);
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (typeof window !== 'undefined') {
      if (nextDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('shadcn_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('shadcn_theme', 'light');
      }
    }
  };

  const handleSaveAiSettings = (newSettings) => {
    const cleanSettings = {
      ...newSettings,
      models: {
        ...newSettings.models,
        gemini: (!newSettings.models?.gemini || newSettings.models.gemini.includes('2.5'))
          ? 'gemini-3.8-flash'
          : newSettings.models.gemini
      }
    };
    setAiSettings(cleanSettings);

    if (typeof window !== 'undefined') {
      // Security: Only persist non-sensitive preferences (activeProvider, models) in localStorage
      const safePreferences = {
        activeProvider: cleanSettings.activeProvider,
        models: cleanSettings.models
      };
      localStorage.setItem('ai_provider_settings', JSON.stringify(safePreferences));

      // Security: Store sensitive API keys ONLY in ephemeral sessionStorage (wiped on tab/browser close)
      if (cleanSettings.keys) {
        sessionStorage.setItem('dealbrief_session_keys', JSON.stringify(cleanSettings.keys));
      }
    }

    const provNames = {
      gemini: 'Google Gemini',
      openai: 'OpenAI (ChatGPT)',
      claude: 'Anthropic Claude',
      grok: 'xAI Grok',
      perplexity: 'Perplexity AI'
    };
    const activeProv = provNames[newSettings.activeProvider] || 'Google Gemini';
    const activeModel = newSettings.models?.[newSettings.activeProvider] || '';
    const hasKey = Boolean(newSettings.keys?.[newSettings.activeProvider]);
    if (hasKey) {
      setToast(`AI Settings saved in session memory! Active Engine: ${activeProv} (${activeModel})`);
    } else {
      setToast(`AI Settings saved for ${activeProv}. Running in Domain Simulator until key is configured.`);
    }
  };

  const handleAddCompany = (newCompany) => {
    setCompanies(prev => {
      const updated = [newCompany, ...prev];
      try {
        const customOnly = updated.filter(c => c.isCustom);
        localStorage.setItem('dealbrief_custom_companies_v1', JSON.stringify(customOnly));
      } catch (e) {
        console.error('Failed to persist custom company:', e);
      }
      return updated;
    });
    setToast(`Added "${newCompany.name}" to active targets (persisted across refreshes)!`);
  };

  const handleDeleteCompany = (companyId) => {
    setCompanies(prev => {
      const updated = prev.filter(c => c.id !== companyId);
      try {
        const customOnly = updated.filter(c => c.isCustom);
        localStorage.setItem('dealbrief_custom_companies_v1', JSON.stringify(customOnly));
      } catch (e) {}
      return updated;
    });
    clearCompanyWorkspace(companyId);
    setToast('Target removed from active workspace.');
  };

  const handleUpdateKnowledgeBase = (updated) => {
    setKnowledgeBase(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agent_knowledge_base', JSON.stringify(updated));
    }
  };

  const handleUpdateSkills = (updated) => {
    setSkills(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agent_skills', JSON.stringify(updated));
    }
  };

  const handleUpdateLayouts = (updated) => {
    setReportLayouts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('report_layouts', JSON.stringify(updated));
    }
  };

  const handleSelectLayout = (layoutId) => {
    setActiveLayoutId(layoutId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_report_layout', layoutId);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const activeKbCount = knowledgeBase.filter(k => k.enabled).length;
  const activeSkillsCount = skills.filter(s => s.enabled).length;
  const currentLayoutName = reportLayouts.find(l => l.id === activeLayoutId)?.name || 'Standard M&A';

  const activeProvider = aiSettings.activeProvider || 'gemini';
  const activeKey = aiSettings.keys?.[activeProvider] || '';
  const activeModel = aiSettings.models?.[activeProvider] || '';
  const provLabels = {
    gemini: 'Gemini',
    openai: 'ChatGPT',
    claude: 'Claude',
    grok: 'Grok',
    perplexity: 'Perplexity'
  };
  const activeProviderLabel = provLabels[activeProvider] || 'Gemini';
  const hasActiveKey = Boolean(activeKey);

  return (
    <main className="standalone-shell">
      {/* Sticky Navigation Header */}
      <header className="shadcn-navbar">
        <div className="shadcn-nav-inner">
          <div className="shadcn-nav-brand">
            <div className="shadcn-brand-icon">
              <Sparkles size={14} />
            </div>
            <div className="brand-text-group">
              <span className="brand-name">Right to Win</span>
              <span className="brand-tag">DealBrief AI</span>
            </div>
          </div>


          <div className="shadcn-nav-actions">
            {/* AI Provider Status Chip */}
            <button
              type="button"
              className="btn btn-outline btn-sm nav-model-pill"
              onClick={() => setIsApiKeyModalOpen(true)}
              title={`Active AI: ${activeProviderLabel} (${activeModel || 'Default'}). Click to switch provider or enter keys.`}
            >
              <span
                className="status-dot-pulse"
                style={{
                  backgroundColor: hasActiveKey ? '#10b981' : '#f59e0b'
                }}
              />
              <span className="nav-model-name">{activeProviderLabel}</span>
              <span className={`badge ${hasActiveKey ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.625rem', padding: '0.05rem 0.35rem' }}>
                {hasActiveKey ? 'Live AI' : 'Offline'}
              </span>
            </button>

            {/* Unified Dropdown Menu */}
            <div className="dropdown-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className="btn btn-outline btn-sm dropdown-trigger"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                style={{ gap: '0.45rem' }}
              >
                <SlidersHorizontal size={13} />
                <span>Agent Tools & Setup</span>
                <span className="badge badge-secondary" style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem' }}>
                  {activeKbCount + activeSkillsCount}
                </span>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: hasActiveKey ? '#10b981' : '#f59e0b',
                    display: 'inline-block'
                  }}
                  title={hasActiveKey ? `${activeProviderLabel} Active (${activeModel})` : `${activeProviderLabel} Not Configured (Click AI Settings)`}
                />
                <ChevronDown
                  size={12}
                  style={{
                    transition: 'transform 0.15s ease',
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'none'
                  }}
                />
              </button>

              {isDropdownOpen && (
                <div className="dropdown-menu" role="menu">
                  <div className="dropdown-header-group">Agent Intelligence & Grounding</div>
                  
                  <button
                    type="button"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsKbModalOpen(true);
                    }}
                  >
                    <div className="dropdown-item-content">
                      <div className="dropdown-item-icon">
                        <BookOpen size={14} />
                      </div>
                      <div className="dropdown-item-title">
                        <span className="dropdown-item-name">Knowledge Base</span>
                        <span className="dropdown-item-desc">Reference docs & diligence notes</span>
                      </div>
                    </div>
                    <span className="badge badge-secondary" style={{ fontSize: '0.625rem' }}>
                      {activeKbCount} active
                    </span>
                  </button>

                  <button
                    type="button"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsSkillsModalOpen(true);
                    }}
                  >
                    <div className="dropdown-item-content">
                      <div className="dropdown-item-icon">
                        <Zap size={14} />
                      </div>
                      <div className="dropdown-item-title">
                        <span className="dropdown-item-name">Agent Skills</span>
                        <span className="dropdown-item-desc">Evaluation & audit playbooks (.skill)</span>
                      </div>
                    </div>
                    <span className="badge badge-secondary" style={{ fontSize: '0.625rem' }}>
                      {activeSkillsCount} active
                    </span>
                  </button>

                  <button
                    type="button"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsLayoutsModalOpen(true);
                    }}
                  >
                    <div className="dropdown-item-content">
                      <div className="dropdown-item-icon">
                        <LayoutTemplate size={14} />
                      </div>
                      <div className="dropdown-item-title">
                        <span className="dropdown-item-name">Report Layouts</span>
                        <span className="dropdown-item-desc">Change or upload report templates</span>
                      </div>
                    </div>
                    <span className="badge badge-outline" style={{ fontSize: '0.625rem' }}>
                      {currentLayoutName.split(' ')[0]}
                    </span>
                  </button>

                  <div className="dropdown-separator" />
                  <div className="dropdown-header-group">Pipeline & Environment</div>

                  <button
                    type="button"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsCustomModalOpen(true);
                    }}
                  >
                    <div className="dropdown-item-content">
                      <div className="dropdown-item-icon">
                        <Building2 size={14} />
                      </div>
                      <div className="dropdown-item-title">
                        <span className="dropdown-item-name">New Target</span>
                        <span className="dropdown-item-desc">Add custom company to evaluation pipeline</span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsApiKeyModalOpen(true);
                    }}
                  >
                    <div className="dropdown-item-content">
                      <div className="dropdown-item-icon">
                        <KeyRound size={14} />
                      </div>
                      <div className="dropdown-item-title">
                        <span className="dropdown-item-name">AI Settings ({activeProviderLabel})</span>
                        <span className="dropdown-item-desc">{activeModel} · Gemini, ChatGPT, Claude, Grok, Perplexity</span>
                      </div>
                    </div>
                    <span className={`badge ${hasActiveKey ? 'badge-success' : 'badge-secondary'}`} style={{ fontSize: '0.625rem' }}>
                      {hasActiveKey ? `${activeProviderLabel} Active` : 'Offline'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              className="btn btn-outline btn-sm btn-icon"
              onClick={toggleTheme}
              title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} mode`}
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workflow View */}
      <MarketBriefView
        sellers={companies}
        onToast={setToast}
        onOpenCustomModal={() => setIsCustomModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onDeleteCompany={handleDeleteCompany}
        apiKey={activeKey}
        aiSettings={aiSettings}
        knowledgeBase={knowledgeBase}
        skills={skills}
        reportLayouts={reportLayouts}
        activeLayoutId={activeLayoutId}
        onSelectLayout={handleSelectLayout}
        onOpenKnowledgeBaseModal={() => setIsKbModalOpen(true)}
        onOpenSkillsModal={() => setIsSkillsModalOpen(true)}
        onOpenLayoutsModal={() => setIsLayoutsModalOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Settings Dialog */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        aiSettings={aiSettings}
        onSaveSettings={handleSaveAiSettings}
      />

      {/* Custom Company Dialog */}
      <CustomCompanyModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onAddCompany={handleAddCompany}
      />

      {/* Knowledge Base Modal */}
      <KnowledgeBaseModal
        isOpen={isKbModalOpen}
        onClose={() => setIsKbModalOpen(false)}
        knowledgeBase={knowledgeBase}
        onUpdateKnowledgeBase={handleUpdateKnowledgeBase}
        onToast={setToast}
      />

      {/* Skills Modal */}
      <SkillsModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        skills={skills}
        onUpdateSkills={handleUpdateSkills}
        onToast={setToast}
      />

      {/* Report Layouts Modal */}
      <ReportLayoutsModal
        isOpen={isLayoutsModalOpen}
        onClose={() => setIsLayoutsModalOpen(false)}
        layouts={reportLayouts}
        activeLayoutId={activeLayoutId}
        onSelectLayout={handleSelectLayout}
        onUpdateLayouts={handleUpdateLayouts}
        onToast={setToast}
      />

      {/* Toast Primitive */}
      {toast && (
        <div className="toast-primitive" role="status">
          <CheckCircle2 size={16} style={{ color: 'hsl(var(--emerald))', flexShrink: 0 }} />
          <span>{toast}</span>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            style={{ width: '1.25rem', height: '1.25rem', marginLeft: 'auto' }}
            aria-label="Dismiss toast"
            onClick={() => setToast('')}
          >
            <X size={12} />
          </button>
        </div>
      )}
    </main>
  );
}
