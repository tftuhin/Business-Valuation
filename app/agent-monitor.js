'use client';

import { useState, useEffect } from 'react';
import {
  Activity, CheckCircle2, ChevronDown, ChevronUp, Cpu, Globe,
  Search, ShieldCheck, Sparkles, Terminal, Copy, Check, Clock
} from 'lucide-react';

export default function AgentMonitor({ status = 'idle', logs = [], kbCount = 0, skillsCount = 0 }) {
  const [showLogs, setShowLogs] = useState(false);
  const [logFilter, setLogFilter] = useState('all'); // 'all' | 'agent' | 'grounding'
  const [isCopied, setIsCopied] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const stages = [
    { id: 1, name: 'Company Detective', desc: 'Public data & tech moat discovery', icon: Globe },
    { id: 2, name: 'Market Dynamics', desc: 'TAM, CAGR & competitive landscape', icon: Search },
    { id: 3, name: 'Deal Scout', desc: 'Precedent M&A transactions & multiples', icon: Activity },
    { id: 4, name: 'Valuation Engine', desc: 'Scenario modeling & equity bridge', icon: Cpu },
    { id: 5, name: 'Report Synthesizer', desc: 'Institutional brief generation', icon: Sparkles }
  ];

  const isRunning = status === 'running';
  const isDone = status === 'completed';

  // Timer tracking
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const copyLogs = () => {
    if (!logs.length) return;
    const logText = logs
      .map(l => `[${new Date(l.timestamp || Date.now()).toLocaleTimeString()}] [${l.agent || 'Agent'}]: ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(logText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'grounding') {
      return (log.message && (log.message.includes('Grounding') || log.message.includes('Search') || log.message.includes('citation')));
    }
    if (logFilter === 'agent') {
      return !log.message?.includes('Grounding');
    }
    return true;
  });

  // Calculate simulated stage progression
  const calculateStageState = (idx) => {
    if (isDone) return 'done';
    if (isRunning) {
      if (elapsedSeconds < 2) return idx === 0 ? 'running' : 'pending';
      if (elapsedSeconds < 4) return idx <= 1 ? (idx === 1 ? 'running' : 'done') : 'pending';
      if (elapsedSeconds < 6) return idx <= 2 ? (idx === 2 ? 'running' : 'done') : 'pending';
      if (elapsedSeconds < 8) return idx <= 3 ? (idx === 3 ? 'running' : 'done') : 'pending';
      return idx === 4 ? 'running' : 'done';
    }
    return 'pending';
  };

  const completedStagesCount = isDone ? 5 : isRunning ? Math.min(4, Math.floor(elapsedSeconds / 2)) : 0;
  const progressPercent = isDone ? 100 : isRunning ? Math.min(95, Math.max(15, (elapsedSeconds / 10) * 100)) : 0;

  return (
    <div className={`agent-monitor-panel ${isRunning ? 'is-active' : ''}`}>
      {/* Live progress indicator bar */}
      {isRunning && (
        <div className="agent-progress-track">
          <div
            className="agent-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="agent-monitor-header">
        <div className="agent-monitor-title">
          <span className="agent-pulse-icon">
            {isRunning ? <Cpu className="spin-slow" size={15} /> : <ShieldCheck size={15} />}
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <strong>Autonomous Multi-Agent Research Pipeline</strong>
              {isRunning && (
                <span className="agent-elapsed-tag">
                  <Clock size={11} /> {elapsedSeconds}s elapsed
                </span>
              )}
            </div>
            <small>
              <span>5 Specialist Agents</span>
              {kbCount > 0 && <span> · {kbCount} KB Grounding Docs</span>}
              {skillsCount > 0 && <span> · {skillsCount} Active Skills</span>}
              {isRunning && <span className="badge badge-warning" style={{ marginLeft: '0.375rem' }}>Stage 0{completedStagesCount + 1} Processing...</span>}
              {isDone && <span className="badge badge-success" style={{ marginLeft: '0.375rem' }}><CheckCircle2 size={11} /> All 5 Agents Verified</span>}
            </small>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowLogs(!showLogs)}
            title="Toggle Agent Activity Logs"
          >
            <Terminal size={13} />
            <span>Agent Telemetry ({logs.length})</span>
            {showLogs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* 5-Stage Agent Progress Pipeline */}
      <div className="agent-pipeline-grid">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const stageState = calculateStageState(idx);

          return (
            <div key={stage.id} className={`agent-pipeline-card state-${stageState}`}>
              <div className="agent-card-top">
                <span className="agent-icon-wrapper">
                  <Icon size={13} />
                </span>
                <span className="agent-stage-number">0{stage.id}</span>
              </div>
              <div className="agent-card-body">
                <strong>{stage.name}</strong>
                <p>{stage.desc}</p>
              </div>
              <div className="agent-card-footer-pill">
                {stageState === 'done' && <span className="badge badge-success"><CheckCircle2 size={10} /> Verified</span>}
                {stageState === 'running' && <span className="badge badge-warning"><Sparkles size={10} className="spin-slow" /> Analyzing</span>}
                {stageState === 'pending' && <span className="badge badge-secondary">Standby</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Code Block Style Logs Drawer */}
      {showLogs && (
        <div className="agent-logs-drawer">
          <div className="agent-logs-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Terminal size={13} />
                <strong>Agent Execution Stream & Grounding Telemetry</strong>
              </div>

              {/* Filter Tabs */}
              <div className="log-filter-chips">
                <button
                  type="button"
                  className={`log-filter-chip ${logFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setLogFilter('all')}
                >
                  All ({logs.length})
                </button>
                <button
                  type="button"
                  className={`log-filter-chip ${logFilter === 'agent' ? 'active' : ''}`}
                  onClick={() => setLogFilter('agent')}
                >
                  Agents
                </button>
                <button
                  type="button"
                  className={`log-filter-chip ${logFilter === 'grounding' ? 'active' : ''}`}
                  onClick={() => setLogFilter('grounding')}
                >
                  Grounding
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={copyLogs}
                disabled={logs.length === 0}
                style={{ height: '1.625rem', fontSize: '0.75rem', padding: '0 0.5rem' }}
              >
                {isCopied ? <Check size={11} /> : <Copy size={11} />}
                <span>{isCopied ? 'Copied' : 'Copy Logs'}</span>
              </button>
              <span style={{ fontSize: '0.6875rem', color: '#a1a1aa' }}>{filteredLogs.length} entries</span>
            </div>
          </div>

          <div className="agent-logs-content">
            {filteredLogs.length === 0 ? (
              <div style={{ padding: '0.75rem 0', color: '#71717a' }}>
                No operations logged yet. Click &quot;Run Agent Research&quot; or select a target company to dispatch research agents.
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={index} className="agent-log-entry">
                  <span className="log-time">
                    {new Date(log.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                  <span className="log-agent">[{log.agent || 'Research Agent'}]</span>
                  <span className="log-msg">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
