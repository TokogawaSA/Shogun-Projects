import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';

export const DelayNode = memo(({ data, selected }: { data: any; selected?: boolean }) => {
  const duration = data.duration || 2;
  const unit = data.unit || 'days';

  return (
    <div
      className={`rounded-xl border-2 bg-slate-900/90 backdrop-blur-md p-3.5 shadow-xl min-w-[200px] transition-all ${
        selected
          ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-amber-500/20'
          : 'border-slate-700 hover:border-amber-500/60'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3.5 h-3.5 !bg-amber-500 border-2 border-slate-900 rounded-full shadow-md"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
          <div className="p-1 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <Clock size={14} className="text-amber-400" />
          </div>
          <span>Timer Delay</span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[9px] font-bold">
          WAIT
        </span>
      </div>

      <div className="mt-2 text-xs font-mono text-slate-300 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 text-center font-bold">
        Wait {duration} {unit}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3.5 h-3.5 !bg-amber-500 border-2 border-slate-900 rounded-full shadow-md"
      />
    </div>
  );
});

DelayNode.displayName = 'DelayNode';
export default DelayNode;
