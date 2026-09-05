export interface AlternativeToken {
  text: string;
  prob: number;
}

export interface TokenItem {
  id: number;
  text: string;
  prob: number;
  logprob: number;
  topAlternatives: AlternativeToken[];
  isBreakdown?: boolean;
  breakdownNote?: string;
  colorIdx: number;
}

export type AgentState = 'idle' | 'processing' | 'alert' | 'overflow' | 'complete';

export interface AlertState {
  hasSweatDrop: boolean;
  sweatFrame: number;
  hasOverheadBar: boolean;
  bufferPercent: number; // 0 - 100+
  isOverflowing: boolean;
  paperCount: number; // 0 - 35
  reason: string;
  category: 'none' | 'char_reversal' | 'letter_count' | 'buffer_overflow' | 'repetition_loop' | 'subtoken_split';
}

export interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  category: 'reversal' | 'counting' | 'overflow' | 'repetition';
  description: string;
  breakdownExplanation: string;
  maxBuffer: number;
  initialTokens: TokenItem[];
  triggerBreakdownAtToken?: number;
}

export interface CanvasDimensions {
  width: number;
  height: number;
}
