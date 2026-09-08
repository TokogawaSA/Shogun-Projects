import React, { useState, useEffect } from 'react';
import { ProjectDocumentItem, WikiPageItem } from '../../../types';
import { projectManagementService } from '../../../services/projectManagementService';
import { FileText, BookOpen, Download, Plus } from 'lucide-react';

export const CollaborationWikiView: React.FC = () => {
  const [documents, setDocuments] = useState<ProjectDocumentItem[]>([]);
  const [wikis, setWikis] = useState<WikiPageItem[]>([]);
  const [activeWiki, setActiveWiki] = useState<WikiPageItem | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docsData, wikisData] = await Promise.all([
        projectManagementService.getDocuments(),
        projectManagementService.getWikiPages(),
      ]);
      setDocuments(docsData);
      setWikis(wikisData);
      if (wikisData.length > 0) setActiveWiki(wikisData[0]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-600/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Team Collaboration, Document Sync & Project Wiki
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-violet-950/80 text-violet-300 border border-violet-800/60">
                Shared Workspace
              </span>
            </h3>
            <p className="text-xs text-slate-400">Task discussions, centralized document repository & collaborative drafting</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Document Repository */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" />
              Document Repository
            </h4>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {documents.length} Files
            </span>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-100 truncate">{doc.fileName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
                    v{doc.version}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Category: {doc.fileCategory}</span>
                  <button className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wiki Playbooks Sidebar & Live Draft Viewer */}
        <div className="col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Project Wiki & Documentation Pages
            </h4>
            <button className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all">
              <Plus className="w-3.5 h-3.5" /> + New Page
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              {wikis.map((wiki) => (
                <button
                  key={wiki.id}
                  onClick={() => setActiveWiki(wiki)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    activeWiki?.id === wiki.id
                      ? 'bg-purple-950/60 border-purple-700 text-purple-200 font-semibold'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <p className="truncate font-semibold">{wiki.title}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">Updated {wiki.updatedAt}</p>
                </button>
              ))}
            </div>

            <div className="col-span-2 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              {activeWiki ? (
                <>
                  <h3 className="text-sm font-bold text-slate-100">{activeWiki.title}</h3>
                  <div className="flex gap-1.5">
                    {activeWiki.tags?.map((t) => (
                      <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {activeWiki.contentMarkdown}
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-500 font-mono">Select a wiki page to view content...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
