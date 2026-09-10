import React, { useState } from 'react';
import { Plus, Clock, Loader2, CheckSquare, Square } from 'lucide-react';
import { formatVideoDuration } from '../../utils';

interface NoteEditorProps {
  currentPlaybackSeconds?: number;
  isSubmitting?: boolean;
  onSubmit: (content: string, timestampSeconds: number | null) => Promise<void>;
  onCancel?: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  currentPlaybackSeconds = 0,
  isSubmitting = false,
  onSubmit,
  onCancel,
}) => {
  const [content, setContent] = useState('');
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const capturedTimestamp =
    currentPlaybackSeconds > 0 ? Math.floor(currentPlaybackSeconds) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setErrorMsg(null);
      await onSubmit(
        content.trim(),
        includeTimestamp && capturedTimestamp > 0 ? capturedTimestamp : null
      );
      setContent('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save note';
      setErrorMsg(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-800 bg-gray-950/60 p-3.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-300">
          Add Note
        </label>
        {capturedTimestamp > 0 && (
          <button
            type="button"
            onClick={() => setIncludeTimestamp((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            {includeTimestamp ? (
              <CheckSquare className="h-3.5 w-3.5 text-red-400" />
            ) : (
              <Square className="h-3.5 w-3.5 text-gray-500" />
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-red-400" />
              Capture timestamp ({formatVideoDuration(capturedTimestamp)})
            </span>
          </button>
        )}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={5000}
        placeholder="Write a note about this moment..."
        className="w-full rounded-lg border border-gray-800 bg-gray-900/60 p-2.5 text-xs text-gray-200 placeholder-gray-500 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50"
      />

      {errorMsg && (
        <div className="text-xs text-red-400 font-medium">{errorMsg}</div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-gray-500">
          {content.length} / 5000
        </span>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-600/20 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            <span>Save Note</span>
          </button>
        </div>
      </div>
    </form>
  );
};
