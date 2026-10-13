'use client';

import { useState, useRef } from 'react';
import {
  Check, Code2, Cpu, FileCode, Plus, Sparkles, Trash2, Upload, Wrench, X,
  Zap, Info, ChevronRight, Eye
} from 'lucide-react';

export default function SkillsModal({
  isOpen,
  onClose,
  skills = [],
  onUpdateSkills = () => {},
  onToast = () => {}
}) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add' | 'inspect'
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [newName, setNewName] = useState('');
  const [newFilename, setNewFilename] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleToggle = (id) => {
    const updated = skills.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    onUpdateSkills(updated);
  };

  const handleDelete = (id) => {
    const updated = skills.filter(s => s.id !== id);
    onUpdateSkills(updated);
    if (selectedSkill?.id === id) setSelectedSkill(null);
    onToast('Agent skill file removed.');
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newInstructions.trim()) return;

    const fn = (newFilename.trim() || newName.toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '.skill';
    const newSkill = {
      id: `skill-${Date.now()}`,
      name: newName.trim(),
      filename: fn,
      description: newDesc.trim() || 'Custom advisory agent rubric and workflow guidelines.',
      instructions: newInstructions.trim(),
      enabled: true,
      isCustom: true,
      addedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    onUpdateSkills([newSkill, ...skills]);
    setNewName('');
    setNewFilename('');
    setNewDesc('');
    setNewInstructions('');
    setActiveTab('list');
    onToast(`Added skill file "${newSkill.filename}" to agent engine.`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      const newSkill = {
        id: `skill-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').toUpperCase(),
        filename: file.name,
        description: `Uploaded agent skill playbook (${file.name}).`,
        instructions: content,
        enabled: true,
        isCustom: true,
        addedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      onUpdateSkills([newSkill, ...skills]);
      onToast(`Uploaded skill file "${file.name}"!`);
    };
    reader.readAsText(file);
  };

  const activeCount = skills.filter(s => s.enabled).length;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content modal-content-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div className="company-mark" style={{ width: '2rem', height: '2rem', fontSize: '0.75rem' }}>
              <Zap size={15} />
            </div>
            <div>
              <h3 className="modal-title">Agent Skill Files</h3>
              <p className="modal-description">
                Specialized analysis rubrics, diligence playbooks, and reasoning frameworks activated by the AI agent.
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
              onClick={() => { setActiveTab('list'); setSelectedSkill(null); }}
            >
              <Wrench size={13} />
              <span>Loaded Skills ({skills.length})</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'add' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('add')}
            >
              <Plus size={13} />
              <span>Create / Upload Skill</span>
            </button>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            <strong>{activeCount}</strong> of <strong>{skills.length}</strong> skills enabled
          </span>
        </div>

        <div className="modal-body">
          {activeTab === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>
                  ACTIVE SPECIALIST AUDIT & REASONING SKILLS
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={13} />
                  <span>Upload .skill / .md file</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".skill,.md,.txt,.json"
                  onChange={handleFileUpload}
                />
              </div>

              {skills.map(skill => (
                <div
                  key={skill.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '0.875rem 1rem',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) - 2px)',
                    background: skill.enabled ? 'hsl(var(--card))' : 'hsl(var(--muted) / 0.25)',
                    opacity: skill.enabled ? 1 : 0.65,
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={skill.enabled}
                      onChange={() => handleToggle(skill.id)}
                      aria-label={`Enable ${skill.name}`}
                      style={{ marginTop: '0.25rem', width: 16, height: 16, accentColor: 'hsl(var(--primary))', cursor: 'pointer' }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.875rem' }}>{skill.name}</strong>
                        <span className="badge badge-secondary" style={{ fontFamily: 'Geist Mono, monospace', fontSize: '0.625rem' }}>
                          {skill.filename}
                        </span>
                        {skill.isCustom && (
                          <span className="badge badge-outline" style={{ fontSize: '0.625rem' }}>Custom</span>
                        )}
                      </div>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.4 }}>
                        {skill.description}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ height: '1.75rem', padding: '0 0.5rem', fontSize: '0.6875rem' }}
                      onClick={() => { setSelectedSkill(skill); setActiveTab('inspect'); }}
                      title="Inspect skill instructions"
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>
                    {skill.isCustom && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        style={{ width: '1.75rem', height: '1.75rem', color: 'hsl(var(--destructive))' }}
                        onClick={() => handleDelete(skill.id)}
                        title="Delete custom skill"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'inspect' && selectedSkill && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid hsl(var(--border))' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{selectedSkill.name}</h4>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'Geist Mono, monospace', color: 'hsl(var(--muted-foreground))' }}>
                    {selectedSkill.filename}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setActiveTab('list')}
                >
                  Back to Skills List
                </button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <span className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Description</span>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
                  {selectedSkill.description}
                </p>
              </div>

              <div>
                <span className="form-label" style={{ display: 'block', marginBottom: '0.375rem' }}>Instructions & Rules Prompt</span>
                <div style={{
                  padding: '1rem',
                  borderRadius: 'calc(var(--radius) - 2px)',
                  background: 'hsl(var(--muted) / 0.5)',
                  border: '1px solid hsl(var(--border))',
                  fontFamily: 'Geist Mono, ui-monospace, monospace',
                  fontSize: '0.75rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '18rem',
                  overflowY: 'auto'
                }}>
                  {selectedSkill.instructions}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'add' && (
            <form onSubmit={handleAddSkill}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-field">
                    <label className="form-label">Skill Name *</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        required
                        placeholder="e.g. LBO Debt Sizing & Returns"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-label">Filename (.skill or .md)</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        placeholder="e.g. lbo-debt-sizing.skill"
                        value={newFilename}
                        onChange={e => setNewFilename(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Summary / Purpose</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      placeholder="e.g. Assesses leverage capacity, interest coverage, and 5-year sponsor returns."
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Agent Instructions & Framework Rules *</label>
                  <textarea
                    rows={8}
                    required
                    className="input-textarea"
                    placeholder="Enter detailed prompt rules, evaluation formulas, or audit checklists that the agent MUST execute when analyzing a target..."
                    value={newInstructions}
                    onChange={e => setNewInstructions(e.target.value)}
                  />
                  <span className="form-hint">
                    These instructions are combined into the research engine and copilot prompt context when this skill is enabled.
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
                    <span>Save Skill File</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            Enabled skills actively guide both evaluation generation and copilot chat.
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
