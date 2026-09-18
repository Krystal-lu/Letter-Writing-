import React, { useState } from 'react';
import { Copy, Check, RotateCcw, Sparkles, Send, Edit3, MessageSquareQuote } from 'lucide-react';
import { QuickRewriteOption, Tone, Length } from '../types.js';

interface LetterDisplayProps {
  letter: string;
  tone: Tone;
  length: Length;
  contextSummary?: string;
  onRewrite: (option?: QuickRewriteOption, customInstruction?: string) => void;
  isRewriting: boolean;
  onStartNew: () => void;
}

const QUICK_REWRITES: { id: QuickRewriteOption; label: string; desc: string }[] = [
  { id: 'Softer', label: 'Softer', desc: 'Gentler language and tone' },
  { id: 'More direct', label: 'More direct', desc: 'Straight to the point' },
  { id: 'More casual', label: 'More casual', desc: 'Like a casual text' },
  { id: 'Shorter', label: 'Shorter', desc: 'Tighter and more concise' },
  { id: 'More emotional', label: 'More emotional', desc: 'More feeling without being dramatic' },
];

export const LetterDisplay: React.FC<LetterDisplayProps> = ({
  letter,
  tone,
  length,
  contextSummary,
  onRewrite,
  isRewriting,
  onStartNew,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCustomRewrite, setShowCustomRewrite] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const [isEditingManually, setIsEditingManually] = useState(false);
  const [editableLetter, setEditableLetter] = useState(letter);

  // Keep editable letter in sync if letter prop updates from AI rewrite
  React.useEffect(() => {
    setEditableLetter(letter);
  }, [letter]);

  const handleCopy = async () => {
    try {
      const textToCopy = isEditingManually ? editableLetter : letter;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleCustomRewriteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInstruction.trim() || isRewriting) return;
    onRewrite(undefined, customInstruction.trim());
    setCustomInstruction('');
    setShowCustomRewrite(false);
  };

  const wordCount = (isEditingManually ? editableLetter : letter)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div id="letter-display-container" className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone-200/60 font-medium text-stone-700">
            {tone}
          </span>
          <span>•</span>
          <span>{length} length</span>
          <span>•</span>
          <span>{wordCount} words</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="edit-manually-toggle-button"
            type="button"
            onClick={() => setIsEditingManually(!isEditingManually)}
            className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 px-2 py-1 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingManually ? 'View original' : 'Tweak text'}</span>
          </button>

          <button
            id="copy-letter-button"
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50 hover:border-stone-400'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span id="copied-label">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Letter Card */}
      <div
        id="generated-letter-card"
        className="relative bg-white rounded-2xl p-6 sm:p-8 border border-amber-900/10 shadow-sm transition-all"
      >
        {isRewriting && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center z-10">
            <div className="flex items-center gap-2 text-[#C06C47] text-sm font-medium animate-pulse">
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Rewriting with your adjustments...</span>
            </div>
          </div>
        )}

        {isEditingManually ? (
          <textarea
            id="editable-letter-textarea"
            value={editableLetter}
            onChange={(e) => setEditableLetter(e.target.value)}
            rows={Math.max(6, editableLetter.split('\n').length + 2)}
            className="w-full font-serif text-base sm:text-lg text-stone-800 leading-relaxed bg-transparent border-0 focus:ring-0 focus:outline-none resize-y p-0"
            placeholder="Edit your letter directly here..."
          />
        ) : (
          <div
            id="letter-content-text"
            className="font-serif text-base sm:text-lg text-stone-800 leading-relaxed whitespace-pre-wrap selection:bg-amber-100"
          >
            {letter}
          </div>
        )}
      </div>

      {/* Rewrite Section */}
      <div
        id="rewrite-controls-section"
        className="bg-stone-50/80 rounded-xl p-4 border border-stone-200/80 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <RotateCcw className="w-3.5 h-3.5 text-[#C06C47]" />
            <span>Rewrite Options</span>
          </div>
          <span className="text-xs text-stone-600">
            Preserves facts and user meaning; adjusts phrasing only.
          </span>
        </div>

        {/* Quick rewrite buttons */}
        <div className="flex flex-wrap gap-2">
          {QUICK_REWRITES.map((opt) => (
            <button
              key={opt.id}
              id={`quick-rewrite-${opt.id.toLowerCase().replace(/\s+/g, '-')}`}
              type="button"
              disabled={isRewriting}
              onClick={() => onRewrite(opt.id)}
              className="px-3 py-1.5 rounded-lg border border-stone-300/80 bg-white text-xs font-medium text-stone-700 hover:border-[#C06C47] hover:text-[#C06C47] hover:bg-amber-50/30 transition-all cursor-pointer disabled:opacity-50"
              title={opt.desc}
            >
              {opt.label}
            </button>
          ))}

          <button
            id="custom-rewrite-toggle-button"
            type="button"
            disabled={isRewriting}
            onClick={() => setShowCustomRewrite(!showCustomRewrite)}
            className="px-3 py-1.5 rounded-lg border border-dashed border-stone-300 bg-white/60 text-xs font-medium text-stone-600 hover:border-stone-400 hover:text-stone-800 transition-all cursor-pointer disabled:opacity-50"
          >
            {showCustomRewrite ? 'Hide custom' : 'Custom tweak...'}
          </button>
        </div>

        {/* Custom instruction form */}
        {showCustomRewrite && (
          <form onSubmit={handleCustomRewriteSubmit} className="pt-2 flex items-center gap-2">
            <input
              id="custom-rewrite-input"
              type="text"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="e.g. Make the opening gentler, or keep it under 3 sentences..."
              disabled={isRewriting}
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C06C47]/40"
            />
            <button
              id="submit-custom-rewrite-button"
              type="submit"
              disabled={!customInstruction.trim() || isRewriting}
              className="px-3.5 py-2 rounded-lg bg-stone-800 text-white text-xs font-medium hover:bg-stone-900 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Apply
            </button>
          </form>
        )}
      </div>

      {/* Start new letter action */}
      <div className="flex items-center justify-between pt-2">
        <button
          id="start-new-letter-button"
          type="button"
          onClick={onStartNew}
          className="text-xs text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
        >
          ← Write another letter
        </button>

        <span className="text-xs text-stone-600">
          Ready to send via text, email, or handwritten note.
        </span>
      </div>
    </div>
  );
};
