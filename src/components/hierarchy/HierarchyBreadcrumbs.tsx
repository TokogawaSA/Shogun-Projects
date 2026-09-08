import React from 'react';
import { ChevronRight, Layers, Folder, ListFilter } from 'lucide-react';
import { useHierarchy } from '../../context/HierarchyContext';

export const HierarchyBreadcrumbs: React.FC = () => {
  const { breadcrumbs, activeScope, selectEverything, selectSpace, selectFolder } =
    useHierarchy();

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3.5 py-2 rounded-xl backdrop-blur-md overflow-x-auto custom-scrollbar">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;

        return (
          <React.Fragment key={`${crumb.level}-${crumb.id}-${idx}`}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />}

            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition font-medium cursor-pointer ${
                isLast
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'hover:bg-slate-800/60 hover:text-slate-200'
              }`}
              onClick={() => {
                if (crumb.level === 'workspace') selectEverything();
                else if (crumb.level === 'space') selectSpace(crumb.id);
                else if (crumb.level === 'folder' && activeScope.spaceId) {
                  selectFolder(activeScope.spaceId, crumb.id);
                }
              }}
            >
              {crumb.level === 'workspace' && <Layers className="w-3.5 h-3.5 text-indigo-400" />}
              {crumb.level === 'space' && (
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: crumb.colorHex || '#6366f1' }}
                />
              )}
              {crumb.level === 'folder' && <Folder className="w-3.5 h-3.5 text-purple-400" />}
              {crumb.level === 'list' && <ListFilter className="w-3.5 h-3.5 text-blue-400" />}

              <span className="truncate max-w-[140px] sm:max-w-[200px]">{crumb.name}</span>
            </div>
          </React.Fragment>
        );
      })}

      <div className="ml-auto hidden md:flex items-center gap-2 text-[11px] text-slate-500 font-mono">
        <span>Scope:</span>
        <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 font-semibold uppercase">
          {activeScope.level}
        </span>
      </div>
    </nav>
  );
};
