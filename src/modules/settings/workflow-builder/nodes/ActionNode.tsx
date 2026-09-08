import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail, CheckSquare, RefreshCw, Globe, PlusCircle } from 'lucide-react';

export const ActionNode = memo(({ data, type, selected }: { data: any; type: string; selected?: boolean }) => {
  const getTheme = () => {
    switch (type) {
      case 'action_send_email':
        return {
          border: 'border-sky-500/60 hover:border-sky-400',
          selectedBorder: 'border-sky-400 ring-2 ring-sky-400/30 shadow-sky-500/20',
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          icon: <Mail size={14} className="text-sky-400" />,
          title: 'Send Email',
          subtitle: data.to || data.recipientField || 'Recipient email',
        };
      case 'action_create_task':
        return {
          border: 'border-emerald-500/60 hover:border-emerald-400',
          selectedBorder: 'border-emerald-400 ring-2 ring-emerald-400/30 shadow-emerald-500/20',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: <CheckSquare size={14} className="text-emerald-400" />,
          title: 'Create Task',
          subtitle: data.taskTitle || data.title || 'Task title',
        };
      case 'action_update_field':
        return {
          border: 'border-purple-500/60 hover:border-purple-400',
          selectedBorder: 'border-purple-400 ring-2 ring-purple-400/30 shadow-purple-500/20',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          icon: <RefreshCw size={14} className="text-purple-400" />,
          title: 'Update Field',
          subtitle: `${data.targetField || 'Field'} ➔ ${data.newValue || 'Val'}`,
        };
      case 'action_call_webhook':
        return {
          border: 'border-indigo-500/60 hover:border-indigo-400',
          selectedBorder: 'border-indigo-400 ring-2 ring-indigo-400/30 shadow-indigo-500/20',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          icon: <Globe size={14} className="text-indigo-400" />,
          title: 'Call Webhook',
          subtitle: data.url || 'https://api.service/endpoint',
        };
      case 'action_create_record':
      default:
        return {
          border: 'border-emerald-500/60 hover:border-emerald-400',
          selectedBorder: 'border-emerald-400 ring-2 ring-emerald-400/30 shadow-emerald-500/20',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: <PlusCircle size={14} className="text-emerald-400" />,
          title: 'Create Record',
          subtitle: `Module: ${data.targetModule || 'projects'}`,
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      className={`rounded-xl border-2 bg-slate-900/90 backdrop-blur-md p-3.5 shadow-xl min-w-[220px] transition-all ${
        selected ? theme.selectedBorder : theme.border
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3.5 h-3.5 !bg-slate-400 border-2 border-slate-900 rounded-full shadow-md"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-200">
          <div className="p-1 rounded-lg bg-slate-800 border border-slate-700">{theme.icon}</div>
          <span>{theme.title}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-md border font-mono text-[9px] font-bold ${theme.badge}`}>
          ACTION
        </span>
      </div>

      <div className="mt-2 text-xs font-semibold text-white tracking-tight truncate max-w-[200px]">
        {theme.subtitle}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3.5 h-3.5 !bg-slate-400 border-2 border-slate-900 rounded-full shadow-md"
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
export default ActionNode;
