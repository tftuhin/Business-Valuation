'use client';

import { useState } from 'react';
import {
  Activity, CheckCircle2, ChevronDown, ChevronUp, Cpu, Globe,
  Search, ShieldCheck, Sparkles, Terminal
} from 'lucide-react';

export default function AgentMonitor({ status = 'idle', logs = [], kbCount = 0, skillsCount = 0 }) {
  const [showLogs, setShowLogs] = useState(false);

  const stages = [
    { id: 1, name: 'Company Detective', desc: 'Public data & tech moat discovery', icon: Globe },
    { id: 2, name: 'Market Dynamics', desc: 'TAM, CAGR & competitive landscape', icon: Search },
    { id: 3, name: 'Deal Scout', desc: 'Precedent M&A transactions & multiples', icon: Activity },
    { id: 4, name: 'Valuation Engine', desc: 'Scenario modeling & equity bridge', icon: Cpu },
    { id: 5, name: 'Report Synthesizer', desc: 'Institutional brief generation', icon: Sparkles }
  ];

  const isRunning = status === 'running';
  const isDone = status === 'completed';

  return (
    <div className={`agent-monitor-panel ${isRunning ? 'is-active' : ''}`}>
      <div className="agent-monitor-header">
        <div className="agent-monitor-title">
          <span className="agent-pulse-icon">
            {isRunning ? <Cpu className="spin-slow" size={15} /> : <ShieldCheck size={15} />}
          </span>
          <div>
            <strong>Autonomous Multi-Agent Research Pipeline</strong>
            <small>
              <span>5 Specialist Agents Active</span>
              {kbCount > 0 && <span> · {kbCount} KB Docs</span>}
              {skillsCount > 0 && <span> · {skillsCount} Skills</span>}
              {isRunning && <span className="badge badge-warning" style={{ marginLeft: '0.375rem' }}>Research in Progress...</span>}
              {isDone && <span className="badge badge-success" style={{ marginLeft: '0.375rem' }}><CheckCircle2 size={11} /> Ready</span>}
            </small>
          </div>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowLogs(!showLogs)}
            title="Toggle Agent Activity Logs"
          >
            <Terminal size={13} />
            <span>Agent Logs ({logs.length})</span>
            {showLogs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* 5-Stage Agent Progress Pipeline */}
      <div className="agent-pipeline-grid">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          let stageState = 'pending';
          if (isDone) stageState = 'done';
          else if (isRunning) {
            stageState = idx <= 2 ? 'running' : 'pending';
          }

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
              <div>
                {stageState === 'done' && <span className="badge badge-success"><CheckCircle2 size={10} /> Ready</span>}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={13} />
              <span>Autonomous Agent Execution Stream & Google Search Grounding</span>
            </div>
            <span style={{ fontSize: '0.6875rem' }}>{logs.length} events logged</span>
          </div>
          <div className="agent-logs-content">
            {logs.length === 0 ? (
              <div style={{ padding: '0.5rem 0', color: '#71717a' }}>
                No operations logged yet. Click &quot;Run Agent Research&quot; to dispatch research agents.
              </div>
            ) : (
              logs.map((log, index) => (
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
