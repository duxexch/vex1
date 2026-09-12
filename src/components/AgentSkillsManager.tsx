import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Download, FolderOpen, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';

interface SkillFile {
  filename: string;
  size: number;
  modified: string;
}

interface AgentSkillsManagerProps {
  lang: Language;
  onCopyToast: (msg: string) => void;
}

export const AgentSkillsManager: React.FC<AgentSkillsManagerProps> = ({ lang, onCopyToast }) => {
  const [skills, setSkills] = useState<SkillFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const labels = {
    ar: { title: 'ملفات مهارات الوكلاء', upload: 'رفع ملف', agent: 'معرف الوكيل', file: 'اختر ملف', noFiles: 'لا توجد ملفات بعد', delete: 'حذف', download: 'تحميل', uploading: 'جاري الرفع...', success: 'تم الرفع بنجاح', deleted: 'تم الحذف' },
    en: { title: 'Agent Skill Files', upload: 'Upload File', agent: 'Agent ID', file: 'Choose file', noFiles: 'No files yet', delete: 'Delete', download: 'Download', uploading: 'Uploading...', success: 'Uploaded successfully', deleted: 'Deleted' },
  };
  const t = labels[lang] || labels['ar'];

  const loadSkills = async () => {
    try {
      const res = await fetch('/api/agent-skills');
      const data = await res.json();
      if (data.success) setSkills(data.skills);
    } catch {}
  };

  useEffect(() => { loadSkills(); }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('agentId', agentId || 'general');
      const res = await fetch('/api/agent-skills', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        onCopyToast(t.success);
        setSelectedFile(null);
        setAgentId('');
        loadSkills();
      }
    } catch { onCopyToast('Error'); }
    setUploading(false);
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) return;
    try {
      await fetch(`/api/agent-skills/${filename}`, { method: 'DELETE' });
      onCopyToast(t.deleted);
      loadSkills();
    } catch {}
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <FolderOpen className="w-4 h-4 text-emerald-600" />
        <h4 className="text-sm font-bold text-slate-800">{t.title}</h4>
      </div>

      {/* Upload Section */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t.agent}
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
          <label className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>{selectedFile ? selectedFile.name : t.file}</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept=".txt,.pdf,.doc,.docx,.md,.json,.csv,.xlsx"
            />
          </label>
        </div>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {uploading ? (
            <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t.uploading}</span>
          ) : (
            <span className="flex items-center gap-2"><Upload className="w-3.5 h-3.5" /> {t.upload}</span>
          )}
        </button>
      </div>

      {/* Files List */}
      <div className="space-y-2">
        {skills.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">{t.noFiles}</p>
        ) : skills.map((skill) => (
          <div key={skill.filename} className="flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">{skill.filename}</p>
                <p className="text-[10px] text-slate-400">{formatSize(skill.size)} · {new Date(skill.modified).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={`/api/agent-skills/download/${skill.filename}`}
                className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                title={t.download}
              >
                <Download className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => handleDelete(skill.filename)}
                className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer"
                title={t.delete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
