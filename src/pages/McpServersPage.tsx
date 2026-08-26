import React from 'react';
import { Cpu, Code, CheckCircle } from 'lucide-react';

export const McpServersPage: React.FC = () => {
  const tools = [
    { name: 'postgres_execute_query', desc: 'Runs parameter-sanitized SQL operations against the primary database.' },
    { name: 'postgres_list_tables', desc: 'Inspects relational schemas, foreign keys, and indexes.' },
    { name: 'rest_dispatch_webhook', desc: 'Triggers outbound automated notifications and webhook delivery.' },
    { name: 'action_scheduler_enqueue', desc: 'Schedules background async pipelines and task workflows.' },
    { name: 'system_health_diagnostics', desc: 'Validates API endpoints, token policies, and server resource metrics.' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h3 className="text-xl font-bold text-slate-100 tracking-tight">Model Context Protocol (MCP) Management</h3>
        <p className="text-xs text-slate-400">Direct administrative access and tool integration for Antigravity AI agents</p>
      </div>

      {/* MCP Configuration Card */}
      <div className="glass-panel p-6 rounded-xl border border-slate-700 bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-100">antigravity-mcp-server</h4>
              <p className="text-xs text-slate-400">Active server defined in <code className="text-indigo-600 font-semibold">.agents/mcp_config.json</code></p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Installed & Connected
          </span>
        </div>

        <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 font-mono text-xs text-slate-100">
          <pre className="overflow-x-auto text-indigo-700 font-medium">
{`{
  "mcpServers": {
    "antigravity-core": {
      "command": "node",
      "args": ["server/dist/index.js", "--mcp"]
    }
  }
}`}
          </pre>
        </div>
      </div>

      {/* Exposed Tools Matrix */}
      <div className="glass-panel p-6 rounded-xl border border-slate-700 bg-slate-900 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-slate-100">Programmatic Capabilities & Exposed Toolsets</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <div key={tool.name} className="p-4 rounded-lg bg-slate-800/60 border border-slate-700 space-y-1.5 hover:border-indigo-300 transition">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-mono font-bold text-indigo-700">{tool.name}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{tool.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default McpServersPage;
