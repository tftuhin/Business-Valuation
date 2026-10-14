'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send, Bot, User, Sparkles, Copy, Check, RotateCcw,
  BookOpen, Zap, AlertCircle, TrendingUp, Building2, ShieldCheck,
  BarChart3, Users, DollarSign, Layers, FileText
} from 'lucide-react';
import { marked } from 'marked';

export default function AgentChatView({
  company = {},
  financials = {},
  comparableDeals = [],
  knowledgeBase = [],
  skills = [],
  researchReport = '',
  chatMessages = [],
  onUpdateChatMessages = () => {},
  apiKey = '',
  providerId = 'gemini',
  modelId = '',
  aiSettings = null,
  serverConfigured = {},
  onToast = () => {}
}) {
  const welcomeMessage = useMemo(() => ({
    id: `welcome-${company?.id || 'target'}`,
    role: 'assistant',
    content: `Hello! I am your **Autonomous Deal Intelligence & Valuation Agent** for **${company?.name || 'Target Company'}**.

I have full operational awareness of:
- **Target Financial Profile:** $${financials?.revenue || company?.revenue || '28M'} LTM Revenue, ${financials?.growth || company?.growth || '34%'} YoY Growth, ${financials?.margin || company?.margin || '19%'} EBITDA Margin, ${financials?.retention || company?.retention || '114%'} NRR.
- **Precedent M&A Benchmark Deals:** ${comparableDeals.length} precedent sector transactions calibrated.
- **Research Status:** ${researchReport ? 'Institutional valuation report synthesized & loaded into memory.' : 'Ready to analyze market signals and run valuation scenarios.'}
- **Active Context:** ${(knowledgeBase || []).filter(k => k.enabled).length} Knowledge Base document(s) and ${(skills || []).filter(s => s.enabled).length} active Agent Skill(s).

How can I assist your diligence or valuation analysis today? Select a categorized prompt below or type any custom query.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }), [
    company?.id,
    company?.name,
    company?.revenue,
    company?.growth,
    company?.margin,
    company?.retention,
    financials?.revenue,
    financials?.growth,
    financials?.margin,
    financials?.retention,
    comparableDeals.length,
    Boolean(researchReport),
    knowledgeBase,
    skills
  ]);

  const activeMessages = (Array.isArray(chatMessages) && chatMessages.length > 0)
    ? chatMessages
    : [welcomeMessage];

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages.length, isLoading]);

  const promptCategories = [
    { id: 'all', label: 'All Starters' },
    { id: 'valuation', label: 'Valuation & Multiples', icon: BarChart3 },
    { id: 'diligence', label: 'Diligence & Risks', icon: AlertCircle },
    { id: 'synergy', label: 'Buyer Synergy', icon: Users },
    { id: 'materials', label: 'IC & PE Teaser', icon: Layers }
  ];

  const categorizedPrompts = [
    { cat: 'valuation', text: 'How sensitive is Enterprise Value to growth slowing to 20%?' },
    { cat: 'valuation', text: 'Explain the Rule of 40 score compared to peer transaction medians' },
    { cat: 'diligence', text: 'What are the top 3 diligence red flags to audit before LOI?' },
    { cat: 'diligence', text: 'How should we audit customer concentration and cohort churn?' },
    { cat: 'synergy', text: 'Analyze top strategic consolidator synergies in this vertical' },
    { cat: 'synergy', text: 'Estimate 3-year SG&A cost rationalization potential' },
    { cat: 'materials', text: 'Draft a confidential 1-page executive teaser for PE sponsors' },
    { cat: 'materials', text: 'Draft 5 Investment Committee thesis bullets with key risks' }
  ];

  const displayedPrompts = activeCategory === 'all'
    ? categorizedPrompts
    : categorizedPrompts.filter(p => p.cat === activeCategory);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...activeMessages, userMessage];
    onUpdateChatMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          company: {
            ...company,
            ...financials
          },
          comparableDeals,
          knowledgeBase,
          skills,
          researchReport, // Ingest full retained research brief into AI context
          apiKey: aiSettings?.keys?.[aiSettings?.activeProvider] || apiKey,
          providerId: aiSettings?.activeProvider || providerId || 'gemini',
          modelId: aiSettings?.models?.[aiSettings?.activeProvider] || modelId
        })
      });

      const data = await response.json();

      if (data.success) {
        const agentMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          provider: data.provider,
          model: data.model,
          citations: data.citations || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedMessages = [...nextMessages, agentMessage];
        onUpdateChatMessages(updatedMessages);
      } else {
        throw new Error(data.error || 'Failed to get agent response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Advisory Notice:** Encountered an issue connecting to the inference pipeline (${err.message}). The domain intelligence engine is standing by with saved company research.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const updatedMessages = [...nextMessages, errorMessage];
      onUpdateChatMessages(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onToast('Message copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    onUpdateChatMessages([]);
    onToast(`Cleared conversation history for "${company?.name || 'Target'}".`);
  };

  const activeKbCount = (knowledgeBase || []).filter(k => k.enabled).length;
  const activeSkillsCount = (skills || []).filter(s => s.enabled).length;

  return (
    <div className="chat-container card">
      {/* Target Context Banner */}
      <div className="chat-context-strip">
        <div className="chat-context-left">
          <Building2 size={14} className="text-emerald-500" />
          <strong>{company?.name || 'Target Asset'}</strong>
          <span className="chat-context-divider">·</span>
          <span>{company?.sector || 'Enterprise Software'}</span>
          <span className="chat-context-divider">·</span>
          <span className="badge badge-secondary" style={{ fontSize: '0.6875rem' }}>
            ${financials?.revenue || company?.revenue || '28M'} Rev
          </span>
          <span className="badge badge-secondary" style={{ fontSize: '0.6875rem' }}>
            {financials?.growth || company?.growth || '34%'} YoY
          </span>
          {researchReport && (
            <span className="badge badge-success" style={{ fontSize: '0.6875rem', gap: '0.25rem' }}>
              <FileText size={10} /> Valuation Report Grounded
            </span>
          )}
        </div>

        <div className="chat-context-right">
          {Boolean(serverConfigured[providerId]) && (
            <span className="badge badge-success" style={{ fontSize: '0.6875rem', gap: '0.2rem' }}>
              <ShieldCheck size={10} /> Vercel Managed
            </span>
          )}
          <span className="badge badge-outline" style={{ fontSize: '0.6875rem' }}>
            {aiSettings?.activeProvider ? `${aiSettings.activeProvider.toUpperCase()} Grounded` : 'Gemini AI'}
          </span>
          <span className="badge badge-secondary" style={{ fontSize: '0.6875rem' }}>
            {activeMessages.length} Messages Retained
          </span>
        </div>
      </div>

      {/* Chat Header */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="company-mark" style={{ width: '2.25rem', height: '2.25rem', fontSize: '0.8125rem' }}>
            <Sparkles size={15} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
                Deal Intelligence Copilot
              </h3>
              <span className="badge badge-success" style={{ fontSize: '0.625rem' }}>Company Memory Active</span>
            </div>
            <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
              Retains all conversations, precedent comps, and research context for {company?.name || 'this target'}
            </p>
          </div>
        </div>

        {/* Active Context Badges & Clear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge badge-secondary" title="Active knowledge base documents" style={{ fontSize: '0.6875rem' }}>
            <BookOpen size={11} /> {activeKbCount} KB Docs
          </span>
          <span className="badge badge-secondary" title="Active agent skills" style={{ fontSize: '0.6875rem' }}>
            <Zap size={11} /> {activeSkillsCount} Skills
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleResetChat}
            title={`Clear chat history for ${company?.name || 'this target'}`}
            style={{ height: '1.75rem', padding: '0 0.5rem' }}
          >
            <RotateCcw size={12} />
            <span>Reset Target Chat</span>
          </button>
        </div>
      </div>

      {/* Message History Thread */}
      <div className="chat-messages">
        {activeMessages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`chat-message-row ${isUser ? 'is-user' : 'is-assistant'}`}
            >
              <div className="chat-avatar">
                {isUser ? <User size={14} /> : <Bot size={14} />}
              </div>

              <div className="chat-bubble-wrapper">
                <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                  {isUser ? (
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{msg.content}</div>
                  ) : (
                    <div
                      className="prose-chat"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(msg.content, { gfm: true, breaks: false })
                      }}
                    />
                  )}

                  {Array.isArray(msg.citations) && msg.citations.length > 0 && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid hsl(var(--border))', fontSize: '0.6875rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'hsl(var(--muted-foreground))' }}>Online Research Citations:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {msg.citations.map((c, idx) => (
                          <a key={idx} href={c.uri} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'hsl(var(--primary))', background: 'hsl(var(--muted))', padding: '0.125rem 0.35rem', borderRadius: '4px' }}>
                            {c.title} ↗
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="chat-bubble-meta">
                  <span>{msg.timestamp}</span>
                  {msg.provider && (
                    <span className="badge badge-outline" style={{ fontSize: '0.625rem', padding: '0.05rem 0.35rem' }}>
                      {msg.provider}
                    </span>
                  )}
                  {!isUser && (
                    <button
                      type="button"
                      className="chat-copy-btn"
                      onClick={() => copyText(msg.id, msg.content)}
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="chat-message-row is-assistant">
            <div className="chat-avatar">
              <Bot size={14} />
            </div>
            <div className="chat-bubble chat-bubble-assistant" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem' }}>
              <Sparkles size={14} className="spin-slow" style={{ color: 'hsl(var(--primary))' }} />
              <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
                Deal agent synthesizing financial models & knowledge base...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Categorized Prompt Selector */}
      <div className="chat-category-nav">
        {promptCategories.map(cat => (
          <button
            key={cat.id}
            type="button"
            className={`chat-category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="chat-quick-chips">
        {displayedPrompts.map((item, idx) => (
          <button
            key={idx}
            type="button"
            className="chip-btn"
            onClick={() => handleSend(item.text)}
            disabled={isLoading}
          >
            {item.text}
          </button>
        ))}
      </div>

      {/* Message Input Area */}
      <div className="chat-input-area">
        <textarea
          rows={2}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask the agent anything about ${company?.name || 'the target'}, multiples, buyer synergy, or diligence... (Enter to send)`}
          disabled={isLoading}
          className="chat-textarea"
        />
        <button
          type="button"
          className="btn btn-primary chat-send-btn"
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          title="Send message (Enter)"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
