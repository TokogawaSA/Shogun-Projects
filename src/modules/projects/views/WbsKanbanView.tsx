import React, { useState, useEffect } from 'react';
import { WbsNode } from '../../../types';
import { projectManagementService } from '../../../services/projectManagementService';
import { 
  GitBranch, 
  Kanban, 
  Plus, 
  Clock, 
  Bot, 
  ChevronRight, 
  ChevronDown,
  Layers
} from 'lucide-react';

export const WbsKanbanView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wbs' | 'kanban'>('wbs');
  const [nodes, setNodes] = useState<WbsNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ 'wbs-1': true, 'wbs-2': true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWbs();
  }, []);

  const loadWbs = async () => {
    setLoading(true);
    try {
      const data = await projectManagementService.getWbsItems();
      setNodes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Flatten nodes for Kanban view
  const getAllNodes = (items: WbsNode[]): WbsNode[] => {
    let result: WbsNode[] = [];
    items.forEach((item) => {
      result.push(item);
      if (item.children && item.children.length > 0) {
        result = result.concat(getAllNodes(item.children));
      }
    });
    return result;
  };

  const flatNodes = getAllNodes(nodes);

  const columns = [
    { key: 'todo', label: 'To Do', color: 'border-slate-600 bg-slate-900/40 text-slate-300' },
    { key: 'in_progress', label: 'In Progress', color: 'border-indigo-500 bg-indigo-950/30 text-indigo-300' },
    { key: 'review', label: 'Review & QA', color: 'border-amber-500 bg-amber-950/30 text-amber-300' },
    { key: 'done', label: 'Completed', color: 'border-emerald-500 bg-emerald-950/30 text-emerald-300' },
  ];

  const renderWbsTree = (itemList: WbsNode[], depth = 0) => {
    return itemList.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes[node.id];

      return (
        <div key={node.id} className="space-y-2">
          <div
            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 ${
              depth === 0
                ? 'bg-slate-900/90 border-slate-700 shadow-sm hover:border-indigo-500/50'
                : 'bg-slate-950/70 border-slate-800/80 ml-6 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(node.id)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <div className="w-6" />
              )}
              <span className="font-mono text-xs font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/60">
                WBS {node.wbsCode}
              </span>
              <span className="text-sm font-semibold text-slate-100 truncate">{node.title}</span>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {node.assignedAgent && (
                <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-violet-950/60 text-violet-300 border border-violet-800/60">
                  <Bot className="w-3.5 h-3.5" />
                  {node.assignedAgent}
                </span>
              )}
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {node.actualHours || 0}h / {node.estimatedHours || 0}h
              </span>
              <span
                className={`text-[11px] font-medium uppercase px-2 py-0.5 rounded border ${
                  node.status === 'done'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                    : node.status === 'in_progress'
                    ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700'
                }`}
              >
                {node.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="space-y-2">{renderWbsTree(node.children!, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('wbs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'wbs'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            WBS Tree View
          </button>
          <button
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'kanban'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Kanban className="w-4 h-4" />
            Kanban Board
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            {flatNodes.length} Work Breakdown Items
          </span>
          <button className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all">
            <Plus className="w-4 h-4" />
            Add Work Item
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm font-mono animate-pulse">
          Loading Work Breakdown Structure...
        </div>
      ) : activeTab === 'wbs' ? (
        <div className="space-y-3">{renderWbsTree(nodes)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colItems = flatNodes.filter(
              (n) => n.status === col.key || (col.key === 'todo' && !['in_progress', 'review', 'done'].includes(n.status))
            );
            return (
              <div
                key={col.key}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col min-h-[500px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {colItems.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl space-y-2.5 shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-950/70 border border-indigo-800/50">
                          WBS {item.wbsCode}
                        </span>
                        {item.priority === 'urgent' && (
                          <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/50">
                            Urgent
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-slate-100">{item.title}</h4>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Bot className="w-3 h-3 text-violet-400" />
                          {item.assignedAgent || 'Unassigned'}
                        </span>
                        <span>{item.estimatedHours || 0}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
