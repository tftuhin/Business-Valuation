'use client';

import { useState } from 'react';
import { CheckCircle2, CircleAlert, ExternalLink, KeyRound, Loader2, Sparkles, X } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, currentKey, onSaveKey }) {
  const [keyInput, setKeyInput] = useState(currentKey || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!keyInput.trim()) {
      setVerifyStatus({ success: false, message: 'Please enter a Gemini API Key to test.' });
      return;
    }
    setIsVerifying(true);
    setVerifyStatus(null);
    try {
      const res = await fetch('/api/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setVerifyStatus({
          success: true,
          message: `Connected successfully to ${data.model || 'Gemini 3 Flash'}!`
        });
      } else {
        setVerifyStatus({
          success: false,
          message: data.error || 'Connection failed. Please check key permissions.'
        });
      }
    } catch (err) {
      setVerifyStatus({
        success: false,
        message: 'Network error communicating with verification endpoint.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = () => {
    onSaveKey(keyInput.trim());
    onClose();
  };

  const handleClear = () => {
    setKeyInput('');
    onSaveKey('');
    setVerifyStatus({ success: true, message: 'API key cleared. System reverted to Intelligent Offline Simulator.' });
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Google Gemini API Settings</h3>
            <p className="modal-description">Connect Gemini 3 Flash & Google Search Grounding for live research</p>
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

        <div className="modal-body">
          <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
            <Sparkles size={16} />
            <div>
              <strong>Instant Offline Mode Active:</strong>
              <div style={{ marginTop: '0.25rem', color: 'hsl(var(--muted-foreground))' }}>
                If you do not provide an API key, the built-in Intelligent Domain Simulator synthesizes realistic M&A deal research and institutional reports.
              </div>
            </div>
          </div>

          <div className="form-field" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Gemini API Key</label>
            <div className="input-wrapper">
              <input
                type="password"
                placeholder="AQ... or AIzaSy..."
                value={keyInput}
                onChange={e => {
                  setKeyInput(e.target.value);
                  setVerifyStatus(null);
                }}
              />
            </div>
            <span className="form-hint">
              Stored securely in local browser storage and used for direct server-side research calls.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <span style={{ color: 'hsl(var(--muted-foreground))' }}>Need a free Gemini key?</span>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'hsl(var(--primary))', fontWeight: 600, textDecoration: 'none' }}
            >
              Get free key on Google AI Studio <ExternalLink size={12} />
            </a>
          </div>

          {verifyStatus && (
            <div
              className={`alert ${verifyStatus.success ? 'badge-success' : 'badge-warning'}`}
              style={{ marginTop: '1rem', border: '1px solid hsl(var(--border))' }}
            >
              {verifyStatus.success ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
              <span>{verifyStatus.message}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {keyInput && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ marginRight: 'auto' }}
              onClick={handleClear}
            >
              Clear Key
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleTest}
            disabled={isVerifying || !keyInput.trim()}
          >
            {isVerifying ? <Loader2 size={13} className="spin-slow" /> : <Sparkles size={13} />}
            <span>{isVerifying ? 'Verifying...' : 'Test Connection'}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
