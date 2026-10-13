'use client';

import { useState } from 'react';
import { Building2, Sparkles, X } from 'lucide-react';

export default function CustomCompanyModal({ isOpen, onClose, onAddCompany }) {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [sector, setSector] = useState('Enterprise B2B SaaS');
  const [revenue, setRevenue] = useState(30);
  const [growth, setGrowth] = useState(35);
  const [margin, setMargin] = useState(20);
  const [retention, setRetention] = useState(115);
  const [netDebt, setNetDebt] = useState(5);
  const [location, setLocation] = useState('San Francisco, CA');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const words = name.trim().split(/\s+/);
    const initials = words.length > 1
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

    const newCompany = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      initials,
      website: website.trim(),
      sector: sector.trim(),
      revenue: `$${revenue}M`,
      growth: `${growth}%`,
      margin: `${margin}%`,
      retention: `${retention}%`,
      netDebt,
      location: location.trim(),
      notes: notes.trim(),
      isCustom: true
    };

    onAddCompany(newCompany);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content modal-content-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Research Target Company</h3>
            <p className="modal-description">Enter public or private company information for autonomous AI research</p>
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

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-field">
                <label className="form-label">Company Name *</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe, Scale AI, or Datadog"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Website / Domain</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="e.g. stripe.com"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Sector / Sub-industry</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="e.g. FinTech, CyberSecurity, Cloud IT"
                    value={sector}
                    onChange={e => setSector(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Headquarters Location</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="e.g. Austin, TX or London, UK"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.375rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Financial Benchmarks (Estimates)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="form-field">
                <label className="form-label">LTM Revenue</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={revenue}
                    onChange={e => setRevenue(Number(e.target.value))}
                  />
                  <em>$M</em>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">YoY Growth</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    step="0.1"
                    value={growth}
                    onChange={e => setGrowth(Number(e.target.value))}
                  />
                  <em>%</em>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">EBITDA</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    step="0.1"
                    value={margin}
                    onChange={e => setMargin(Number(e.target.value))}
                  />
                  <em>%</em>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Retention</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    step="0.1"
                    value={retention}
                    onChange={e => setRetention(Number(e.target.value))}
                  />
                  <em>%</em>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Net Debt</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    step="0.1"
                    value={netDebt}
                    onChange={e => setNetDebt(Number(e.target.value))}
                  />
                  <em>$M</em>
                </div>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Diligence Notes / Context (Optional)</label>
              <textarea
                className="input-textarea"
                rows={3}
                placeholder="Product offerings, competitors, key customers, or specific transaction goals for the AI agent..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Sparkles size={14} />
              <span>Add Target & Dispatch Agents</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
