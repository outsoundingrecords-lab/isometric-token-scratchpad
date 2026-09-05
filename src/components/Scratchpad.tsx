import React, { useState } from 'react';
import { TokenItem, AlertState } from '../types';
import { TOKEN_COLORS } from '../utils/tokenizer';
import { X, Info, AlertTriangle, Layers, BarChart2, Cpu, Copy, Check } from 'lucide-react';

interface ScratchpadProps {
  tokens: TokenItem[];
  alertState: AlertState;
  tokenCount: number;
  maxBuffer: number;
  isOpen: boolean;
  onClose: () => void;
  selectedScenarioTitle?: string;
  breakdownExplanation?: string;
}

export const Scratchpad: React.FC<ScratchpadProps> = ({
  tokens,
  alertState,
  tokenCount,
  maxBuffer,
  isOpen,
  onClose,
  selectedScenarioTitle,
  breakdownExplanation,
}) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'logits' | 'constraints'>('tokens');
  const [selectedTokenIdx, setSelectedTokenIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Selected token or latest token for logit display
  const activeToken = selectedTokenIdx !== null && tokens[selectedTokenIdx]
    ? tokens[selectedTokenIdx]
    : tokens.length > 0
    ? tokens[tokens.length - 1]
    : null;

  const copyTokenData = () => {
    const rawData = JSON.stringify(tokens, null, 2);
    navigator.clipboard.writeText(rawData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="scratchpad-modal"
      className="bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[640px] text-slate-200 transition-all duration-300"
    >
      {/* Header with Title and Model Constraint Status */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">
            SP
          </div>
          <div className="truncate">
            <h2 className="text-sm font-semibold font-mono text-slate-100 flex items-center gap-2">
              Model Scratchpad
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                Live Predictions
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {selectedScenarioTitle || 'Raw Token Predictions & Model Constraints'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Buffer Capacity Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 rounded border border-slate-800 text-[11px] font-mono">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Buffer:</span>
            <span
              className={`font-semibold ${
                alertState.bufferPercent > 90
                  ? 'text-rose-400'
                  : alertState.bufferPercent > 60
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {tokenCount}/{maxBuffer} ({Math.round(alertState.bufferPercent)}%)
            </span>
          </div>

          <button
            id="copy-tokens-btn"
            onClick={copyTokenData}
            title="Copy Raw Tokens JSON"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            id="close-scratchpad-btn"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Breakdown Notice Banner (if active) */}
      {alertState.category !== 'none' && (
        <div className="px-4 py-2 bg-rose-950/70 border-b border-rose-800/60 text-rose-200 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-rose-300">Model Constraint Alert: </span>
            <span>{breakdownExplanation || alertState.reason}</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-mono px-2 pt-1 gap-1">
        <button
          onClick={() => setActiveTab('tokens')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === 'tokens'
              ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Token Stream ({tokens.length})
        </button>

        <button
          onClick={() => setActiveTab('logits')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === 'logits'
              ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Candidate Probabilities
        </button>

        <button
          onClick={() => setActiveTab('constraints')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === 'constraints'
              ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          Why LLMs Break Down
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: RAW TOKEN STREAM */}
        {activeTab === 'tokens' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Click any token to inspect its candidate logit distribution:</span>
              <span>Total: {tokens.length} tokens</span>
            </div>

            {tokens.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-mono text-xs">
                No tokens generated yet. Trigger a scenario or run a prompt above.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 font-mono text-sm leading-relaxed min-h-[140px]">
                {tokens.map((tok, idx) => {
                  const color = TOKEN_COLORS[tok.colorIdx] || TOKEN_COLORS[0];
                  const isSelected = selectedTokenIdx === idx;
                  return (
                    <button
                      key={`${tok.id}-${idx}`}
                      onClick={() => {
                        setSelectedTokenIdx(idx);
                        setActiveTab('logits');
                      }}
                      className={`relative group inline-flex items-center px-2 py-0.5 rounded border transition-all ${
                        tok.isBreakdown
                          ? 'border-rose-500/80 bg-rose-950/40 text-rose-300 ring-1 ring-rose-500/40'
                          : `${color.bg} ${color.text} ${color.border}`
                      } ${isSelected ? 'ring-2 ring-cyan-400 shadow-md scale-105' : 'hover:scale-105'}`}
                    >
                      {/* Visual indicator for leading space */}
                      {tok.text.startsWith(' ') && (
                        <span className="text-slate-500 font-sans mr-0.5 text-[10px] select-none">␣</span>
                      )}
                      <span>{tok.text.startsWith(' ') ? tok.text.slice(1) : tok.text}</span>

                      {/* Subscript Token ID */}
                      <span className="text-[9px] opacity-60 ml-1 font-mono">#{tok.id}</span>

                      {/* Breakdown alert badge */}
                      {tok.isBreakdown && (
                        <span className="ml-1 text-[10px] text-rose-400 animate-pulse">⚠️</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected Token Detail Card */}
            {activeToken && (
              <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold text-cyan-300">
                    Token #{activeToken.id}: &ldquo;{activeToken.text}&rdquo;
                  </span>
                  <span className="text-slate-400">
                    Confidence: {(activeToken.prob * 100).toFixed(1)}% | Logprob: {activeToken.logprob}
                  </span>
                </div>

                {activeToken.isBreakdown && (
                  <div className="p-2 bg-rose-950/60 border border-rose-700/50 rounded text-rose-200 text-[11px]">
                    <span className="font-bold">Breakdown Trigger: </span>
                    {activeToken.breakdownNote || 'Autoregressive subword breakdown in progress.'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CANDIDATE PROBABILITIES / LOGITS */}
        {activeTab === 'logits' && (
          <div className="space-y-4">
            {activeToken ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">
                    Inspecting Token Prediction:
                    <strong className="text-cyan-300 ml-1">&ldquo;{activeToken.text}&rdquo;</strong>
                  </span>
                  <span className="text-slate-400">ID #{activeToken.id}</span>
                </div>

                <div className="space-y-2 p-3.5 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                    Top Alternative Candidates (Softmax Distribution):
                  </div>

                  {activeToken.topAlternatives.map((alt, i) => {
                    const pct = Math.round(alt.prob * 100);
                    const isWinner = i === 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className={isWinner ? 'text-cyan-300 font-bold' : 'text-slate-300'}>
                            {i + 1}. &ldquo;{alt.text}&rdquo;
                          </span>
                          <span className="text-slate-400">{pct}% ({alt.prob.toFixed(3)})</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isWinner
                                ? activeToken.isBreakdown
                                  ? 'bg-rose-500'
                                  : 'bg-cyan-400'
                                : 'bg-slate-600'
                            }`}
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-400 font-mono bg-slate-950/40 p-2.5 rounded border border-slate-800/80">
                  <p className="font-semibold text-slate-300 mb-1">Observation on Token Distribution:</p>
                  {activeToken.isBreakdown ? (
                    <p className="text-rose-300">
                      ⚠️ High Entropy State: Notice how the model distribution is split across multiple candidates.
                      Because the transformer has no internal character-level memory for subwords, single-character reverse
                      predictions suffer from high variance and spelling hallucination!
                    </p>
                  ) : (
                    <p>
                      In high-confidence generation, the winning token takes 80-99% probability mass.
                      When tokenization breaks down, probability spreads out (flat softmax), forcing random sampling or wrong letters.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 font-mono text-xs">
                No active token to inspect. Run a scenario above.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WHY LLMs BREAK DOWN (EDUCATIONAL / MODEL CONSTRAINTS) */}
        {activeTab === 'constraints' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1.5">
              <h3 className="font-bold font-mono text-cyan-300 flex items-center gap-1.5">
                <span>1.</span> Why LLMs Cannot Reverse Words or Spell Backwards
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Large Language Models do not see letters; they see <strong>tokens</strong> (subwords).
                For example, the word <code className="text-amber-300">&quot;strawberry&quot;</code> is encoded as two tokens:
                <code className="text-cyan-300"> [&quot;straw&quot;, &quot;berry&quot;]</code> (IDs 31422 and 49102).
              </p>
              <p className="text-slate-400 leading-relaxed">
                To reverse it character-by-character (<code className="text-rose-300">&quot;y-r-r-e-b-w-a-r-t-s&quot;</code>),
                the model must generate individual character tokens without having an internal pointer to characters inside &quot;berry&quot;.
                It cannot &quot;look inside&quot; the token embedding without explicit chain-of-thought scratchpads.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1.5">
              <h3 className="font-bold font-mono text-cyan-300 flex items-center gap-1.5">
                <span>2.</span> The &quot;How Many &apos;R&apos;s in Strawberry?&quot; Trap
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Because <code className="text-amber-300">&quot;berry&quot;</code> is a single immutable token, there are no individual
                &quot;r&quot; codepoint counts stored in the embedding vector. The model predicts the answer via statistical correlation,
                which frequently outputs &quot;2&quot; instead of &quot;3&quot;.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1.5">
              <h3 className="font-bold font-mono text-cyan-300 flex items-center gap-1.5">
                <span>3.</span> Context Buffer Overflows & Memory Saturation
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Every generated token appends key/value vectors to the KV cache. When the prompt + output approaches the hardware
                or allocation buffer limit (visualized here as the overhead red gauge and paper stack piling on the desk),
                the model either halts, truncates older context, or incurs latency spikes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Quick Action */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-500">
          Tip: Tap the desk anytime in the isometric view to toggle this scratchpad.
        </span>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
