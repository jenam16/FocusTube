import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Bot,
  User,
} from 'lucide-react';
import { getAIContext, sendAIChat } from '../../services/aiService';
import { AIChatMessage, AIContextData } from '../../types/ai';

interface FocusAIPopoverProps {
  className?: string;
}

const QUICK_PROMPTS = [
  'What should I study next?',
  'Give me a 15-minute study strategy',
  'Explain the core concept in simple terms',
];

export const FocusAIPopover: React.FC<FocusAIPopoverProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState<AIContextData | null>(null);
  const [contextLoading, setContextLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const popoverRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract active course and video IDs from URL if present
  const watchMatch = location.pathname.match(/\/watch\/([^/]+)\/([^/]+)/);
  const courseMatch = location.pathname.match(/\/courses\/([^/]+)/);
  const currentCourseId = watchMatch ? watchMatch[1] : (courseMatch ? courseMatch[1] : undefined);
  const currentVideoId = watchMatch ? watchMatch[2] : undefined;

  // Load context insight when popover opens or route changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchContext = async () => {
      try {
        setContextLoading(true);
        const data = await getAIContext(currentCourseId, currentVideoId);
        if (isMounted) {
          setContextData(data);
        }
      } catch (err) {
        console.error('Failed to fetch AI context:', err);
      } finally {
        if (isMounted) {
          setContextLoading(false);
        }
      }
    };

    fetchContext();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentCourseId, currentVideoId]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: "Hi! I'm Focus AI, your study companion. Ask me any concept questions, study planning tips, or how to break down complex topics.",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle outside click & Esc key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        launcherRef.current &&
        !launcherRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputValue).trim();
    if (!messageText || loading) return;

    const userMessage: AIChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
        text: m.text,
      }));

      const res = await sendAIChat({
        message: messageText,
        courseId: currentCourseId,
        videoId: currentVideoId,
        history: historyPayload,
      });

      const aiMessage: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: res.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Focus AI error:', err);
      const errorMessage: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: err?.message || 'Focus AI is temporarily unavailable. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        text: "Chat cleared! How can I assist your learning right now?",
        timestamp: new Date(),
      },
    ]);
  };

  const handleContinueLesson = (courseId: string, videoId: string) => {
    setIsOpen(false);
    navigate(`/watch/${courseId}/${videoId}`);
  };

  // Helper to render basic markdown nicely
  const formatMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Headers ###
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-xs font-bold text-indigo-300 mt-2 mb-1">
            {trimmed.replace('### ', '')}
          </h4>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-xs font-bold text-indigo-200 mt-2 mb-1">
            {trimmed.replace('## ', '')}
          </h3>
        );
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const bulletText = trimmed.replace(/^[-*]\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5 text-slate-300 text-xs leading-relaxed">
            <span className="text-indigo-400 mt-0.5 text-[10px]">•</span>
            <span>{renderFormattedInline(bulletText)}</span>
          </div>
        );
      }

      // Numbered list
      if (/^\d+\.\s/.test(trimmed)) {
        const listText = trimmed.replace(/^\d+\.\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5 text-slate-300 text-xs leading-relaxed">
            <span className="text-indigo-400 font-semibold text-[11px] min-w-[14px]">
              {trimmed.match(/^\d+\./)?.[0]}
            </span>
            <span>{renderFormattedInline(listText)}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-xs leading-relaxed text-slate-300 my-0.5">
          {renderFormattedInline(line)}
        </p>
      );
    });
  };

  // Inline formatting helper for **bold** and `code`
  const renderFormattedInline = (text: string) => {
    // Split by bold (**text**) and code (`code`)
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="rounded bg-slate-800/90 px-1 py-0.5 text-[11px] font-mono text-indigo-300 border border-slate-700/60"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      {/* Floating Popover Container */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Focus AI Assistant"
          className="absolute bottom-16 right-0 mb-2 w-84 sm:w-[380px] max-w-[calc(100vw-2rem)] h-[510px] max-h-[calc(100vh-6.5rem)] rounded-2xl bg-[#0B1120]/95 backdrop-blur-xl border border-white/[0.12] shadow-2xl shadow-indigo-950/50 flex flex-col overflow-hidden text-slate-200 transition-all duration-200 animate-in fade-in slide-in-from-bottom-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-wide">Focus AI</span>
                  <span className="rounded-full bg-indigo-500/15 px-1.5 py-0.2 text-[9px] font-semibold text-indigo-300 border border-indigo-500/30">
                    Assistant
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Your learning companion</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Clear Chat"
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Context Insight Banner */}
          {contextData && (
            <div className="border-b border-white/[0.06] bg-indigo-950/25 px-3.5 py-2.5">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 rounded-md bg-indigo-500/20 p-1 text-indigo-400 shrink-0">
                  <BookOpen className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-indigo-200/90 leading-snug">
                    {contextLoading ? 'Analyzing learning context...' : contextData.insight}
                  </p>
                  {contextData.courseId && contextData.nextVideoId && (
                    <button
                      type="button"
                      onClick={() =>
                        handleContinueLesson(
                          contextData.courseId!,
                          contextData.nextVideoId!
                        )
                      }
                      className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-medium text-indigo-200 transition-colors"
                    >
                      <span>Continue Learning</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="h-6 w-6 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-xs shadow-md shadow-indigo-600/20'
                        : 'bg-slate-900/80 border border-white/[0.08] text-slate-200 rounded-bl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    ) : (
                      formatMarkdown(msg.text)
                    )}
                  </div>

                  {isUser && (
                    <div className="h-6 w-6 rounded-md bg-slate-800 border border-white/[0.08] flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="h-6 w-6 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-xl rounded-bl-xs bg-slate-900/80 border border-white/[0.08] px-3 py-2 text-xs text-slate-400 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  <span>Focus AI is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-1.5 border-t border-white/[0.04] bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="shrink-0 rounded-full border border-white/[0.08] bg-slate-800/60 hover:bg-slate-800 hover:border-indigo-500/40 px-2.5 py-1 text-[10px] text-slate-300 transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 border-t border-white/[0.08] bg-slate-950/70">
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.12] bg-slate-900/90 px-3 py-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDownInput}
                placeholder="Ask Focus AI anything..."
                disabled={loading}
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || loading}
                aria-label="Send message"
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[9px] text-center text-slate-400">
              Focus AI assists your learning • Read-only companion
            </p>
          </div>
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close Focus AI' : 'Open Focus AI'}
        className={`group relative flex items-center justify-center h-12 w-12 rounded-2xl shadow-xl transition-all duration-200 ${
          isOpen
            ? 'bg-slate-800 text-white border border-white/20 scale-95 shadow-slate-900/50'
            : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-indigo-600/40 hover:scale-105 hover:shadow-indigo-500/60'
        }`}
      >
        {isOpen ? (
          <X className="h-5 w-5 transition-transform group-hover:rotate-90 duration-200" />
        ) : (
          <>
            <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110 duration-200" />
            {/* Subtle glow beacon */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500 border-2 border-[#0B1120]" />
            </span>
          </>
        )}
      </button>
    </div>
  );
};
