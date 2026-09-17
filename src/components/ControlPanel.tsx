import React, { useState } from 'react';
import { PRESET_SCENARIOS } from '../utils/tokenizer';
import { PresetScenario, AgentState } from '../types';
import { Play, Pause, StepForward, RotateCcw, Zap, Sparkles, Sliders, Maximize2, Share2, Activity } from 'lucide-react';

interface ControlPanelProps {
  currentScenario: PresetScenario;
  onSelectScenario: (scenario: PresetScenario) => void;
  agentState: AgentState;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  isPlaying: boolean;
  canStep: boolean;
  customPrompt: string;
  onChangeCustomPrompt: (val: string) => void;
  onRunCustomPrompt: () => void;
  bufferLimit: number;
  onChangeBufferLimit: (limit: number) => void;
  speedMs: number;
  onChangeSpeed: (ms: number) => void;
  useLiveGemini: boolean;
  onToggleLiveGemini: (val: boolean) => void;
  hasGeminiKey: boolean;
  ecoMode: boolean;
  onToggleEcoMode: (val: boolean) => void;
  onToggleImmersion?: () => void;
  onShareState?: () => void;
  onToggleDevHud?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentScenario,
  onSelectScenario,
  agentState,
  onStart,
  onPause,
  onStep,
  onReset,
  isPlaying,
  canStep,
  customPrompt,
  onChangeCustomPrompt,
  onRunCustomPrompt,
  bufferLimit,
  onChangeBufferLimit,
  speedMs,
  onChangeSpeed,
  useLiveGemini,
  onToggleLiveGemini,
  hasGeminiKey,
  ecoMode,
  onToggleEcoMode,
  onToggleImmersion,
  onShareState,
  onToggleDevHud,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4 font-mono text-xs">
      {/* Preset Scenario Selector Buttons */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400">
          <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5 shrink-0">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Model Constraint Scenarios:
          </span>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {onToggleImmersion && (
              <button
                id="panel-immersion-btn"
                onClick={onToggleImmersion}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors text-[11px]"
                title="Toggle Immersion Mode (or press F)"
              >
                <Maximize2 className="w-3 h-3 text-cyan-400" />
                <span>Immersion</span>
                <kbd className="hidden sm:inline text-[9px] bg-slate-900 text-cyan-300 px-1 rounded border border-slate-700">F</kbd>
              </button>
            )}

            {onShareState && (
              <button
                id="panel-share-btn"
                onClick={onShareState}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors text-[11px]"
                title="Copy shareable URL with current tokens & scenario"
              >
                <Share2 className="w-3 h-3 text-emerald-400" />
                <span>Share</span>
              </button>
            )}

            <button
              id="toggle-settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors text-[11px]"
              title="Tune buffer limit & speed"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showSettings ? 'Hide Tuning' : 'Tune'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESET_SCENARIOS.map((sc) => {
            const isSelected = !isCustomMode && currentScenario.id === sc.id;
            return (
              <button
                key={sc.id}
                id={`scenario-btn-${sc.id}`}
                onClick={() => {
                  setIsCustomMode(false);
                  onSelectScenario(sc);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-md ring-1 ring-cyan-500/40'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="font-bold truncate text-[11px]">{sc.title}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{sc.subtitle}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Prompt Accordion */}
      <div className="space-y-2 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">
            {isCustomMode ? 'Custom Prompt Mode:' : 'Or test custom text:'}
          </span>
          <div className="flex items-center gap-2">
            {hasGeminiKey && (
              <label className="flex items-center gap-1 text-[10px] text-emerald-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLiveGemini}
                  onChange={(e) => onToggleLiveGemini(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                />
                <span>Live Gemini 3.8 Flash</span>
              </label>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            id="custom-prompt-input"
            type="text"
            value={customPrompt}
            onChange={(e) => {
              onChangeCustomPrompt(e.target.value);
              setIsCustomMode(true);
            }}
            placeholder="Type word or prompt (e.g. 'reverse antigravity char-by-char')..."
            className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
          />
          <button
            id="run-custom-prompt-btn"
            onClick={() => {
              setIsCustomMode(true);
              onRunCustomPrompt();
            }}
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-slate-900 font-bold rounded-lg transition-all flex items-center gap-1.5 shadow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Advanced Settings Drawer */}
      {showSettings && (
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Overhead Buffer Limit:</span>
                <strong className="text-cyan-300">{bufferLimit} tokens</strong>
              </div>
              <input
                type="range"
                min="16"
                max="128"
                step="4"
                value={bufferLimit}
                onChange={(e) => onChangeBufferLimit(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">
                Lower buffer limits trigger rapid paper stacking and overhead warning bar!
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Token Generation Speed:</span>
                <strong className="text-cyan-300">
                  {speedMs <= 80 ? 'Fast (80ms)' : speedMs <= 200 ? 'Normal (200ms)' : 'Slow-Mo (450ms)'}
                </strong>
              </div>
              <input
                type="range"
                min="60"
                max="500"
                step="40"
                value={speedMs}
                onChange={(e) => onChangeSpeed(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">
                Slow down to clearly observe agent sweat drop and token breakdown transitions.
              </span>
            </div>
          </div>

          {/* Older Hardware & Mobile Eco Mode */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Low-Power / Older Hardware Mode (30 FPS)
              </div>
              <div className="text-[10px] text-slate-500">
                Throttles rendering to 30 FPS to minimize battery &amp; CPU heat on legacy phones and low-spec machines.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer min-h-[32px]">
              <input
                type="checkbox"
                checked={ecoMode}
                onChange={(e) => onToggleEcoMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2 text-[11px] font-medium text-slate-300">
                {ecoMode ? 'Eco On' : 'Eco Off'}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Action Playback Controls (Optimized with 44px touch targets & keyboard badges) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {isPlaying ? (
            <button
              id="pause-simulation-btn"
              onClick={onPause}
              className="min-h-[44px] px-4 py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-slate-950 font-bold rounded-lg flex items-center gap-2 shadow transition-all touch-manipulation"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
              <kbd className="hidden sm:inline-block text-[10px] bg-amber-800/60 text-amber-100 px-1.5 py-0.5 rounded border border-amber-400/40">
                Space
              </kbd>
            </button>
          ) : (
            <button
              id="play-simulation-btn"
              onClick={onStart}
              className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-950 font-bold rounded-lg flex items-center gap-2 shadow transition-all touch-manipulation"
            >
              <Play className="w-4 h-4" />
              <span>Stream Tokens</span>
              <kbd className="hidden sm:inline-block text-[10px] bg-emerald-800/60 text-emerald-100 px-1.5 py-0.5 rounded border border-emerald-400/40">
                Space
              </kbd>
            </button>
          )}

          <button
            id="step-simulation-btn"
            onClick={onStep}
            disabled={!canStep || isPlaying}
            className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-slate-200 rounded-lg flex items-center gap-2 border border-slate-700 transition-all touch-manipulation"
            title="Advance 1 token (or press S / ArrowRight)"
          >
            <StepForward className="w-4 h-4" />
            <span>Step</span>
            <kbd className="hidden sm:inline-block text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
              S
            </kbd>
          </button>

          <button
            id="reset-simulation-btn"
            onClick={onReset}
            className="min-h-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-lg flex items-center gap-1.5 border border-slate-700 transition-all touch-manipulation"
            title="Reset papers and buffer (or press R)"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
            <kbd className="hidden sm:inline-block text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
              R
            </kbd>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          <span>Agent State:</span>
          <span
            className={`font-bold uppercase px-2 py-1 rounded ${
              agentState === 'alert' || agentState === 'overflow'
                ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                : agentState === 'processing'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {agentState}
          </span>
        </div>
      </div>
    </div>
  );
};
