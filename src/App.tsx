import React, { useState } from 'react';
import { Header } from './components/Header.js';
import { ToneSelector } from './components/ToneSelector.js';
import { LengthSelector } from './components/LengthSelector.js';
import { ClarificationPanel } from './components/ClarificationPanel.js';
import { LetterDisplay } from './components/LetterDisplay.js';
import { Tone, Length, QuickRewriteOption, ConversationTurn } from './types.js';
import { Loader2, AlertCircle, RefreshCw, PenLine, Sparkles, BookOpen } from 'lucide-react';

const SAMPLE_SCENARIO = {
  title: 'Disagreement with Dad (Shared Fault)',
  text: 'I had a fight with my dad and I feel bad. I don’t really know how to explain what happened. I think he was also wrong and I don’t want the letter to sound like everything was my fault.',
};

export default function App() {
  const [initialPrompt, setInitialPrompt] = useState('');
  const [tone, setTone] = useState<Tone>('Calm');
  const [length, setLength] = useState<Length>('Medium');

  const [isLoading, setIsLoading] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emptyInputWarning, setEmptyInputWarning] = useState<string | null>(null);

  // Agent State
  const [status, setStatus] = useState<'idle' | 'clarification' | 'ready'>('idle');
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [contextSummary, setContextSummary] = useState<string | undefined>(undefined);
  const [conversationTurns, setConversationTurns] = useState<ConversationTurn[]>([]);

  // Retry cache
  const [lastAction, setLastAction] = useState<(() => void) | null>(null);

  const handleHelpMeWrite = async (forceDraft = false, additionalNote?: string) => {
    // Empty input check
    if (!initialPrompt.trim()) {
      setEmptyInputWarning('Tell me a little about what happened first.');
      return;
    }
    setEmptyInputWarning(null);
    setErrorMessage(null);

    // Prevent duplicate submission
    if (isLoading || isRewriting) return;

    setIsLoading(true);
    setLastAction(() => () => handleHelpMeWrite(forceDraft, additionalNote));

    try {
      const historyForBackend = conversationTurns.map((t) => ({
        role: t.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: t.content,
      }));

      if (additionalNote) {
        historyForBackend.push({
          role: 'user',
          content: additionalNote,
        });
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialPrompt: initialPrompt.trim(),
          conversationHistory: historyForBackend,
          tone,
          length,
          forceDraft,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.debugError) {
          console.error('[Letterly Server Debug Error]:', data.debugError);
        }
        throw new Error(data?.error || data?.debugError || 'Unable to generate a message right now. Please try again.');
      }

      if (data.status === 'clarification' && data.clarificationQuestions?.length && !forceDraft) {
        setStatus('clarification');
        setClarificationQuestions(data.clarificationQuestions);
        setConversationTurns((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            role: 'agent',
            type: 'clarification_question',
            content: data.clarificationQuestions.join(' / '),
            questions: data.clarificationQuestions,
            timestamp: Date.now(),
          },
        ]);
      } else if (data.letter) {
        setStatus('ready');
        setGeneratedLetter(data.letter);
        setContextSummary(data.contextSummary);
        setConversationTurns((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            role: 'agent',
            type: 'letter',
            content: data.letter,
            timestamp: Date.now(),
          },
        ]);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err: any) {
      console.error('Error generating letter:', err);
      setErrorMessage(err?.message || 'Something went wrong while generating your message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClarificationAnswers = async (answersSummary: string) => {
    setConversationTurns((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        role: 'user',
        type: 'clarification_answer',
        content: answersSummary,
        timestamp: Date.now(),
      },
    ]);
    await handleHelpMeWrite(true, answersSummary);
  };

  const handleClarificationOptOut = async (reason?: string) => {
    const optOutText = reason || 'I don’t know or would rather not explain. Please just help me write something.';
    setConversationTurns((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        role: 'user',
        type: 'opt_out',
        content: optOutText,
        timestamp: Date.now(),
      },
    ]);
    await handleHelpMeWrite(true, optOutText);
  };

  const handleRewrite = async (option?: QuickRewriteOption, customInstruction?: string) => {
    if (!generatedLetter || isRewriting) return;

    setIsRewriting(true);
    setErrorMessage(null);
    setLastAction(() => () => handleRewrite(option, customInstruction));

    try {
      const historyForBackend = conversationTurns.map((t) => ({
        role: t.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: t.content,
      }));

      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLetter: generatedLetter,
          initialPrompt: initialPrompt.trim(),
          tone,
          length,
          rewriteOption: option,
          customInstruction,
          conversationHistory: historyForBackend,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.debugError) {
          console.error('[Letterly Server Debug Error]:', data.debugError);
        }
        throw new Error(data?.error || data?.debugError || 'Unable to rewrite message right now. Please try again.');
      }
      if (data.letter) {
        setGeneratedLetter(data.letter);
      } else {
        throw new Error('Invalid rewrite response');
      }
    } catch (err: any) {
      console.error('Error rewriting letter:', err);
      setErrorMessage(err?.message || 'Unable to rewrite message right now. Please try again.');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleStartNew = () => {
    setInitialPrompt('');
    setStatus('idle');
    setClarificationQuestions([]);
    setGeneratedLetter(null);
    setConversationTurns([]);
    setErrorMessage(null);
    setEmptyInputWarning(null);
  };

  const handleLoadSample = () => {
    setInitialPrompt(SAMPLE_SCENARIO.text);
    setTone('Calm');
    setLength('Medium');
    setEmptyInputWarning(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col justify-between selection:bg-amber-100">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <Header />

        {/* Error Alert */}
        {errorMessage && (
          <div
            id="error-alert-box"
            className="flex items-center justify-between p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {lastAction && (
              <button
                id="error-retry-button"
                type="button"
                onClick={lastAction}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-100 text-rose-900 hover:bg-rose-200 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* Empty Input Warning */}
        {emptyInputWarning && (
          <div
            id="empty-input-warning"
            className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-[#A85834] text-xs sm:text-sm font-medium flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{emptyInputWarning}</span>
          </div>
        )}

        {/* Main Input Form (Shown if not viewing drafted letter or expandable) */}
        {status !== 'ready' && (
          <div
            id="letter-input-container"
            className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200/90 shadow-sm space-y-5"
          >
            {/* Input area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="user-story-input"
                  className="text-xs font-semibold uppercase tracking-wider text-stone-500"
                >
                  Your thoughts & situation
                </label>
                {!initialPrompt && (
                  <button
                    id="load-sample-scenario-btn"
                    type="button"
                    onClick={handleLoadSample}
                    className="text-xs text-[#C06C47] hover:text-[#A85834] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Try sample: Dad & shared fault</span>
                  </button>
                )}
              </div>

              <textarea
                id="user-story-input"
                rows={5}
                disabled={isLoading}
                value={initialPrompt}
                onChange={(e) => {
                  setInitialPrompt(e.target.value);
                  if (emptyInputWarning) setEmptyInputWarning(null);
                }}
                placeholder="Tell me what happened and what you want to say…"
                className="w-full px-4 py-3.5 text-base text-stone-800 placeholder-stone-400 bg-stone-50/40 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C06C47]/30 focus:border-[#C06C47] focus:bg-white resize-y transition-all"
              />
            </div>

            {/* Selectors */}
            <div className="space-y-4 pt-1">
              <ToneSelector
                selectedTone={tone}
                onSelectTone={setTone}
                disabled={isLoading}
              />
              <LengthSelector
                selectedLength={length}
                onSelectLength={setLength}
                disabled={isLoading}
              />
            </div>

            {/* Submit Button & subtle loading indicator */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-stone-600">
                {isLoading ? (
                  <span id="loading-wording" className="text-[#C06C47] font-medium flex items-center gap-1.5 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Helping you find the right words…
                  </span>
                ) : (
                  <span>Never invents facts. Leaves room for shared feelings.</span>
                )}
              </div>

              <button
                id="help-me-write-button"
                type="button"
                disabled={isLoading}
                onClick={() => handleHelpMeWrite(false)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#C06C47] text-white text-sm font-medium hover:bg-[#A85834] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C06C47]/40"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <PenLine className="w-4 h-4" />
                    <span>Help Me Write</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Clarification Step */}
        {status === 'clarification' && (
          <ClarificationPanel
            questions={clarificationQuestions}
            onSubmitAnswers={handleClarificationAnswers}
            onOptOut={handleClarificationOptOut}
            isLoading={isLoading}
          />
        )}

        {/* Generated Letter Display */}
        {status === 'ready' && generatedLetter && (
          <LetterDisplay
            letter={generatedLetter}
            tone={tone}
            length={length}
            contextSummary={contextSummary}
            onRewrite={handleRewrite}
            isRewriting={isRewriting}
            onStartNew={handleStartNew}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-stone-600 border-t border-stone-200/60 bg-[#FAF8F5]/80">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Letterly • Say what you mean, even when it’s hard.</span>
          <span className="text-stone-600">Powered by Gemini 3.8 Flash</span>
        </div>
      </footer>
    </div>
  );
}
