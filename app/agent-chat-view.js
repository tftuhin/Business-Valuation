'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, Sparkles, Copy, Check, RotateCcw,
  BookOpen, Zap, AlertCircle, TrendingUp, Building2, ShieldCheck
} from 'lucide-react';
import { marked } from 'marked';

export default function AgentChatView({
  company = {},
  comparableDeals = [],
  knowledgeBase = [],
  skills = [],
  apiKey = '',
  onToast = () => {}
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **Autonomous Deal Intelligence & Valuation Agent** for **${company?.name || 'Target Company'}**.

I have full operational awareness of:
- **Financial Profile:** $${company?.revenue || '28M'} LTM Revenue, ${company?.growth || '34%'} YoY Growth, ${company?.margin || '19%'} EBITDA Margin, ${company?.retention || '114%'} NRR.
- **Precedent M&A Benchmark Deals:** ${comparableDeals.length} precedent sector transactions loaded.
- **Active Context:** ${(knowledgeBase || []).filter(k => k.enabled).length} Knowledge Base document(s) and ${(skills || []).filter(s => s.enabled).length} active Agent Skill(s).

How can I assist your diligence or valuation analysis today? Select a prompt below or type any custom query.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    'What are the biggest diligence red flags?',
    'Analyze top 3 strategic buyer synergies',
    'How sensitive is EV to growth slowing to 20%?',
    'Draft a confidential teaser email to PE sponsors',
    'Explain the Rule of 40 score compared to peers'
  ];

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          company,
          comparableDeals,
          knowledgeBase,
          skills,
          apiKey
        })
      });

      const data = await response.json();

      if (data.success) {
        const agentMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, agentMessage]);
      } else {
        throw new Error(data.error || 'Failed to get agent response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Advisory Notice:** Encountered an issue connecting to the inference pipeline (${err.message}). You can retry your query or check AI settings.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
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
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Session reset. Ready to analyze **${company?.name || 'Target Company'}** (${company?.sector || 'Enterprise Software'}). Ask any question about valuation, buyer fit, or diligence risks.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    onToast('Conversation thread cleared.');
  };

  const activeKbCount = (knowledgeBase || []).filter(k => k.enabled).length;
  const activeSkillsCount = (skills || []).filter(s => s.enabled).length;

  return (
    <div className="chat-container card">
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
              <span className="badge badge-success" style={{ fontSize: '0.625rem' }}>Online</span>
            </div>
            <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
              Interacting with {company?.name || 'Target'} ({company?.sector || 'Enterprise Software'})
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
            title="Reset conversation"
            style={{ height: '1.75rem', padding: '0 0.5rem' }}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Message History Thread */}
      <div className="chat-messages">
        {messages.map(msg => {
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
                </div>

                <div className="chat-bubble-meta">
                  <span>{msg.timestamp}</span>
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
                Deal agent analyzing company data & knowledge base...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="chat-quick-chips">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            className="chip-btn"
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
          >
            {prompt}
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
          placeholder={`Ask the agent anything about ${company?.name || 'the target'}, multiples, buyer synergy, or diligence... (Press Enter to send)`}
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
