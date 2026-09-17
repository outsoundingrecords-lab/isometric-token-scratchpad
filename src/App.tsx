/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { PRESET_SCENARIOS, simulateTokenize } from './utils/tokenizer';
import { PresetScenario, TokenItem, AgentState, AlertState } from './types';
import { IsometricCanvas } from './components/IsometricCanvas';
import { Scratchpad } from './components/Scratchpad';
import { ControlPanel } from './components/ControlPanel';
import { DevModeOverlay } from './components/DevModeOverlay';
import { playRetroTokenBlip, playDeskTapSound } from './utils/sound';
import { serializeStateToHash, deserializeStateFromHash, SharedBreakdownState } from './utils/shareState';
import {
  Volume2,
  VolumeX,
  Cpu,
  Sparkles,
  Layers,
  Info,
  Maximize2,
  Minimize2,
  Share2,
  Check,
  Activity,
  Play,
  Pause,
  StepForward,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  // Scenario state
  const [currentScenario, setCurrentScenario] = useState<PresetScenario>(PRESET_SCENARIOS[0]);
  const [allScenarioTokens, setAllScenarioTokens] = useState<TokenItem[]>(PRESET_SCENARIOS[0].initialTokens);
  const [streamedTokens, setStreamedTokens] = useState<TokenItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Agent and Alert States
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [bufferLimit, setBufferLimit] = useState<number>(PRESET_SCENARIOS[0].maxBuffer);
  const [paperCount, setPaperCount] = useState<number>(1);
  const [alertCategory, setAlertCategory] = useState<AlertState['category']>('none');
  const [alertReason, setAlertReason] = useState<string>('');

  // UI, immersion, and playback state
  const [isScratchpadOpen, setIsScratchpadOpen] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(180);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [ecoMode, setEcoMode] = useState<boolean>(false);
  const [isImmersionMode, setIsImmersionMode] = useState<boolean>(false);
  const [showDevHud, setShowDevHud] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Prompt & Gemini Integration
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [useLiveGemini, setUseLiveGemini] = useState<boolean>(false);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check server health and Gemini API key availability
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasGeminiKey) {
          setHasGeminiKey(true);
        }
      })
      .catch(() => {
        // Local mode fallback
      });
  }, []);

  // Compute Alert State
  const bufferPercent = Math.min(150, (streamedTokens.length / Math.max(1, bufferLimit)) * 100);
  const isOverflowing = streamedTokens.length >= bufferLimit;

  const currentAlertState: AlertState = {
    hasSweatDrop: alertCategory !== 'none' || isOverflowing || agentState === 'alert',
    sweatFrame: 0,
    hasOverheadBar: true,
    bufferPercent,
    isOverflowing,
    paperCount,
    reason: alertReason || (isOverflowing ? 'Context Buffer Overflow (>100% capacity)!' : ''),
    category: isOverflowing ? 'buffer_overflow' : alertCategory,
  };

  // Reset simulation for a scenario
  const resetSimulation = useCallback((scenario: PresetScenario, newTokens?: TokenItem[]) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    const tokens = newTokens || scenario.initialTokens;
    setAllScenarioTokens(tokens);
    setStreamedTokens([]);
    setCurrentIndex(0);
    setAgentState('idle');
    setPaperCount(1);
    setAlertCategory('none');
    setAlertReason('');
    setBufferLimit(scenario.maxBuffer);
  }, []);

  // Handle Scenario Switch
  const handleSelectScenario = (sc: PresetScenario) => {
    setCurrentScenario(sc);
    resetSimulation(sc);
  };

  // Step 1 token forward
  const advanceToken = useCallback(() => {
    if (currentIndex >= allScenarioTokens.length) {
      setIsPlaying(false);
      setAgentState(alertCategory !== 'none' ? 'alert' : 'complete');
      return;
    }

    const nextToken = allScenarioTokens[currentIndex];
    const newStreamed = [...streamedTokens, nextToken];
    const nextIdx = currentIndex + 1;

    setStreamedTokens(newStreamed);
    setCurrentIndex(nextIdx);
    setAgentState('processing');

    // Check if token triggers breakdown
    const isBreakdown = !!nextToken.isBreakdown;
    const isBufferOver = newStreamed.length >= bufferLimit;

    if (isBreakdown) {
      setAlertCategory(currentScenario.category === 'reversal' ? 'char_reversal' : 'letter_count');
      setAlertReason(nextToken.breakdownNote || 'Tokenization breakdown in progress');
      // Rapid paper stacking on breakdown!
      setPaperCount((prev) => Math.min(35, prev + 3));
    } else if (isBufferOver) {
      setAlertCategory('buffer_overflow');
      setAlertReason(`Buffer Overflow: Exceeded ${bufferLimit} tokens!`);
      // Rapid paper stacking on overflow!
      setPaperCount((prev) => Math.min(35, prev + 2));
    } else {
      // Normal token progression: slow paper stacking (1 paper every 3 tokens)
      if (nextIdx % 3 === 0) {
        setPaperCount((prev) => Math.min(35, prev + 1));
      }
    }

    // Play retro 8-bit blip sound
    playRetroTokenBlip(isBreakdown || isBufferOver, soundEnabled);

    // If reached end
    if (nextIdx >= allScenarioTokens.length) {
      setIsPlaying(false);
      setAgentState(isBreakdown || isBufferOver ? 'alert' : 'complete');
    }
  }, [allScenarioTokens, currentIndex, streamedTokens, bufferLimit, alertCategory, currentScenario.category, soundEnabled]);

  // Handle Play/Pause
  const handleStart = () => {
    if (currentIndex >= allScenarioTokens.length) {
      // Re-run from beginning if completed
      setStreamedTokens([]);
      setCurrentIndex(0);
      setPaperCount(1);
      setAlertCategory('none');
      setAlertReason('');
    }
    setIsPlaying(true);
    setAgentState('processing');
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Playback timer effect
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        advanceToken();
      }, speedMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, advanceToken, speedMs]);

  // Desk Tap toggle handler
  const handleToggleDesk = useCallback(() => {
    playDeskTapSound(soundEnabled);
    setIsScratchpadOpen((prev) => !prev);
  }, [soundEnabled]);

  // Immersion Mode toggle handler
  const handleToggleImmersion = useCallback(() => {
    setIsImmersionMode((prev) => !prev);
  }, []);

  // Function to generate a URL-encoded hash of current streamedTokens & scenario
  const handleShareState = useCallback(() => {
    const statePayload: SharedBreakdownState = {
      v: 1,
      scenarioId: currentScenario.id,
      customPrompt: currentScenario.id.startsWith('custom') ? customPrompt : undefined,
      bufferLimit,
      speedMs,
      tokens: streamedTokens,
      paperCount,
      alertCategory,
      timestamp: Date.now(),
    };
    const hash = serializeStateToHash(statePayload);
    if (hash) {
      window.location.hash = `state=${hash}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(window.location.href)
          .then(() => {
            setToastMessage('Breakdown URL copied to clipboard! Ready to share.');
            setTimeout(() => setToastMessage(null), 3500);
          })
          .catch(() => {
            setToastMessage('Breakdown state encoded in URL address bar!');
            setTimeout(() => setToastMessage(null), 3500);
          });
      } else {
        setToastMessage('Breakdown state encoded in URL address bar!');
        setTimeout(() => setToastMessage(null), 3500);
      }
    }
  }, [currentScenario, customPrompt, bufferLimit, speedMs, streamedTokens, paperCount, alertCategory]);

  // Restore shared breakdown state from URL hash if present
  useEffect(() => {
    const loadStateFromUrl = () => {
      const hash = window.location.hash;
      if (!hash || !hash.includes('state=')) return;
      const restored = deserializeStateFromHash(hash);
      if (restored && Array.isArray(restored.tokens) && restored.tokens.length > 0) {
        setStreamedTokens(restored.tokens);
        setCurrentIndex(restored.tokens.length);
        if (restored.bufferLimit) setBufferLimit(restored.bufferLimit);
        if (restored.paperCount) setPaperCount(restored.paperCount);
        if (restored.speedMs) setSpeedMs(restored.speedMs);
        if (restored.alertCategory) setAlertCategory(restored.alertCategory);
        setAgentState(
          restored.tokens.length >= (restored.bufferLimit || 32) ? 'overflow' : 'complete'
        );

        const matched = PRESET_SCENARIOS.find((s) => s.id === restored.scenarioId);
        if (matched) {
          setCurrentScenario(matched);
          setAllScenarioTokens(matched.initialTokens);
        } else if (restored.customPrompt) {
          setCustomPrompt(restored.customPrompt);
          setCurrentScenario({
            id: 'custom-shared',
            title: 'Shared Breakdown State',
            subtitle: `"${restored.customPrompt.slice(0, 24)}..."`,
            prompt: restored.customPrompt,
            category: 'reversal',
            description: 'Imported token breakdown state from shared URL.',
            breakdownExplanation: 'Preserved subword token predictions and logit distributions.',
            maxBuffer: restored.bufferLimit || 32,
            initialTokens: restored.tokens,
          });
        }
        setToastMessage('Restored shared token breakdown state from URL!');
        setTimeout(() => setToastMessage(null), 4000);
      }
    };

    loadStateFromUrl();
    window.addEventListener('hashchange', loadStateFromUrl);
    return () => window.removeEventListener('hashchange', loadStateFromUrl);
  }, []);

  // Global Keyboard Shortcuts for easy interface experience on desktops / laptops
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
          handlePause();
        } else {
          handleStart();
        }
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowRight') {
        e.preventDefault();
        advanceToken();
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleToggleDesk();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetSimulation(currentScenario);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleImmersion();
      } else if (e.key === 'Escape' && isImmersionMode) {
        e.preventDefault();
        setIsImmersionMode(false);
      } else if (
        e.key === '`' ||
        e.key === '~' ||
        (e.shiftKey && (e.key === 'D' || e.key === 'd'))
      ) {
        e.preventDefault();
        setShowDevHud((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPlaying,
    advanceToken,
    handleToggleDesk,
    resetSimulation,
    currentScenario,
    handleToggleImmersion,
    isImmersionMode,
  ]);

  // Custom Prompt Execution
  const handleRunCustomPrompt = async () => {
    if (!customPrompt.trim()) return;

    if (useLiveGemini && hasGeminiKey) {
      // Stream directly from Gemini 3.8 Flash via SSE
      handleStartLiveGemini(customPrompt);
    } else {
      // Use client-side sub-word tokenizer simulator
      const simulatedTokens = simulateTokenize(customPrompt);
      const customScenario: PresetScenario = {
        id: 'custom',
        title: 'Custom Prompt',
        subtitle: `"${customPrompt.slice(0, 24)}..."`,
        prompt: customPrompt,
        category: /reverse/i.test(customPrompt) ? 'reversal' : 'counting',
        description: 'Analyzing token boundaries and predictions for custom input.',
        breakdownExplanation: 'Simulated subword token predictions and logit distributions.',
        maxBuffer: Math.max(24, Math.min(128, simulatedTokens.length + 8)),
        initialTokens: simulatedTokens,
      };

      setCurrentScenario(customScenario);
      resetSimulation(customScenario, simulatedTokens);
      setIsPlaying(true);
    }
  };

  // Live Gemini SSE streaming handler
  const handleStartLiveGemini = async (promptText: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setStreamedTokens([]);
    setCurrentIndex(0);
    setPaperCount(1);
    setAlertCategory('none');
    setAlertReason('');
    setAgentState('processing');

    try {
      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, maxTokens: bufferLimit }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Gemini stream failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const collectedTokens: TokenItem[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        const lines = textChunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                const subTokens = simulateTokenize(data.token);
                subTokens.forEach((tok) => {
                  collectedTokens.push(tok);
                  setStreamedTokens([...collectedTokens]);
                  playRetroTokenBlip(false, soundEnabled);

                  if (collectedTokens.length % 3 === 0) {
                    setPaperCount((p) => Math.min(35, p + 1));
                  }
                  if (collectedTokens.length >= bufferLimit) {
                    setAlertCategory('buffer_overflow');
                    setPaperCount((p) => Math.min(35, p + 2));
                  }
                });
              }
            } catch {
              // Ignore line parse errors
            }
          }
        }
      }

      setAllScenarioTokens(collectedTokens);
      setAgentState(collectedTokens.length >= bufferLimit ? 'overflow' : 'complete');
    } catch {
      // Fallback to local tokenizer
      const simulated = simulateTokenize(promptText);
      setAllScenarioTokens(simulated);
      setStreamedTokens(simulated);
      setAgentState('complete');
    }
  };

  // If Immersion Mode is active, render full-focus viewport
  if (isImmersionMode) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-3 sm:p-6 overflow-hidden select-none font-mono">
        {/* Floating Immersion Top HUD */}
        <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 shadow-lg">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-xs">
              T1
            </div>
            <span className="font-bold text-slate-200">IMMERSION MODE</span>
            <span className="hidden sm:inline-block text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              Focused Isometric Agent
            </span>
            {currentAlertState.category !== 'none' && (
              <span className="text-[10px] text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 animate-pulse">
                💧 Alert Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="immersion-share-btn"
              onClick={handleShareState}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-300 border border-slate-700 text-xs transition-colors"
              title="Copy breakdown share URL"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              id="immersion-dev-btn"
              onClick={() => setShowDevHud(!showDevHud)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                showDevHud
                  ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Toggle Dev Performance HUD (press ~ or Shift+D)"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Dev HUD</span>
              <kbd className="text-[9px] bg-slate-900 text-slate-400 px-1 rounded border border-slate-700">~</kbd>
            </button>

            <button
              id="immersion-sound-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title={soundEnabled ? 'Disable Sound' : 'Enable Sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              id="exit-immersion-btn"
              onClick={() => setIsImmersionMode(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-slate-950 font-bold text-xs shadow transition-all"
              title="Exit Immersion Mode (or press F / Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit [F]</span>
            </button>
          </div>
        </div>

        {/* Center: Full Focus on Isometric Agent */}
        <div className="flex-1 flex items-center justify-center p-2 min-h-0">
          <div className="w-full max-w-4xl max-h-full aspect-[480/300] flex items-center justify-center">
            <IsometricCanvas
              agentState={agentState}
              alertState={currentAlertState}
              tokenCount={streamedTokens.length}
              maxBuffer={bufferLimit}
              latestTokenText={streamedTokens[streamedTokens.length - 1]?.text}
              isScratchpadOpen={isScratchpadOpen}
              onToggleScratchpad={handleToggleDesk}
              ecoMode={ecoMode}
              onToggleDevHud={() => setShowDevHud((prev) => !prev)}
            />
          </div>
        </div>

        {/* Floating Immersion Bottom Playback Controls */}
        <div className="max-w-xl mx-auto w-full bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 shadow-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {isPlaying ? (
              <button
                id="immersion-pause-btn"
                onClick={handlePause}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 shadow active:scale-95"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                id="immersion-stream-btn"
                onClick={handleStart}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 shadow active:scale-95"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Stream</span>
              </button>
            )}

            <button
              id="immersion-step-btn"
              onClick={advanceToken}
              disabled={currentIndex >= allScenarioTokens.length || isPlaying}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg flex items-center gap-1 border border-slate-700"
            >
              <StepForward className="w-3.5 h-3.5" />
              <span>Step</span>
            </button>

            <button
              id="immersion-reset-btn"
              onClick={() => resetSimulation(currentScenario)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>
              Buffer: <strong className="text-slate-200">{streamedTokens.length}/{bufferLimit}</strong>
            </span>
            <span>
              Papers: <strong className="text-cyan-400">{paperCount}</strong>
            </span>
            <button
              onClick={handleToggleDesk}
              className="hidden sm:inline-block text-[10px] text-cyan-300 underline hover:text-cyan-200"
            >
              Desk [D]
            </button>
          </div>
        </div>

        {/* Dev Mode Performance Overlay */}
        <DevModeOverlay
          isOpen={showDevHud}
          onClose={() => setShowDevHud(false)}
          ecoMode={ecoMode}
          paperCount={paperCount}
          tokenCount={streamedTokens.length}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-2 rounded-lg shadow-2xl text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Retro Profile Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 py-3 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-mono font-bold text-sm shadow-inner">
              T1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold font-mono tracking-tight text-slate-100">
                  Tier 1: Minimalist Agent Profile
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  Zero GPU Strain
                </span>
                <span className="hidden md:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Apache-2.0 • Security Audited
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono hidden sm:block">
                Visual Metaphor: 2.5D Isometric Pixel Art • Canvas 2D • Live Model Scratchpad
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Share Breakdown Link Button */}
            <button
              id="header-share-btn"
              onClick={handleShareState}
              title="Copy link to share current token breakdown state"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700 transition-colors flex items-center gap-1 text-xs font-mono"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Immersion Mode Button */}
            <button
              id="header-immersion-btn"
              onClick={handleToggleImmersion}
              title="Focus solely on the isometric agent (press F)"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors flex items-center gap-1 text-xs font-mono"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Immersion</span>
              <kbd className="text-[9px] bg-slate-900 text-slate-400 px-1 rounded border border-slate-700">F</kbd>
            </button>

            {/* Dev Mode Performance HUD Button */}
            <button
              id="header-devhud-btn"
              onClick={() => setShowDevHud(!showDevHud)}
              title="Toggle Dev Performance HUD (press ~ or Shift+D)"
              className={`px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs font-mono ${
                showDevHud
                  ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">Dev HUD</span>
              <kbd className="text-[9px] bg-slate-900 text-slate-400 px-1 rounded border border-slate-700">~</kbd>
            </button>

            {/* Audio Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Disable 8-bit retro sound' : 'Enable 8-bit retro sound'}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Tap Desk / Scratchpad Indicator Button */}
            <button
              id="header-scratchpad-btn"
              onClick={handleToggleDesk}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all flex items-center gap-1.5 ${
                isScratchpadOpen
                  ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isScratchpadOpen ? 'Scratchpad [OPEN]' : 'Desk [CLOSED]'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-5">
        {/* Core Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: ISOMETRIC CANVAS & CONTROL PANEL (7 columns on desktop) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* 2.5D Isometric Canvas */}
            <IsometricCanvas
              agentState={agentState}
              alertState={currentAlertState}
              tokenCount={streamedTokens.length}
              maxBuffer={bufferLimit}
              latestTokenText={streamedTokens[streamedTokens.length - 1]?.text}
              isScratchpadOpen={isScratchpadOpen}
              onToggleScratchpad={handleToggleDesk}
              ecoMode={ecoMode}
              onToggleDevHud={() => setShowDevHud((prev) => !prev)}
            />

            {/* Quick Metrics Bar directly under canvas */}
            <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Context Buffer</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5 flex items-center justify-between">
                  <span>{streamedTokens.length} / {bufferLimit}</span>
                  <span className={`text-[11px] ${bufferPercent >= 90 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                    {Math.round(bufferPercent)}%
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Paper Stack</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5 flex items-center justify-between">
                  <span>{paperCount} sheets</span>
                  <span className="text-[11px] text-cyan-400">
                    {paperCount > 15 ? '⚠️ High' : 'Normal'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Agent Alert</div>
                <div className="text-sm font-bold truncate mt-0.5">
                  {currentAlertState.category !== 'none' ? (
                    <span className="text-rose-400 flex items-center gap-1 animate-pulse">
                      💧 Sweat / Alert
                    </span>
                  ) : agentState === 'processing' ? (
                    <span className="text-cyan-400">⌨️ Typing</span>
                  ) : (
                    <span className="text-slate-400">😴 Idle</span>
                  )}
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <ControlPanel
              currentScenario={currentScenario}
              onSelectScenario={handleSelectScenario}
              agentState={agentState}
              onStart={handleStart}
              onPause={handlePause}
              onStep={advanceToken}
              onReset={() => resetSimulation(currentScenario)}
              isPlaying={isPlaying}
              canStep={currentIndex < allScenarioTokens.length}
              customPrompt={customPrompt}
              onChangeCustomPrompt={setCustomPrompt}
              onRunCustomPrompt={handleRunCustomPrompt}
              bufferLimit={bufferLimit}
              onChangeBufferLimit={(limit) => {
                setBufferLimit(limit);
              }}
              speedMs={speedMs}
              onChangeSpeed={setSpeedMs}
              useLiveGemini={useLiveGemini}
              onToggleLiveGemini={setUseLiveGemini}
              hasGeminiKey={hasGeminiKey}
              ecoMode={ecoMode}
              onToggleEcoMode={setEcoMode}
              onToggleImmersion={handleToggleImmersion}
              onShareState={handleShareState}
              onToggleDevHud={() => setShowDevHud((prev) => !prev)}
            />

            {/* Quick Keyboard Navigation Bar */}
            <div className="hidden sm:flex items-center justify-between px-3 py-2 bg-slate-900/40 border border-slate-800/80 rounded-lg text-[11px] font-mono text-slate-400">
              <span className="text-slate-300 font-medium">⌨️ Quick Keys:</span>
              <div className="flex flex-wrap items-center gap-2.5">
                <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">Space</kbd> Stream/Pause</span>
                <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">S</kbd> Step</span>
                <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">D</kbd> Desk</span>
                <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">R</kbd> Reset</span>
                <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">F</kbd> Immersion</span>
                <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">~</kbd> Dev HUD</span>
              </div>
            </div>
          </div>

          {/* RIGHT: FLAT SCROLLABLE MODEL SCRATCHPAD (5 columns on desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {isScratchpadOpen ? (
              <Scratchpad
                tokens={streamedTokens}
                alertState={currentAlertState}
                tokenCount={streamedTokens.length}
                maxBuffer={bufferLimit}
                isOpen={isScratchpadOpen}
                onClose={() => setIsScratchpadOpen(false)}
                selectedScenarioTitle={currentScenario.title}
                breakdownExplanation={currentScenario.breakdownExplanation}
              />
            ) : (
              /* Docked Callout Card when Scratchpad is closed */
              <div
                onClick={handleToggleDesk}
                className="bg-slate-900/60 border border-dashed border-slate-700/80 rounded-xl p-6 text-center cursor-pointer hover:border-cyan-400 hover:bg-slate-900 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold font-mono text-slate-200">
                  Model Scratchpad Docked
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Tapping the desk in the isometric view (or clicking this card) opens the raw token predictions in real time.
                </p>
                <button className="mt-4 px-4 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 rounded-md font-mono text-xs">
                  Open Model Scratchpad
                </button>
              </div>
            )}

            {/* Profile Architecture Specification Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-400 space-y-2.5">
              <div className="flex items-center gap-1.5 text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Profile Specification: Tier 1
              </div>
              <ul className="space-y-1.5 text-[11px] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Target:</strong> Low-end mobile web and embedded viewports.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Render Cost:</strong> 100% Canvas 2D with integer pixel snapping. Zero GPU shaders.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Metaphor:</strong> Stylized 2.5D isometric pixel art (similar to early Sims &amp; GBA).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Alert States:</strong> Pixel sweat drop, red overhead buffer bar, and papers piling up on the desk when tokenization breaks down.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Dev Mode Performance Overlay */}
      <DevModeOverlay
        isOpen={showDevHud}
        onClose={() => setShowDevHud(false)}
        ecoMode={ecoMode}
        paperCount={paperCount}
        tokenCount={streamedTokens.length}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-2 rounded-lg shadow-2xl text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
