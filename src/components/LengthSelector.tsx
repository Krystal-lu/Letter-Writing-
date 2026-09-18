import React from 'react';
import { Length } from '../types.js';

interface LengthSelectorProps {
  selectedLength: Length;
  onSelectLength: (length: Length) => void;
  disabled?: boolean;
}

const LENGTHS: { id: Length; label: string; hint: string }[] = [
  { id: 'Short', label: 'Short', hint: '2–5 sentences (text message)' },
  { id: 'Medium', label: 'Medium', hint: '1–3 short paragraphs (balanced)' },
  { id: 'Long', label: 'Long', hint: 'Fuller context & explanation' },
];

export const LengthSelector: React.FC<LengthSelectorProps> = ({
  selectedLength,
  onSelectLength,
  disabled = false,
}) => {
  return (
    <div id="length-selector" className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Length
        </label>
        <span className="text-xs text-stone-500 italic">
          {LENGTHS.find((l) => l.id === selectedLength)?.hint}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {LENGTHS.map((l) => {
          const isSelected = selectedLength === l.id;
          return (
            <button
              key={l.id}
              id={`length-option-${l.id.toLowerCase()}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectLength(l.id)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#C06C47]/30 ${
                isSelected
                  ? 'bg-stone-800 text-white border-stone-800 shadow-sm font-semibold'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-50/70'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
