'use client';

import { useState, useRef } from 'react';
import {
  BookOpen, Check, FileCode, FileText, Plus, Trash2, Upload, X,
  FolderOpen, AlertCircle, ShieldAlert
} from 'lucide-react';

export default function KnowledgeBaseModal({
  isOpen,
  onClose,
  knowledgeBase = [],
  onUpdateKnowledgeBase = () => {},
  onToast = () => {}
}) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add'
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Diligence & Market Research');
  const [newContent, setNewContent] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleToggleEnable = (id) => {
    const updated = knowledgeBase.map(item =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    onUpdateKnowledgeBase(updated);
  };

  const handleDelete = (id) => {
    const updated = knowledgeBase.filter(item => item.id !== id);
    onUpdateKnowledgeBase(updated);
    onToast('Knowledge document removed from agent memory.');
  };

  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newItem = {
      id: `kb-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      type: 'Text/Notes',
      content: newContent.trim(),
      wordCount: newContent.trim().split(/\s+/).length,
      enabled: true,
      addedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    onUpdateKnowledgeBase([newItem, ...knowledgeBase]);
    setNewTitle('');
    setNewContent('');
    setActiveTab('list');
    onToast(`Added "${newItem.title}" to Agent Knowledge Base.`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result || '';
      const newItem = {
        id: `kb-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        category: 'Uploaded File',
        type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        content: String(content),
        wordCount: String(content).split(/\s+/).length,
        enabled: true,
        addedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      onUpdateKnowledgeBase([newItem, ...knowledgeBase]);
      onToast(`Uploaded "${file.name}" to Agent Knowledge Base!`);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const activeCount = knowledgeBase.filter(k => k.enabled).length;
  const totalWords = knowledgeBase
    .filter(k => k.enabled)
    .reduce((sum, k) => sum + (k.wordCount || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content modal-content-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div className="company-mark" style={{ width: '2rem', height: '2rem', fontSize: '0.75rem' }}>
              <BookOpen size={15} />
            </div>
            <div>
              <h3 className="modal-title">Agent Knowledge Base</h3>
              <p className="modal-description">
                Upload or manage documents that ground the AI agent during company evaluation and chat.
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

        {/* Modal Subnav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.25)' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'list' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('list')}
            >
              <FolderOpen size={13} />
              <span>Loaded Documents ({knowledgeBase.length})</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'add' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('add')}
            >
              <Plus size={13} />
              <span>Add Document / Note</span>
            </button>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            <strong>{activeCount}</strong> of <strong>{knowledgeBase.length}</strong> active (~{totalWords.toLocaleString()} words)
          </span>
        </div>

        <div className="modal-body">
          {activeTab === 'list' ? (
            <div>
              {/* Drag and Drop Zone */}
              <div
                style={{
                  border: `2px dashed ${dragOver ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                  borderRadius: 'calc(var(--radius) - 2px)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  backgroundColor: dragOver ? 'hsl(var(--accent) / 0.5)' : 'hsl(var(--muted) / 0.15)',
                  cursor: 'pointer',
                  marginBottom: '1.25rem',
                  transition: 'all 0.15s ease'
                }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".txt,.md,.json,.csv,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                />
                <Upload size={22} style={{ margin: '0 auto 0.375rem', color: 'hsl(var(--primary))' }} />
                <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  Click to upload or drag & drop files here
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem' }}>
                  Supports CIM excerpts, 10-K filings, diligence transcripts, pricing models (.txt, .md, .csv, .json)
                </div>
              </div>

              {/* Document List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {knowledgeBase.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) - 2px)',
                      background: item.enabled ? 'hsl(var(--card))' : 'hsl(var(--muted) / 0.25)',
                      opacity: item.enabled ? 1 : 0.65
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={() => handleToggleEnable(item.id)}
                        aria-label={`Enable ${item.title}`}
                        style={{ width: 16, height: 16, accentColor: 'hsl(var(--primary))', cursor: 'pointer' }}
                      />
                      <FileText size={18} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </strong>
                          <span className="badge badge-secondary" style={{ fontSize: '0.625rem' }}>
                            {item.type || 'DOC'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.125rem' }}>
                          {item.category} · {item.wordCount?.toLocaleString() || 0} words · Added {item.addedAt}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <span className={`badge ${item.enabled ? 'badge-success' : 'badge-outline'}`} style={{ fontSize: '0.6875rem' }}>
                        {item.enabled ? 'Active' : 'Disabled'}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        style={{ width: '1.75rem', height: '1.75rem', color: 'hsl(var(--destructive))' }}
                        onClick={() => handleDelete(item.id)}
                        title="Delete document"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddDocument}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-field">
                  <label className="form-label">Document Title *</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Q4 Management Presentation or Proprietary Customer Churn Data"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Category / Domain</label>
                  <div className="select-wrapper">
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                    >
                      <option value="Diligence & Market Research">Diligence & Market Research</option>
                      <option value="Financial & Cohort Metrics">Financial & Cohort Metrics</option>
                      <option value="Precedent M&A Benchmarks">Precedent M&A Benchmarks</option>
                      <option value="Technical Architecture & Moat">Technical Architecture & Moat</option>
                      <option value="Strategic Buyer Thesis">Strategic Buyer Thesis</option>
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Content / Excerpt *</label>
                  <textarea
                    rows={8}
                    required
                    className="input-textarea"
                    placeholder="Paste report excerpts, executive notes, financial breakdowns, or diligence findings for the AI agent to ground its research in..."
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                  />
                  <span className="form-hint">
                    The agent will reference and cite this content during research and in the chat assistant.
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
                    <span>Save to Knowledge Base</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            All active documents are injected into the agent's context window.
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
