import React, { useState, useRef } from 'react';
import {
  Paperclip,
  UploadCloud,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  File,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  X,
} from 'lucide-react';
import { TaskAttachment } from '../../../types';

interface TaskAttachmentsPanelProps {
  attachments: TaskAttachment[];
  onChange: (attachments: TaskAttachment[]) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export const TaskAttachmentsPanel: React.FC<TaskAttachmentsPanelProps> = ({
  attachments = [],
  onChange,
  readOnly = false,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<TaskAttachment | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, type: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
      return <ImageIcon className="w-5 h-5 text-purple-400" />;
    }
    if (['pdf'].includes(ext)) {
      return <FileText className="w-5 h-5 text-rose-400" />;
    }
    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    }
    if (['json', 'ts', 'tsx', 'js', 'jsx', 'py', 'sql', 'html', 'css', 'yaml', 'yml'].includes(ext)) {
      return <FileCode className="w-5 h-5 text-cyan-400" />;
    }
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return <FileArchive className="w-5 h-5 text-amber-400" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: TaskAttachment[] = [];
    Array.from(files).forEach((file) => {
      let url: string | undefined = undefined;
      try {
        url = URL.createObjectURL(file);
      } catch {
        url = undefined;
      }

      newAttachments.push({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url,
        uploadedBy: 'Current User',
        uploadedAt: new Date().toISOString(),
      });
    });

    onChange([...attachments, ...newAttachments]);
    setUploadMessage(`Successfully attached ${newAttachments.length} file(s).`);
    setTimeout(() => setUploadMessage(null), 3000);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (readOnly) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Upload Message Banner */}
      {uploadMessage && (
        <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* Drag and Drop Zone */}
      {!readOnly && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            multiple
            className="hidden"
          />

          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all shadow-sm">
            <UploadCloud className="w-5 h-5" />
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-200">
              <span className="text-indigo-400 hover:underline">Click to upload</span> or drag and drop files
            </p>
            <p className="text-[11px] text-slate-500">
              PNG, JPG, PDF, DOCX, XLSX, ZIP, JSON or code files up to 25MB
            </p>
          </div>
        </div>
      )}

      {/* Attachments List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
            Uploaded Documents & Assets ({attachments.length})
          </span>
          {attachments.length > 0 && !readOnly && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Remove all attachments from this task?')) {
                  onChange([]);
                }
              }}
              className="text-[11px] text-rose-400 hover:text-rose-300 transition"
            >
              Clear All
            </button>
          )}
        </div>

        {attachments.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-800/80 bg-slate-950/30 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <Paperclip className="w-6 h-6 text-slate-600" />
            <span>No files attached yet. Drag files above or click to browse.</span>
          </div>
        ) : (
          <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {attachments.map((att) => {
              const isImg = att.type.startsWith('image/') && att.url;
              return (
                <div
                  key={att.id}
                  className="group relative flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Icon or Thumbnail */}
                    {isImg ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewFile(att);
                        }}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex-shrink-0 cursor-pointer group-hover:ring-1 group-hover:ring-indigo-500/50"
                      >
                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
                        {getFileIcon(att.name, att.type)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs font-medium text-slate-200 truncate cursor-pointer hover:text-indigo-300"
                        title={att.name}
                        onClick={() => {
                          if (att.url) setPreviewFile(att);
                        }}
                      >
                        {att.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span>{formatFileSize(att.size)}</span>
                        <span>•</span>
                        <span>{new Date(att.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 flex-shrink-0 ml-2">
                    {att.url && (
                      <button
                        type="button"
                        onClick={() => setPreviewFile(att)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition"
                        title="Preview Asset"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {att.url && (
                      <a
                        href={att.url}
                        download={att.name}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition"
                        title="Download Asset"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDelete(att.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Remove Attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(previewFile.name, previewFile.type)}
                <span className="text-xs font-semibold text-slate-200 truncate">{previewFile.name}</span>
                <span className="text-[10px] font-mono text-slate-500">({formatFileSize(previewFile.size)})</span>
              </div>
              <div className="flex items-center gap-2">
                {previewFile.url && (
                  <a
                    href={previewFile.url}
                    download={previewFile.name}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-auto flex items-center justify-center bg-slate-950/60">
              {previewFile.type.startsWith('image/') && previewFile.url ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-lg"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-indigo-400">
                    {getFileIcon(previewFile.name, previewFile.type)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{previewFile.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      File format ({previewFile.type || 'binary'}) preview is available for download.
                    </p>
                  </div>
                  {previewFile.url && (
                    <a
                      href={previewFile.url}
                      download={previewFile.name}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
                    >
                      <Download className="w-4 h-4" />
                      Download File
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskAttachmentsPanel;
