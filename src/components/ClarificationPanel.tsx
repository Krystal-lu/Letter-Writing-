import React, { useState } from 'react';
import { HelpCircle, ArrowRight, CornerDownRight, Sparkles } from 'lucide-react';

interface ClarificationPanelProps {
  questions: string[];
  onSubmitAnswers: (answersSummary: string) => void;
  onOptOut: (reason?: string) => void;
  isLoading: boolean;
}

export const ClarificationPanel: React.FC<ClarificationPanelProps> = ({
  questions,
  onSubmitAnswers,
  onOptOut,
  isLoading,
}) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [extraNote, setExtraNote] = useState('');

  const handleAnswerChange = (index: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [index]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const answeredParts: string[] = [];
    questions.forEach((q, idx) => {
      const a = answers[idx]?.trim();
      if (a) {
        answeredParts.push(`Q: ${q}\nA: ${a}`);
      }
    });

    if (extraNote.trim()) {
      answeredParts.push(`Additional note: ${extraNote.trim()}`);
    }

    if (answeredParts.length === 0) {
      onOptOut("Just help me write something with what I provided.");
      return;
    }

    onSubmitAnswers(answeredParts.join('\n\n'));
  };

  return (
    <div
      id="clarification-panel"
      className="bg-stone-50/90 rounded-2xl p-5 sm:p-6 border border-amber-200/70 shadow-sm space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-100/80 text-[#A85834] mt-0.5">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-stone-900 font-serif">
            A quick thought before drafting
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Sharing a little more context helps capture the right tone, but only if you want to.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((q, idx) => (
          <div key={idx} className="space-y-1.5 bg-white p-3.5 rounded-xl border border-stone-200/80">
            <label
              htmlFor={`clarification-input-${idx}`}
              className="block text-xs sm:text-sm font-medium text-stone-800"
            >
              {q}
            </label>
            <input
              id={`clarification-input-${idx}`}
              type="text"
              value={answers[idx] || ''}
              onChange={(e) => handleAnswerChange(idx, e.target.value)}
              placeholder="Your answer (or leave blank if unsure)..."
              disabled={isLoading}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-stone-200 bg-stone-50/50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C06C47]/40 focus:bg-white"
            />
          </div>
        ))}

        <div className="space-y-1.5">
          <label
            htmlFor="clarification-extra-note"
            className="block text-xs font-medium text-stone-600"
          >
            Anything else you want to make sure I know? (e.g. shared fault, boundaries, specific fears)
          </label>
          <input
            id="clarification-extra-note"
            type="text"
            value={extraNote}
            onChange={(e) => setExtraNote(e.target.value)}
            placeholder="e.g. I think they were also in the wrong, or I don't want to over-apologize..."
            disabled={isLoading}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C06C47]/40"
          />
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-stone-200/70">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="opt-out-dont-know-button"
              type="button"
              disabled={isLoading}
              onClick={() => onOptOut("I don’t really know how to explain what happened. Just help me write something.")}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 hover:text-stone-800 transition-colors cursor-pointer"
            >
              “I don’t know / just write it”
            </button>
            <button
              id="opt-out-shared-fault-button"
              type="button"
              disabled={isLoading}
              onClick={() =>
                onOptOut(
                  "I don't know how to explain, but I think they were also wrong and I don't want it to sound like everything was my fault."
                )
              }
              className="text-xs px-2.5 py-1.5 rounded-lg border border-amber-300/80 bg-amber-50/50 text-[#A85834] hover:bg-amber-100/60 transition-colors cursor-pointer"
            >
              “Both of us were at fault”
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              id="skip-clarification-button"
              type="button"
              disabled={isLoading}
              onClick={() => onOptOut()}
              className="text-xs text-stone-500 hover:text-stone-800 px-3 py-2 cursor-pointer transition-colors"
            >
              Skip questions
            </button>
            <button
              id="submit-clarification-button"
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-[#C06C47] text-white hover:bg-[#A85834] shadow-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span>Writing message...</span>
              ) : (
                <>
                  <span>Continue & Draft</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
