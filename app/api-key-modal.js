'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2, CircleAlert, ExternalLink, KeyRound, Loader2, Sparkles, X,
  Check, Eye, EyeOff, Bot, Globe, Shield, Zap, Cpu
} from 'lucide-react';
import { PROVIDERS } from './api/llm-provider';

export default function ApiKeyModal({
  isOpen,
  onClose,
  aiSettings,
  onSaveSettings
}) {
  const [selectedProviderId, setSelectedProviderId] = useState('gemini');
  const [activeProviderId, setActiveProviderId] = useState('gemini');
  const [keys, setKeys] = useState({
    gemini: '',
    openai: '',
    claude: '',
    grok: '',
    perplexity: ''
  });
  const [models, setModels] = useState({
    gemini: 'gemini-2.5-flash',
    openai: 'gpt-4o',
    claude: 'claude-3-7-sonnet-20250219',
    grok: 'grok-2-latest',
    perplexity: 'sonar-pro'
  });
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState({});

  useEffect(() => {
    if (aiSettings) {
      if (aiSettings.activeProvider) {
        setActiveProviderId(aiSettings.activeProvider);
        setSelectedProviderId(aiSettings.activeProvider);
      }
      if (aiSettings.keys) {
        setKeys(prev => ({ ...prev, ...aiSettings.keys }));
      }
      if (aiSettings.models) {
        setModels(prev => ({ ...prev, ...aiSettings.models }));
      }
    }
  }, [aiSettings, isOpen]);

  if (!isOpen) return null;

  const currentProvider = PROVIDERS[selectedProviderId] || PROVIDERS.gemini;
  const currentKey = keys[selectedProviderId] || '';
  const currentModel = models[selectedProviderId] || currentProvider.defaultModel;

  const handleKeyChange = (val) => {
    setKeys(prev => ({ ...prev, [selectedProviderId]: val }));
    setVerifyStatus(prev => ({ ...prev, [selectedProviderId]: null }));
  };

  const handleModelChange = (val) => {
    setModels(prev => ({ ...prev, [selectedProviderId]: val }));
    setVerifyStatus(prev => ({ ...prev, [selectedProviderId]: null }));
  };

  const handleTest = async () => {
    const keyToTest = (currentKey || '').trim();
    if (!keyToTest) {
      setVerifyStatus(prev => ({
        ...prev,
        [selectedProviderId]: {
          success: false,
          message: `Please enter an API key for ${currentProvider.name} to test connection.`
        }
      }));
      return;
    }

    setIsVerifying(true);
    setVerifyStatus(prev => ({ ...prev, [selectedProviderId]: null }));

    try {
      const res = await fetch('/api/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProviderId,
          apiKey: keyToTest,
          modelId: currentModel
        })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setVerifyStatus(prev => ({
          ...prev,
          [selectedProviderId]: {
            success: true,
            message: `Connected successfully to ${data.provider} (${data.model})!`
          }
        }));
      } else {
        setVerifyStatus(prev => ({
          ...prev,
          [selectedProviderId]: {
            success: false,
            message: data.error || 'Connection failed. Please verify API key.'
          }
        }));
      }
    } catch (err) {
      setVerifyStatus(prev => ({
        ...prev,
        [selectedProviderId]: {
          success: false,
          message: 'Network error communicating with verification endpoint.'
        }
      }));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = () => {
    onSaveSettings({
      activeProvider: activeProviderId,
      keys,
      models
    });
    onClose();
  };

  const handleClearCurrent = () => {
    setKeys(prev => ({ ...prev, [selectedProviderId]: '' }));
    setVerifyStatus(prev => ({
      ...prev,
      [selectedProviderId]: {
        success: true,
        message: `${currentProvider.name} key cleared.`
      }
    }));
  };

  const providerList = Object.values(PROVIDERS);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: '42rem' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-secondary" style={{ fontSize: '0.625rem' }}>
                <Cpu size={11} /> Multi-Model Architecture
              </span>
              <span className="badge badge-outline" style={{ fontSize: '0.625rem' }}>
                5 Supported Engines
              </span>
            </div>
            <h3 className="modal-title">AI Engine & Provider Settings</h3>
            <p className="modal-description">
              Connect Google Gemini, ChatGPT, Claude, Grok, or Perplexity for institutional M&A research.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Provider Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.375rem', marginBottom: '1.25rem' }}>
            {providerList.map(prov => {
              const isSelected = selectedProviderId === prov.id;
              const isActive = activeProviderId === prov.id;
              const hasKey = Boolean(keys[prov.id]);

              return (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => {
                    setSelectedProviderId(prov.id);
                    setShowKey(false);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 0.25rem',
                    borderRadius: 'calc(var(--radius) - 2px)',
                    border: isSelected ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                    backgroundColor: isSelected ? 'hsl(var(--accent))' : 'hsl(var(--card))',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: '#10b981'
                      }}
                      title="Active Engine"
                    />
                  )}
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {prov.id === 'gemini' ? 'Gemini' :
                     prov.id === 'openai' ? 'ChatGPT' :
                     prov.id === 'claude' ? 'Claude' :
                     prov.id === 'grok' ? 'Grok' : 'Perplexity'}
                  </span>
                  <span style={{ fontSize: '0.625rem', color: hasKey ? '#10b981' : 'hsl(var(--muted-foreground))' }}>
                    {hasKey ? 'Configured' : 'Offline'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Provider Card */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius)',
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--muted) / 0.2)',
              marginBottom: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.9375rem' }}>{currentProvider.name}</strong>
                  <span className="badge badge-secondary" style={{ fontSize: '0.625rem' }}>
                    {currentProvider.tag}
                  </span>
                </div>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                  {selectedProviderId === 'gemini' && 'Google Search Grounding for live financial data and company intelligence.'}
                  {selectedProviderId === 'openai' && 'State-of-the-art reasoning with GPT-4o, o3-mini, and structured JSON.'}
                  {selectedProviderId === 'claude' && 'Deep institutional analysis, risk matrices, and multi-scenario valuation models.'}
                  {selectedProviderId === 'grok' && 'Real-time telemetry and comprehensive market intelligence from xAI.'}
                  {selectedProviderId === 'perplexity' && 'Live web search with automatic direct citation links on precedent deals.'}
                </p>
              </div>

              {/* Set Active Button */}
              <button
                type="button"
                className={`btn btn-sm ${activeProviderId === selectedProviderId ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', gap: '0.35rem', flexShrink: 0 }}
                onClick={() => setActiveProviderId(selectedProviderId)}
              >
                {activeProviderId === selectedProviderId ? (
                  <><Check size={12} /> Active Agent</>
                ) : (
                  'Make Active'
                )}
              </button>
            </div>

            {/* Model Selector */}
            <div className="form-field" style={{ marginBottom: '0.875rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Model Version</label>
              <div className="select-wrapper">
                <select
                  value={currentModel}
                  onChange={e => handleModelChange(e.target.value)}
                  style={{ fontSize: '0.8125rem', height: '2.25rem' }}
                >
                  {currentProvider.models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* API Key Input */}
            <div className="form-field" style={{ marginBottom: '0.625rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>
                {currentProvider.name} API Key
              </label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder={currentProvider.keyPlaceholder}
                  value={currentKey}
                  onChange={e => handleKeyChange(e.target.value)}
                  style={{ fontSize: '0.8125rem', height: '2.25rem', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'hsl(var(--muted-foreground))',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <span className="form-hint" style={{ fontSize: '0.6875rem' }}>
                Saved locally in browser storage or read securely from server-side <code style={{ fontSize: '0.6875rem' }}>{currentProvider.envVar}</code>.
              </span>
            </div>

            {/* Direct Documentation Link */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>Need a key?</span>
              <a
                href={currentProvider.keyDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: 'hsl(var(--primary))',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                Get API key from {currentProvider.docsLabel} <ExternalLink size={11} />
              </a>
            </div>

            {/* Verification Status Banner */}
            {verifyStatus[selectedProviderId] && (
              <div
                className={`alert ${verifyStatus[selectedProviderId].success ? 'badge-success' : 'badge-warning'}`}
                style={{ marginTop: '0.875rem', padding: '0.625rem 0.875rem', fontSize: '0.75rem', border: '1px solid hsl(var(--border))' }}
              >
                {verifyStatus[selectedProviderId].success ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}
                <span>{verifyStatus[selectedProviderId].message}</span>
              </div>
            )}
          </div>

          {/* Offline Fallback notice */}
          <div className="alert alert-info" style={{ padding: '0.625rem 0.875rem', fontSize: '0.75rem' }}>
            <Sparkles size={14} />
            <div>
              <strong>Built-in Offline Domain Simulator:</strong> If no API key is provided for the active provider, the system automatically synthesizes verified institutional M&A reports and valuation models offline.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {currentKey && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleClearCurrent}
              >
                Clear Key
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleTest}
              disabled={isVerifying || !currentKey.trim()}
            >
              {isVerifying ? <Loader2 size={13} className="spin-slow" /> : <Sparkles size={13} />}
              <span>{isVerifying ? 'Verifying...' : `Test ${currentProvider.name}`}</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSave}
            >
              Save AI Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
