import React from 'react';
import { Cpu, Code, CheckCircle } from 'lucide-react';

export const McpServersPage: React.FC = () => {
  const tools = [
    { name: 'firebase_list_projects', desc: 'Lists accessible Firebase projects associated with the authenticated account.' },
    { name: 'firebase_get_sdk_config', desc: 'Retrieves client-side web SDK configuration for active apps.' },
    { name: 'firebase_init', desc: 'Initializes project configurations and local schema scaffolding.' },
    { name: 'firestore_generate_security_rules', desc: 'Generates and validates server-enforced security rules for Firestore.' },
    { name: 'firebase_deploy', desc: 'Publishes hosting builds, security rules, and cloud function triggers.' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">Model Context Protocol (MCP) Management</h3>
        <p className="text-xs text-slate-400">Direct administrative access and tool integration for Antigravity AI agents</p>
      </div>

      {/* MCP Configuration Card */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">firebase-mcp-server</h4>
              <p className="text-xs text-slate-400">Active server defined in <code className="text-indigo-400">.agents/mcp_config.json</code></p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" /> Installed & Connected
          </span>
        </div>

        <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300">
          <pre className="overflow-x-auto text-indigo-300">
{`{
  "mcpServers": {
    "firebase-mcp-server": {
      "command": "npx",
      "args": ["-y", "firebase-tools@latest", "mcp"]
    }
  }
}`}
          </pre>
        </div>
      </div>

      {/* Exposed Tools Matrix */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
        <h4 className="text-sm font-bold text-white">Programmatic Capabilities & Exposed Toolsets</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <div key={tool.name} className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1.5 hover:border-slate-700 transition">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-mono font-bold text-indigo-300">{tool.name}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{tool.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
