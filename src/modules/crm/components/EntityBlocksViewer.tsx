/**
 * Collapsible Blocks Viewer Component (VTiger-Style)
 * Iterates through BlockLayout definitions, rendering 2-column detail sections
 * with collapsible header toggles and DynamicFieldRenderer delegation.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { BlockLayout } from '../../../types/crmEntities';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';
import { getEntityFieldValue } from '../utils/customerSegment';

export interface EntityBlocksViewerProps {
  blocks: BlockLayout[];
  record: Record<string, any>;
  onUpdateField?: (fieldName: string, newValue: any) => Promise<boolean | void>;
  isReadOnly?: boolean;
  className?: string;
}

export const EntityBlocksViewer: React.FC<EntityBlocksViewerProps> = ({
  blocks,
  record,
  onUpdateField,
  isReadOnly = false,
  className = '',
}) => {
  // Track collapsed state for each block
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    blocks.forEach((b) => {
      if (b.isCollapsedByDefault) {
        initial[b.id] = true;
      }
    });
    return initial;
  });

  const toggleBlock = (blockId: string) => {
    setCollapsedBlocks((prev) => ({
      ...prev,
      [blockId]: !prev[blockId],
    }));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block) => {
        const isCollapsed = Boolean(collapsedBlocks[block.id]);
        const sortedFields = [...block.fields].sort((a, b) => a.sortOrder - b.sortOrder);

        // Group fields by column (column 1 vs column 2) or let textarea span full width
        const col1Fields = sortedFields.filter((f) => f.column === 1 && f.type !== 'textarea');
        const col2Fields = sortedFields.filter((f) => f.column === 2 && f.type !== 'textarea');
        const fullWidthFields = sortedFields.filter((f) => f.type === 'textarea');

        return (
          <div
            key={block.id}
            className="bg-slate-900/70 border border-slate-800/90 rounded-2xl overflow-hidden shadow-lg transition-all"
          >
            {/* Block Header */}
            <div
              onClick={() => block.isCollapsible && toggleBlock(block.id)}
              className={`flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800/80 select-none ${block.isCollapsible ? 'cursor-pointer hover:bg-slate-800/60' : ''
                }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  {block.label}
                </h3>
              </div>

              {block.isCollapsible && (
                <button
                  type="button"
                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            {/* Block Content (2-Column Grid) */}
            {!isCollapsed && (
              <div className="p-5 space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  {/* Left Column (Col 1) */}
                  <div className="space-y-3">
                    {col1Fields.map((field) => (
                      <DynamicFieldRenderer
                        key={field.name}
                        field={field}
                        value={getEntityFieldValue(record, field.name)}
                        record={record}
                        onUpdate={onUpdateField}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </div>

                  {/* Right Column (Col 2) */}
                  <div className="space-y-3">
                    {col2Fields.map((field) => (
                      <DynamicFieldRenderer
                        key={field.name}
                        field={field}
                        value={getEntityFieldValue(record, field.name)}
                        record={record}
                        onUpdate={onUpdateField}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </div>
                </div>

                {/* Full Width Textarea Fields */}
                {fullWidthFields.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/60 space-y-3">
                    {fullWidthFields.map((field) => (
                      <DynamicFieldRenderer
                        key={field.name}
                        field={field}
                        value={getEntityFieldValue(record, field.name)}
                        record={record}
                        onUpdate={onUpdateField}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EntityBlocksViewer;
