import React, { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onToggle: () => Promise<void>;
  size?: 'sm' | 'md';
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  isBookmarked,
  onToggle,
  size = 'md',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      await onToggle();
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isSm = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this video'}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this video'}
      className={`inline-flex items-center gap-1.5 rounded-xl border transition-all ${
        isBookmarked
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 shadow-sm shadow-amber-500/15'
          : 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
      } ${
        isSm ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs font-semibold'
      }`}
    >
      {isLoading ? (
        <Loader2 className={`${isSm ? 'h-3 w-3' : 'h-3.5 w-3.5'} animate-spin`} />
      ) : (
        <Star
          className={`${isSm ? 'h-3 w-3' : 'h-3.5 w-3.5'} ${
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          }`}
        />
      )}
      <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
    </button>
  );
};
