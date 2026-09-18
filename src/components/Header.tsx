import React from 'react';
import { Feather, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header id="app-header" className="pt-8 pb-6 text-center max-w-2xl mx-auto px-4">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-[#A85834] text-xs font-medium mb-3">
        <Feather className="w-3.5 h-3.5 text-[#C06C47]" />
        <span>Personal Letter & Message Assistant</span>
      </div>

      <h1
        id="app-title"
        className="text-4xl sm:text-5xl font-normal font-serif tracking-tight text-stone-900 mb-2"
      >
        Letterly
      </h1>

      <p
        id="app-subtitle"
        className="text-base sm:text-lg text-stone-600 font-normal italic tracking-wide"
      >
        “Say what you mean, even when it’s hard.”
      </p>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-stone-600">
        <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
        <span>Private & natural. We express what you mean without inventing facts.</span>
      </div>
    </header>
  );
};
