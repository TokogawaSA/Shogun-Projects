import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

export const ConditionNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  const rulesCount = Array.isArray(data.rules) ? data.rules.length : 0;
  const operator = data.logicalOperator || 'AND';

  return (
    <div
      className={`rounded-xl border-2 bg-slate-900/90 backdrop-blur-md p-3.5 shadow-xl min-w-[240px] transition-all relative ${
        selected
          ? 'border-indigo-400 ring-2 ring-indigo-400/30 shadow-indigo-500/20'
          : 'border-indigo-500/60 hover:border-indigo-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3.5 h-3.5 !bg-indigo-500 border-2 border-slate-900 rounded-full shadow-md"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <div className="p-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
            <GitBranch size={14} className="text-indigo-400" />
          </div>
          <span>Decision Gateway</span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-[9px] font-bold">
          {operator}
        </span>
      </div>

      <div className="mt-2 text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800 font-mono">
        {data.description || `${rulesCount} predicate rule(s) evaluated`}
      </div>

      {Array.isArray(data.rules) && data.rules.length > 0 && (
        <div className="mt-1.5 space-y-1">
          {data.rules.slice(0, 2).map((rule: any, idx: number) => (
            <div key={idx} className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
              <span className="text-slate-300 font-semibold truncate max-w-[100px]">{rule.field}</span>
              <span className="text-indigo-300">{rule.operator}</span>
              <span className="text-amber-300 font-bold truncate max-w-[80px]">{String(rule.value)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-3 text-[10px] font-bold tracking-wider pt-2 border-t border-slate-800">
        <span className="text-emerald-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          TRUE
        </span>
        <span className="text-rose-400 flex items-center gap-1">
          FALSE
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '25%' }}
        className="w-3.5 h-3.5 !bg-emerald-500 border-2 border-slate-900 rounded-full shadow-md"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '75%' }}
        className="w-3.5 h-3.5 !bg-rose-500 border-2 border-slate-900 rounded-full shadow-md"
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
export default ConditionNode;
