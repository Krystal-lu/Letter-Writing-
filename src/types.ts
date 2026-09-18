export type Tone = 'Calm' | 'Warm' | 'Honest' | 'Apologetic' | 'Casual' | 'Direct';

export type Length = 'Short' | 'Medium' | 'Long';

export type QuickRewriteOption = 'Softer' | 'More direct' | 'More casual' | 'Shorter' | 'More emotional';

export interface ClarificationQA {
  question: string;
  answer: string;
}

export interface ConversationTurn {
  id: string;
  role: 'user' | 'agent';
  type: 'initial_prompt' | 'clarification_question' | 'clarification_answer' | 'opt_out' | 'letter';
  content: string;
  questions?: string[];
  timestamp: number;
}

export interface GenerateRequestPayload {
  initialPrompt: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  tone: Tone;
  length: Length;
  forceDraft?: boolean;
}

export interface GenerateResponsePayload {
  status: 'clarification' | 'letter';
  clarificationQuestions?: string[];
  letter?: string;
  contextSummary?: string;
}

export interface RewriteRequestPayload {
  currentLetter: string;
  initialPrompt: string;
  tone: Tone;
  length: Length;
  rewriteOption?: QuickRewriteOption;
  customInstruction?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface RewriteResponsePayload {
  letter: string;
}
