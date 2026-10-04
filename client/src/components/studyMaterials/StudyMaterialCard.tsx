import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Book,
  Globe,
  ExternalLink,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { StudyMaterial } from '../../types';

interface StudyMaterialCardProps {
  material: StudyMaterial;
  onEdit: (material: StudyMaterial) => void;
  onDelete: (material: StudyMaterial) => void;
}

export const StudyMaterialCard: React.FC<StudyMaterialCardProps> = ({
  material,
  onEdit,
  onDelete,
}) => {
  const getFileTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return {
          icon: FileText,
          label: 'PDF',
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        };
      case 'doc':
      case 'docx':
        return {
          icon: FileText,
          label: 'DOC',
          bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        };
      case 'sheet':
      case 'xls':
      case 'xlsx':
        return {
          icon: FileSpreadsheet,
          label: 'SHEET',
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        };
      case 'epub':
      case 'book':
        return {
          icon: Book,
          label: 'BOOK',
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        };
      default:
        return {
          icon: Globe,
          label: 'LINK',
          bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
        };
    }
  };

  const badge = getFileTypeBadge(material.fileType);
  const IconComponent = badge.icon;

  const formatHostname = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  const formattedDate = new Date(material.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-app bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-600/10">
      {/* Top Bar: Type Badge & Action Controls */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${badge.bg}`}
            >
              <IconComponent className="h-3.5 w-3.5" />
              <span>{badge.label}</span>
            </span>
            <span className="text-xs text-muted font-medium truncate max-w-[140px] sm:max-w-[180px]">
              · {formatHostname(material.originalUrl)}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onEdit(material)}
              className="rounded-lg p-1.5 text-muted hover:bg-surface-elevated hover:text-primary transition-colors cursor-pointer"
              title="Edit Resource"
              aria-label="Edit Resource"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(material)}
              className="rounded-lg p-1.5 text-muted hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
              title="Delete Resource"
              aria-label="Delete Resource"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Resource Name */}
        <div className="mt-4">
          <h3 className="line-clamp-2 text-base font-bold text-primary font-heading tracking-tight leading-snug group-hover:text-indigo-400 transition-colors">
            {material.name}
          </h3>
        </div>
      </div>

      {/* Bottom Section: Date & Open Resource */}
      <div className="mt-6 space-y-3.5 border-t border-subtle pt-3.5">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted" />
            <span>Added {formattedDate}</span>
          </span>
        </div>

        {/* Action Button: Open Resource */}
        <a
          href={material.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98]"
        >
          <span>Open Resource</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
};
