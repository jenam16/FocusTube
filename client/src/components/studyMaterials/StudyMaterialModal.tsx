import React, { useState, useEffect } from 'react';
import { X, Loader2, Link as LinkIcon, BookMarked } from 'lucide-react';
import { StudyMaterial, CreateStudyMaterialPayload } from '../../types';

interface StudyMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStudyMaterialPayload) => Promise<void>;
  initialData?: StudyMaterial | null;
  isSubmitting?: boolean;
}

const inferFileType = (url: string): string => {
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.pdf')) return 'pdf';
  if (cleanUrl.endsWith('.doc') || cleanUrl.endsWith('.docx')) return 'doc';
  if (cleanUrl.endsWith('.epub')) return 'epub';
  if (cleanUrl.endsWith('.ppt') || cleanUrl.endsWith('.pptx')) return 'ppt';
  if (cleanUrl.endsWith('.xls') || cleanUrl.endsWith('.xlsx')) return 'sheet';
  return 'link';
};

export const StudyMaterialModal: React.FC<StudyMaterialModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const [name, setName] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setOriginalUrl(initialData.originalUrl);
    } else {
      setName('');
      setOriginalUrl('');
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedUrl = originalUrl.trim();

    if (!trimmedName) {
      setError('Please provide a name for this study resource.');
      return;
    }

    if (!trimmedUrl) {
      setError('Please provide the resource link.');
      return;
    }

    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setError('Please provide a valid URL starting with http:// or https://');
      return;
    }

    const fileType = initialData?.fileType || inferFileType(trimmedUrl);

    try {
      await onSubmit({
        name: trimmedName,
        originalUrl: trimmedUrl,
        fileType,
      });
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Failed to save study resource. Please try again.';
      setError(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-app bg-surface p-6 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BookMarked className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-primary font-heading">
                {initialData ? 'Edit Study Resource' : 'Add Study Resource'}
              </h2>
              <p className="text-xs text-secondary">
                Save useful external study links, documentation, or PDF resources.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-surface-elevated hover:text-primary transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Resource Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DBMS Unit 1 Notes"
              className="w-full rounded-xl border border-app bg-secondary px-3.5 py-2.5 text-xs sm:text-sm text-primary placeholder-muted focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Resource Link <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="url"
                required
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="Paste PDF or resource URL"
                className="w-full rounded-xl border border-app bg-secondary py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-primary placeholder-muted focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold text-secondary hover:text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{initialData ? 'Save Changes' : 'Save Resource'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
