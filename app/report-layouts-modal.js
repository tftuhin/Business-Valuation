'use client';

import { useState, useRef } from 'react';
import {
  Check, FileSpreadsheet, FileText, Layout, Plus, Trash2, Upload, X,
  Layers, CheckCircle2, SlidersHorizontal
} from 'lucide-react';

export default function ReportLayoutsModal({
  isOpen,
  onClose,
  layouts = [],
  activeLayoutId = 'layout-standard-ma',
  onSelectLayout = () => {},
  onUpdateLayouts = () => {},
  onToast = () => {}
}) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add'
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSections, setNewSections] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleSelect = (id) => {
    onSelectLayout(id);
    const selected = layouts.find(l => l.id === id);
    onToast(`Selected report layout: "${selected?.name || id}".`);
    onClose();
  };

  const handleDelete = (id) => {
    if (layouts.find(l => l.id === id)?.isDefault) return;
    const updated = layouts.filter(l => l.id !== id);
    onUpdateLayouts(updated);
    if (activeLayoutId === id) {
      onSelectLayout(layouts[0]?.id || 'layout-standard-ma');
    }
    onToast('Custom report layout removed.');
  };

  const handleAddLayout = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newSections.trim()) return;

    const newLayout = {
      id: `layout-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || 'Custom report layout template.',
      sections: newSections.trim().split('\n').filter(s => s.trim() !== ''),
      template: newSections.trim(),
      isCustom: true
    };

    onUpdateLayouts([...layouts, newLayout]);
    onSelectLayout(newLayout.id);
    setNewName('');
    setNewDesc('');
    setNewSections('');
    setActiveTab('list');
    onToast(`Added and selected "${newLayout.name}" layout!`);
    onClose();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      const sections = content
        .split('\n')
        .filter(line => line.startsWith('#') || line.trim().startsWith('-'))
        .slice(0, 10);

      const newLayout = {
        id: `layout-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '),
        description: `Uploaded report layout template (${file.name}).`,
        sections: sections.length > 0 ? sections : ['Section 1: Executive Overview', 'Section 2: Valuation Analysis', 'Section 3: Strategic Conclusion'],
        template: content,
        isCustom: true
      };

      onUpdateLayouts([...layouts, newLayout]);
      onSelectLayout(newLayout.id);
      onToast(`Uploaded and activated layout: "${newLayout.name}"!`);
      onClose();
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content modal-content-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div className="company-mark" style={{ width: '2rem', height: '2rem', fontSize: '0.75rem' }}>
              <Layout size={15} />
            </div>
            <div>
              <h3 className="modal-title">Report Layouts & Formats</h3>
              <p className="modal-description">
                Select an institutional report format or upload a custom evaluation layout template.
              </p>
            </div>
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

        {/* Subnav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.25)' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'list' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('list')}
            >
              <Layers size={13} />
              <span>Available Layouts ({layouts.length})</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'add' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('add')}
            >
              <Plus size={13} />
              <span>Create / Upload Layout</span>
            </button>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={13} />
            <span>Upload Template (.md)</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".md,.txt,.json"
            onChange={handleFileUpload}
          />
        </div>

        <div className="modal-body">
          {activeTab === 'list' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {layouts.map(layout => {
                const isActive = layout.id === activeLayoutId;
                return (
                  <div
                    key={layout.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '1rem',
                      border: `1.5px solid ${isActive ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                      borderRadius: 'calc(var(--radius) - 2px)',
                      background: isActive ? 'hsl(var(--accent) / 0.35)' : 'hsl(var(--card))',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => handleSelect(layout.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.9375rem' }}>{layout.name}</strong>
                        {isActive && (
                          <span className="badge badge-success" style={{ fontSize: '0.625rem' }}>
                            <Check size={11} /> Active
                          </span>
                        )}
                        {layout.isDefault && (
                          <span className="badge badge-secondary" style={{ fontSize: '0.625rem' }}>Preset</span>
                        )}
                        {layout.isCustom && (
                          <span className="badge badge-outline" style={{ fontSize: '0.625rem' }}>Custom</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {layout.isCustom && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-icon"
                            style={{ width: '1.75rem', height: '1.75rem', color: 'hsl(var(--destructive))' }}
                            onClick={(e) => { e.stopPropagation(); handleDelete(layout.id); }}
                            title="Delete custom layout"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          className={`btn ${isActive ? 'btn-primary' : 'btn-outline'} btn-sm`}
                          style={{ height: '1.875rem' }}
                          onClick={(e) => { e.stopPropagation(); handleSelect(layout.id); }}
                        >
                          {isActive ? 'Current Layout' : 'Use This Layout'}
                        </button>
                      </div>
                    </div>

                    <p style={{ margin: '0 0 0.625rem', fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.4 }}>
                      {layout.description}
                    </p>

                    {/* Section pills preview */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {(layout.sections || []).slice(0, 5).map((sec, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '0.6875rem',
                            padding: '0.125rem 0.5rem',
                            borderRadius: 'calc(var(--radius) - 4px)',
                            background: 'hsl(var(--muted))',
                            color: 'hsl(var(--muted-foreground))'
                          }}
                        >
                          {sec.replace(/^#+\s*/, '')}
                        </span>
                      ))}
                      {(layout.sections || []).length > 5 && (
                        <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', alignSelf: 'center' }}>
                          +{(layout.sections || []).length - 5} more sections
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleAddLayout}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-field">
                  <label className="form-label">Layout Name *</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Board Strategy Teaser or Debt Sizing Memo"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Description</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      placeholder="e.g. Condensed 4-section summary for C-suite executive committee."
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Layout Sections / Template Outline (Markdown) *</label>
                  <textarea
                    rows={8}
                    required
                    className="input-textarea"
                    placeholder={`Enter section headers or Markdown structure, e.g.:\n## 1. Executive Summary & Core Moat\n## 2. Revenue & Customer Retention Breakdown\n## 3. Precedent M&A Transactions\n## 4. Valuation Corridor & Scenario Matrix\n## 5. Next Steps for Buyer`}
                    value={newSections}
                    onChange={e => setNewSections(e.target.value)}
                  />
                  <span className="form-hint">
                    The report synthesizer will structure its evaluation brief strictly according to this custom section layout.
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setActiveTab('list')}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    <Check size={14} />
                    <span>Save & Activate Layout</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            Active layout dictates the section breakdown and structure of Tab 3 reports.
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
