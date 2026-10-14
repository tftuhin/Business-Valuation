'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, Database, Download, Upload, ShieldCheck, HardDrive, CheckCircle2,
  AlertTriangle, RefreshCw, Layers, FileJson, Lock, Sparkles, FolderArchive
} from 'lucide-react';
import {
  exportWorkspaceVault,
  importWorkspaceVault,
  getStorageMetrics,
  requestPersistentBrowserStorage
} from './workspace-store';

export default function WorkspaceVaultModal({
  isOpen,
  onClose,
  onVaultRestored,
  onToast
}) {
  const [metrics, setMetrics] = useState({ totalBytes: 0, formattedSize: '0 KB', targetCount: 0 });
  const [isPersistent, setIsPersistent] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setMetrics(getStorageMetrics());
    if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(setIsPersistent).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      setIsExporting(true);
      const vault = exportWorkspaceVault();
      if (!vault) throw new Error('Failed to generate vault object');

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(vault, null, 2));
      const downloadAnchor = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `DealBridge-Workspace-Vault-${timestamp}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      if (onToast) onToast('Workspace Vault exported successfully! Safe offline copy ready.');
    } catch (err) {
      console.error('Export failed:', err);
      if (onToast) onToast(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        const result = importWorkspaceVault(content);
        if (result.success) {
          setImportStatus({
            success: true,
            message: `Successfully restored ${result.restoredWorkspaces} company workspaces, ${result.restoredCustomCompanies} custom targets, and ${result.restoredKnowledgeDocs} knowledge base documents!`
          });
          setMetrics(getStorageMetrics());
          if (onToast) onToast('Workspace Vault restored successfully!');
          if (onVaultRestored) onVaultRestored(result.restoredData);
        } else {
          setImportStatus({ success: false, message: result.error || 'Failed to import vault file.' });
        }
      } catch (parseErr) {
        setImportStatus({ success: false, message: 'Invalid JSON file: ' + parseErr.message });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRequestPersistence = async () => {
    const granted = await requestPersistentBrowserStorage();
    setIsPersistent(granted);
    if (granted) {
      if (onToast) onToast('Browser persistent storage granted! Data is protected against disk clearing.');
    } else {
      if (onToast) onToast('Browser persistent storage request completed or managed by system policy.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '640px', width: '92%' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-labelledby="vault-title"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--primary, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <h2 id="vault-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                Workspace Vault & Zero-Database Storage
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                Offline file backup, encrypted local sandbox, and device portability
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Bank-Grade Architecture Banner */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}
          >
            <ShieldCheck size={20} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.8rem', lineHeight: '1.45', color: 'var(--foreground)' }}>
              <strong style={{ color: '#10b981', display: 'block', marginBottom: '2px' }}>
                Zero-Database Client-Side Architecture
              </strong>
              No confidential M&A financials, proprietary research notes, or banker review records are ever sent to an external third-party database. All data is persisted directly inside your browser’s isolated local sandbox (IndexedDB & Local Storage).
            </div>
          </div>

          {/* Telemetry / Metrics Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.65rem'
            }}
          >
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--card-bg)'
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Layers size={12} /> Target Workspaces
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>
                {metrics.targetCount}
              </div>
            </div>

            <div
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--card-bg)'
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <HardDrive size={12} /> Local Footprint
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>
                {metrics.formattedSize}
              </div>
            </div>

            <div
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--card-bg)'
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={12} /> Browser Persistence
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '6px', color: isPersistent ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {isPersistent ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                {isPersistent ? 'Protected' : 'Standard'}
              </div>
            </div>
          </div>

          {/* Action 1: Export Vault */}
          <div
            style={{
              padding: '0.9rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--card-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Download size={15} style={{ color: 'var(--primary)' }} />
                <span>Export Offline Workspace Vault (.json)</span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                Download a complete, portable backup of all targets, valuation models, research briefs, comps, and knowledge docs.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleExport}
              disabled={isExporting}
              style={{ flexShrink: 0, gap: '0.4rem' }}
            >
              <FileJson size={14} />
              <span>{isExporting ? 'Exporting...' : 'Export Vault'}</span>
            </button>
          </div>

          {/* Action 2: Import Vault */}
          <div
            style={{
              padding: '0.9rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--card-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Upload size={15} style={{ color: '#10b981' }} />
                <span>Restore / Import Workspace Vault</span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                Restore all data from a previously downloaded vault file onto any device or browser tab.
              </p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json,application/json"
                onChange={handleFileChange}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fileInputRef.current?.click()}
                style={{ flexShrink: 0, gap: '0.4rem' }}
              >
                <FolderArchive size={14} />
                <span>Select Vault File</span>
              </button>
            </div>
          </div>

          {/* Import Feedback Banner */}
          {importStatus && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                background: importStatus.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${importStatus.success ? '#10b981' : '#ef4444'}`,
                color: importStatus.success ? '#10b981' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {importStatus.success ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* Browser Persistence Opt-in */}
          {!isPersistent && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                fontSize: '0.75rem'
              }}
            >
              <div style={{ color: 'var(--foreground)' }}>
                Enable <strong>Browser Persistence Lock</strong> so your browser never purges local deal data during cache cleanup.
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', flexShrink: 0 }}
                onClick={handleRequestPersistence}
              >
                Lock Storage
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
            IndexedDB Mirror Active · AES Client Sandbox
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
