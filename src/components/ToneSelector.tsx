import React from 'react';
import { Tone } from '../types.js';

interface ToneSelectorProps {
  selectedTone: Tone;
  onSelectTone: (tone: Tone) => void;
  disabled?: boolean;
}

const TONES: { id: Tone; label: string; description: string }[] = [
  { id: 'Calm', label: 'Calm', description: 'Balanced, neutral, and respectful' },
  { id: 'Warm', label: 'Warm', description: 'Softer wording with emphasis on connection' },
  { id: 'Honest', label: 'Honest', description: 'Direct but thoughtful, allows difficult feelings' },
  { id: 'Apologetic', label: 'Apologetic', description: 'Emphasizes regret without over-apologizing' },
  { id: 'Casual', label: 'Casual', description: 'Natural text message feel, simpler words' },
  { id: 'Direct', label: 'Direct', description: 'Concise, straightforward, less emotional' },
];

export const ToneSelector: React.FC<ToneSelectorProps> = ({
  selectedTone,
  onSelectTone,
  disabled = false,
}) => {
  return (
    <div id="tone-selector" className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Tone
        </label>
        <span className="text-xs text-stone-500 italic">
          {TONES.find((t) => t.id === selectedTone)?.description}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {TONES.map((t) => {
          const isSelected = selectedTone === t.id;
          return (
            <button
              key={t.id}
              id={`tone-option-${t.id.toLowerCase()}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectTone(t.id)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#C06C47]/30 ${
                isSelected
                  ? 'bg-[#C06C47] text-white border-[#C06C47] shadow-sm font-semibold'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-50/70'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
