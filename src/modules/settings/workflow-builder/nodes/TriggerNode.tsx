import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';

export const TriggerNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  return (
    <div
      className={`rounded-xl border-2 bg-slate-900/90 backdrop-blur-md p-3.5 shadow-xl min-w-[220px] transition-all ${
        selected
          ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-amber-500/20'
          : 'border-amber-500/60 hover:border-amber-400'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <div className="p-1 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <Zap size={14} className="text-amber-400 animate-pulse" />
          </div>
          <span>Trigger Block</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[9px] uppercase font-bold">
          {data.module || 'deals'}
        </span>
      </div>

      <div className="mt-2 text-sm font-bold text-white tracking-tight">
        {data.label || 'When Record Changes'}
      </div>

      <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 font-mono">
        <span className="text-amber-400 font-semibold">{data.module || 'deals'}</span>
        <span>.</span>
        <span className="text-slate-300">{data.event || 'on_stage_change'}</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3.5 h-3.5 !bg-amber-500 border-2 border-slate-900 rounded-full shadow-md"
      />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';
export default TriggerNode;
