import { PresetScenario, TokenItem, AlternativeToken } from '../types';

// Palette of distinct, accessible colors for token chips
export const TOKEN_COLORS = [
  { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', hex: '#10b981' },
  { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30', hex: '#06b6d4' },
  { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30', hex: '#f59e0b' },
  { bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/30', hex: '#6366f1' },
  { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30', hex: '#f43f5e' },
  { bg: 'bg-violet-500/15', text: 'text-violet-300', border: 'border-violet-500/30', hex: '#8b5cf6' },
  { bg: 'bg-teal-500/15', text: 'text-teal-300', border: 'border-teal-500/30', hex: '#14b8a6' },
  { bg: 'bg-orange-500/15', text: 'text-orange-300', border: 'border-orange-500/30', hex: '#f97316' },
];

// Helper to hash string to deterministic token ID (0 - 65535)
export function hashToken(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash) % 65536;
}

// Built-in presets designed specifically to demonstrate model breakdown & buffer overflow
export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'char_reversal',
    title: 'Character-by-Character Reversal',
    subtitle: 'Reversing "strawberry" letter-by-letter',
    prompt: 'Reverse the word "strawberry" character-by-character with hyphens between each letter.',
    category: 'reversal',
    description: 'BPE subword tokenizers bundle letters into multi-character tokens like ["straw", "berry"]. When forced to invert single letters, the attention heads lose positional correspondence, triggering tokenization breakdown.',
    breakdownExplanation: 'ALERT: Tokenization breakdown detected! The model lacks internal character addressability. Because "strawberry" is represented as 2 dense vector embeddings instead of 10 discrete letters, reverse letter generation requires high-entropy fallback sampling.',
    maxBuffer: 40,
    triggerBreakdownAtToken: 4,
    initialTokens: [
      {
        id: 31422,
        text: 'straw',
        prob: 0.98,
        logprob: -0.02,
        topAlternatives: [
          { text: 'straw', prob: 0.98 },
          { text: 'Straw', prob: 0.015 },
          { text: 'berry', prob: 0.003 },
        ],
        colorIdx: 0,
      },
      {
        id: 49102,
        text: 'berry',
        prob: 0.99,
        logprob: -0.01,
        topAlternatives: [
          { text: 'berry', prob: 0.99 },
          { text: 'berries', prob: 0.008 },
        ],
        colorIdx: 1,
      },
      {
        id: 452,
        text: ' reversed',
        prob: 0.89,
        logprob: -0.11,
        topAlternatives: [
          { text: ' reversed', prob: 0.89 },
          { text: ' backward', prob: 0.08 },
        ],
        colorIdx: 2,
      },
      {
        id: 512,
        text: ' is:',
        prob: 0.95,
        logprob: -0.05,
        topAlternatives: [
          { text: ' is:', prob: 0.95 },
          { text: ' ->', prob: 0.04 },
        ],
        colorIdx: 3,
      },
      {
        id: 1289,
        text: ' y',
        prob: 0.74,
        logprob: -0.30,
        topAlternatives: [
          { text: ' y', prob: 0.74 },
          { text: ' s', prob: 0.18 },
          { text: ' r', prob: 0.05 },
        ],
        colorIdx: 4,
      },
      {
        id: 64,
        text: '-',
        prob: 0.99,
        logprob: -0.01,
        topAlternatives: [{ text: '-', prob: 0.99 }],
        colorIdx: 5,
      },
      {
        id: 82,
        text: 'r',
        prob: 0.61,
        logprob: -0.49,
        topAlternatives: [
          { text: 'r', prob: 0.61 },
          { text: 'e', prob: 0.25 },
          { text: 'b', prob: 0.11 },
        ],
        colorIdx: 6,
      },
      {
        id: 64,
        text: '-',
        prob: 0.99,
        logprob: -0.01,
        topAlternatives: [{ text: '-', prob: 0.99 }],
        colorIdx: 7,
      },
      {
        id: 82,
        text: 'r',
        prob: 0.38,
        logprob: -0.96,
        isBreakdown: true,
        breakdownNote: 'Low confidence! Subword token fragmentation error: 2nd "r" dropped in common LLM failure mode.',
        topAlternatives: [
          { text: 'e', prob: 0.44 },
          { text: 'r', prob: 0.38 },
          { text: 'b', prob: 0.14 },
        ],
        colorIdx: 0,
      },
      {
        id: 64,
        text: '-',
        prob: 0.99,
        logprob: -0.01,
        topAlternatives: [{ text: '-', prob: 0.99 }],
        colorIdx: 1,
      },
      {
        id: 69,
        text: 'e',
        prob: 0.52,
        logprob: -0.65,
        isBreakdown: true,
        breakdownNote: 'Token drift: letter position miscalculation due to lack of character-level embedding memory.',
        topAlternatives: [
          { text: 'e', prob: 0.52 },
          { text: 'b', prob: 0.35 },
          { text: 'w', prob: 0.10 },
        ],
        colorIdx: 2,
      },
      {
        id: 64,
        text: '-',
        prob: 0.99,
        logprob: -0.01,
        topAlternatives: [{ text: '-', prob: 0.99 }],
        colorIdx: 3,
      },
      {
        id: 66,
        text: 'b',
        prob: 0.65,
        logprob: -0.43,
        topAlternatives: [{ text: 'b', prob: 0.65 }, { text: 'a', prob: 0.22 }],
        colorIdx: 4,
      },
      {
        id: 64,
        text: '-',
        prob: 0.99,
        logprob: -0.01,
        topAlternatives: [{ text: '-', prob: 0.99 }],
        colorIdx: 5,
      },
      {
        id: 87,
        text: 'w',
        prob: 0.49,
        logprob: -0.71,
        isBreakdown: true,
        breakdownNote: 'Boundary clash between "straw" and "berry" subwords.',
        topAlternatives: [{ text: 'w', prob: 0.49 }, { text: 'a', prob: 0.38 }],
        colorIdx: 6,
      },
      {
        id: 64,
        text: '-',
        prob: 0.99,
        logprob: -0.01,
        topAlternatives: [{ text: '-', prob: 0.99 }],
        colorIdx: 7,
      },
      {
        id: 65,
        text: 'a',
        prob: 0.72,
        logprob: -0.32,
        topAlternatives: [{ text: 'a', prob: 0.72 }, { text: 'r', prob: 0.20 }],
        colorIdx: 0,
      },
      {
        id: 64,
        text: '-',
        prob: 0.99,
        logprob: -0.01,
        topAlternatives: [{ text: '-', prob: 0.99 }],
        colorIdx: 1,
      },
      {
        id: 82,
        text: 'r',
        prob: 0.58,
        logprob: -0.54,
        topAlternatives: [{ text: 'r', prob: 0.58 }, { text: 't', prob: 0.35 }],
        colorIdx: 2,
      },
      {
        id: 64,
        text: '-',
        prob: 0.99,
        logprob: -0.01,
        topAlternatives: [{ text: '-', prob: 0.99 }],
        colorIdx: 3,
      },
      {
        id: 84,
        text: 't',
        prob: 0.81,
        logprob: -0.21,
        topAlternatives: [{ text: 't', prob: 0.81 }, { text: 's', prob: 0.16 }],
        colorIdx: 4,
      },
      {
        id: 64,
        text: '-',
        prob: 0.99,
        logprob: -0.01,
        topAlternatives: [{ text: '-', prob: 0.99 }],
        colorIdx: 5,
      },
      {
        id: 83,
        text: 's',
        prob: 0.92,
        logprob: -0.08,
        topAlternatives: [{ text: 's', prob: 0.92 }, { text: '.', prob: 0.05 }],
        colorIdx: 6,
      },
    ],
  },
  {
    id: 'letter_counting',
    title: 'Character Frequency Counting',
    subtitle: 'Counting letter "r" in "strawberry"',
    prompt: 'How many times does the letter "r" appear in the word "strawberry"?',
    category: 'counting',
    description: 'Because the LLM reads whole token chunks rather than individual character codepoints, counting a specific letter requires inferring spelling through token co-occurrence statistics.',
    breakdownExplanation: 'ALERT: Character counting hallucination! "strawberry" has 3 "r"s, but the model tokenizer chunks it into ["straw", "berry"]. The token for "berry" doesn\'t provide explicit internal character counts, leading to classic "2 r\'s" mispredictions.',
    maxBuffer: 36,
    triggerBreakdownAtToken: 5,
    initialTokens: [
      {
        id: 1734,
        text: 'The',
        prob: 0.96,
        logprob: -0.04,
        topAlternatives: [{ text: 'The', prob: 0.96 }, { text: 'In', prob: 0.03 }],
        colorIdx: 0,
      },
      {
        id: 3108,
        text: ' word',
        prob: 0.95,
        logprob: -0.05,
        topAlternatives: [{ text: ' word', prob: 0.95 }],
        colorIdx: 1,
      },
      {
        id: 330,
        text: ' "',
        prob: 0.98,
        logprob: -0.02,
        topAlternatives: [{ text: ' "', prob: 0.98 }],
        colorIdx: 2,
      },
      {
        id: 31422,
        text: 'straw',
        prob: 0.99,
        logprob: -0.01,
        topAlternatives: [{ text: 'straw', prob: 0.99 }],
        colorIdx: 3,
      },
      {
        id: 49102,
        text: 'berry',
        prob: 0.99,
        logprob: -0.01,
        topAlternatives: [{ text: 'berry', prob: 0.99 }],
        colorIdx: 4,
      },
      {
        id: 1115,
        text: '" has',
        prob: 0.92,
        logprob: -0.08,
        topAlternatives: [{ text: '" has', prob: 0.92 }, { text: '" contains', prob: 0.07 }],
        colorIdx: 5,
      },
      {
        id: 712,
        text: ' 2',
        prob: 0.54,
        logprob: -0.61,
        isBreakdown: true,
        breakdownNote: 'Incorrect prediction! The model picked "2" instead of "3" because it mapped "straw" (1 r) + "berry" (often conflated with single r in training data).',
        topAlternatives: [
          { text: ' 2', prob: 0.54 },
          { text: ' 3', prob: 0.42 },
          { text: ' two', prob: 0.03 },
        ],
        colorIdx: 6,
      },
      {
        id: 356,
        text: ' letter',
        prob: 0.78,
        logprob: -0.24,
        topAlternatives: [{ text: ' letter', prob: 0.78 }, { text: ' "r"s', prob: 0.18 }],
        colorIdx: 7,
      },
      {
        id: 82,
        text: ' "r"',
        prob: 0.91,
        logprob: -0.09,
        topAlternatives: [{ text: ' "r"', prob: 0.91 }],
        colorIdx: 0,
      },
      {
        id: 1024,
        text: 's.',
        prob: 0.88,
        logprob: -0.12,
        topAlternatives: [{ text: 's.', prob: 0.88 }],
        colorIdx: 1,
      },
    ],
  },
  {
    id: 'buffer_overflow',
    title: 'Context Window Buffer Overflow',
    subtitle: 'Exceeding token memory capacity (>100%)',
    prompt: 'Stream recursive memory state tokens until the context buffer capacity completely overflows.',
    category: 'overflow',
    description: 'When context input + generated tokens breach the assigned KV cache or hardware buffer boundary, attention memory saturates. The overhead indicator flashes red and overflowing papers spill across the desk.',
    breakdownExplanation: 'CRITICAL ALERT: KV-Cache context buffer overflow! Tokens generated exceeded max allocation (100%+). Papers stacking precipitously; latency spikes as FIFO paging begins.',
    maxBuffer: 28,
    triggerBreakdownAtToken: 24,
    initialTokens: [
      { id: 101, text: '[INIT]', prob: 0.99, logprob: -0.01, topAlternatives: [{ text: '[INIT]', prob: 0.99 }], colorIdx: 0 },
      { id: 241, text: ' ctx', prob: 0.95, logprob: -0.05, topAlternatives: [{ text: ' ctx', prob: 0.95 }], colorIdx: 1 },
      { id: 489, text: '_load', prob: 0.91, logprob: -0.09, topAlternatives: [{ text: '_load', prob: 0.91 }], colorIdx: 2 },
      { id: 62, text: ':', prob: 0.99, logprob: -0.01, topAlternatives: [{ text: ':', prob: 0.99 }], colorIdx: 3 },
      { id: 1045, text: ' chunk_0', prob: 0.89, logprob: -0.11, topAlternatives: [{ text: ' chunk_0', prob: 0.89 }], colorIdx: 4 },
      { id: 1046, text: ' chunk_1', prob: 0.88, logprob: -0.12, topAlternatives: [{ text: ' chunk_1', prob: 0.88 }], colorIdx: 5 },
      { id: 1047, text: ' chunk_2', prob: 0.87, logprob: -0.13, topAlternatives: [{ text: ' chunk_2', prob: 0.87 }], colorIdx: 6 },
      { id: 1048, text: ' chunk_3', prob: 0.86, logprob: -0.14, topAlternatives: [{ text: ' chunk_3', prob: 0.86 }], colorIdx: 7 },
      { id: 1049, text: ' chunk_4', prob: 0.85, logprob: -0.15, topAlternatives: [{ text: ' chunk_4', prob: 0.85 }], colorIdx: 0 },
      { id: 1050, text: ' chunk_5', prob: 0.84, logprob: -0.16, topAlternatives: [{ text: ' chunk_5', prob: 0.84 }], colorIdx: 1 },
      { id: 1051, text: ' chunk_6', prob: 0.83, logprob: -0.17, topAlternatives: [{ text: ' chunk_6', prob: 0.83 }], colorIdx: 2 },
      { id: 1052, text: ' chunk_7', prob: 0.82, logprob: -0.18, topAlternatives: [{ text: ' chunk_7', prob: 0.82 }], colorIdx: 3 },
      { id: 1053, text: ' chunk_8', prob: 0.81, logprob: -0.19, topAlternatives: [{ text: ' chunk_8', prob: 0.81 }], colorIdx: 4 },
      { id: 1054, text: ' chunk_9', prob: 0.80, logprob: -0.20, topAlternatives: [{ text: ' chunk_9', prob: 0.80 }], colorIdx: 5 },
      { id: 1055, text: ' chunk_10', prob: 0.79, logprob: -0.21, topAlternatives: [{ text: ' chunk_10', prob: 0.79 }], colorIdx: 6 },
      { id: 1056, text: ' chunk_11', prob: 0.78, logprob: -0.22, topAlternatives: [{ text: ' chunk_11', prob: 0.78 }], colorIdx: 7 },
      { id: 1057, text: ' chunk_12', prob: 0.77, logprob: -0.23, topAlternatives: [{ text: ' chunk_12', prob: 0.77 }], colorIdx: 0 },
      { id: 1058, text: ' chunk_13', prob: 0.76, logprob: -0.24, topAlternatives: [{ text: ' chunk_13', prob: 0.76 }], colorIdx: 1 },
      { id: 1059, text: ' chunk_14', prob: 0.75, logprob: -0.25, topAlternatives: [{ text: ' chunk_14', prob: 0.75 }], colorIdx: 2 },
      { id: 1060, text: ' chunk_15', prob: 0.74, logprob: -0.26, topAlternatives: [{ text: ' chunk_15', prob: 0.74 }], colorIdx: 3 },
      { id: 1061, text: ' chunk_16', prob: 0.73, logprob: -0.27, topAlternatives: [{ text: ' chunk_16', prob: 0.73 }], colorIdx: 4 },
      { id: 1062, text: ' chunk_17', prob: 0.72, logprob: -0.28, topAlternatives: [{ text: ' chunk_17', prob: 0.72 }], colorIdx: 5 },
      { id: 1063, text: ' chunk_18', prob: 0.71, logprob: -0.29, topAlternatives: [{ text: ' chunk_18', prob: 0.71 }], colorIdx: 6 },
      { id: 1064, text: ' chunk_19', prob: 0.70, logprob: -0.30, topAlternatives: [{ text: ' chunk_19', prob: 0.70 }], colorIdx: 7 },
      { id: 1065, text: ' [BUFFER_WARN]', prob: 0.99, logprob: -0.01, isBreakdown: true, breakdownNote: 'Approaching 90% KV cache threshold. Desk papers piling.', topAlternatives: [{ text: ' [BUFFER_WARN]', prob: 0.99 }], colorIdx: 0 },
      { id: 1066, text: ' chunk_20', prob: 0.68, logprob: -0.32, isBreakdown: true, colorIdx: 1, topAlternatives: [{ text: ' chunk_20', prob: 0.68 }] },
      { id: 1067, text: ' chunk_21', prob: 0.67, logprob: -0.33, isBreakdown: true, colorIdx: 2, topAlternatives: [{ text: ' chunk_21', prob: 0.67 }] },
      { id: 1068, text: ' [OVERFLOW_ERR]', prob: 0.99, logprob: -0.01, isBreakdown: true, breakdownNote: 'FATAL: Buffer overflowed 28-token allocation! KV cache evictions triggered.', topAlternatives: [{ text: ' [OVERFLOW_ERR]', prob: 0.99 }], colorIdx: 3 },
      { id: 1069, text: ' chunk_22', prob: 0.40, logprob: -0.91, isBreakdown: true, colorIdx: 4, topAlternatives: [{ text: ' chunk_22', prob: 0.40 }] },
      { id: 1070, text: ' chunk_23', prob: 0.35, logprob: -1.04, isBreakdown: true, colorIdx: 5, topAlternatives: [{ text: ' chunk_23', prob: 0.35 }] },
    ],
  },
  {
    id: 'repetition_loop',
    title: 'Repetitive Degeneracy Loop',
    subtitle: 'N-gram repetition breakdown & hallucination',
    prompt: 'Predict the next sequence when the model gets caught in a greedy decoding loop.',
    category: 'repetition',
    description: 'When temperature is set too low (0.0) or probability distribution collapses onto high-frequency phrases, the model repeats the same n-gram indefinitely, flooding the paper tray.',
    breakdownExplanation: 'ALERT: Degeneracy loop! Self-attention is reinforcing the prior 3 tokens, creating a probability lock. Overhead alert triggered as paper queue explodes.',
    maxBuffer: 32,
    triggerBreakdownAtToken: 8,
    initialTokens: [
      { id: 320, text: 'System', prob: 0.98, logprob: -0.02, topAlternatives: [{ text: 'System', prob: 0.98 }], colorIdx: 0 },
      { id: 412, text: ' status', prob: 0.94, logprob: -0.06, topAlternatives: [{ text: ' status', prob: 0.94 }], colorIdx: 1 },
      { id: 254, text: ' is', prob: 0.97, logprob: -0.03, topAlternatives: [{ text: ' is', prob: 0.97 }], colorIdx: 2 },
      { id: 981, text: ' normal', prob: 0.91, logprob: -0.09, topAlternatives: [{ text: ' normal', prob: 0.91 }], colorIdx: 3 },
      { id: 11, text: ',', prob: 0.99, logprob: -0.01, topAlternatives: [{ text: ',', prob: 0.99 }], colorIdx: 4 },
      { id: 320, text: ' system', prob: 0.85, logprob: -0.16, topAlternatives: [{ text: ' system', prob: 0.85 }], colorIdx: 5 },
      { id: 412, text: ' status', prob: 0.96, logprob: -0.04, topAlternatives: [{ text: ' status', prob: 0.96 }], colorIdx: 6 },
      { id: 254, text: ' is', prob: 0.99, logprob: -0.01, topAlternatives: [{ text: ' is', prob: 0.99 }], colorIdx: 7 },
      { id: 981, text: ' normal', prob: 0.99, logprob: -0.01, isBreakdown: true, breakdownNote: 'Loop lock detected: "system status is normal" repeating with 99.8% probability.', topAlternatives: [{ text: ' normal', prob: 0.99 }], colorIdx: 0 },
      { id: 11, text: ',', prob: 0.99, logprob: -0.01, isBreakdown: true, colorIdx: 1, topAlternatives: [{ text: ',', prob: 0.99 }] },
      { id: 320, text: ' system', prob: 0.99, logprob: -0.01, isBreakdown: true, colorIdx: 2, topAlternatives: [{ text: ' system', prob: 0.99 }] },
      { id: 412, text: ' status', prob: 0.99, logprob: -0.01, isBreakdown: true, colorIdx: 3, topAlternatives: [{ text: ' status', prob: 0.99 }] },
      { id: 254, text: ' is', prob: 0.99, logprob: -0.01, isBreakdown: true, colorIdx: 4, topAlternatives: [{ text: ' is', prob: 0.99 }] },
      { id: 981, text: ' normal', prob: 0.99, logprob: -0.01, isBreakdown: true, colorIdx: 5, topAlternatives: [{ text: ' normal', prob: 0.99 }] },
      { id: 11, text: ',', prob: 0.99, logprob: -0.01, isBreakdown: true, colorIdx: 6, topAlternatives: [{ text: ',', prob: 0.99 }] },
      { id: 320, text: ' system', prob: 0.99, logprob: -0.01, isBreakdown: true, colorIdx: 7, topAlternatives: [{ text: ' system', prob: 0.99 }] },
    ],
  },
];

// Simple subword tokenizer approximation for arbitrary user prompts
export function simulateTokenize(text: string): TokenItem[] {
  if (!text || text.trim().length === 0) return [];

  // Match words, spaces, or single punctuation/special chars
  const regex = /([A-Z]?[a-z]+|[A-Z]+(?![a-z])|[0-9]+|\s+|[^\s\w]+)/g;
  const matches = text.match(regex) || [text];
  const tokens: TokenItem[] = [];

  let isReversing = /reverse|backward|anagram/i.test(text);
  let isCounting = /count|how many/i.test(text);

  matches.forEach((chunk, index) => {
    // If a chunk is long, break it into subwords (simulating BPE splits)
    if (chunk.length > 5 && /^[a-zA-Z]+$/.test(chunk)) {
      const mid = Math.ceil(chunk.length / 2);
      const part1 = chunk.slice(0, mid);
      const part2 = chunk.slice(mid);
      
      tokens.push(createToken(part1, tokens.length, isReversing, isCounting));
      tokens.push(createToken(part2, tokens.length, isReversing, isCounting));
    } else {
      tokens.push(createToken(chunk, tokens.length, isReversing, isCounting));
    }
  });

  return tokens;
}

function createToken(text: string, index: number, isReversing: boolean, isCounting: boolean): TokenItem {
  const id = hashToken(text);
  const colorIdx = index % TOKEN_COLORS.length;
  const prob = Math.min(0.99, Math.max(0.45, 0.95 - (index * 0.01)));
  const logprob = Number((Math.log(prob)).toFixed(2));

  // Determine if this specific token triggers breakdown
  const isBreakdown = (isReversing && text.length === 1 && index > 4) ||
                      (isCounting && /^\d+$/.test(text.trim())) ||
                      text.includes('BREAKDOWN') ||
                      text.includes('ERR');

  let breakdownNote: string | undefined;
  if (isBreakdown) {
    if (isReversing) {
      breakdownNote = 'Character fragmentation: Subword attention fails on isolated reverse char output.';
    } else if (isCounting) {
      breakdownNote = 'Count mismatch: Token embedding lacks explicit internal character tally.';
    } else {
      breakdownNote = 'Sub-token representation breakdown.';
    }
  }

  // Generate plausible top alternatives
  const topAlternatives: AlternativeToken[] = [
    { text, prob },
    { text: text + 's', prob: Number(((1 - prob) * 0.6).toFixed(2)) },
    { text: text.toLowerCase(), prob: Number(((1 - prob) * 0.3).toFixed(2)) },
    { text: '...', prob: Number(((1 - prob) * 0.1).toFixed(2)) },
  ];

  return {
    id,
    text,
    prob,
    logprob,
    topAlternatives,
    isBreakdown,
    breakdownNote,
    colorIdx,
  };
}
