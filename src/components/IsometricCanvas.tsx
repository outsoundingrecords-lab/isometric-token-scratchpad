import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AgentState, AlertState } from '../types';

interface IsometricCanvasProps {
  agentState: AgentState;
  alertState: AlertState;
  tokenCount: number;
  maxBuffer: number;
  latestTokenText?: string;
  isScratchpadOpen: boolean;
  onToggleScratchpad: () => void;
  ecoMode?: boolean;
  onToggleDevHud?: () => void;
}

export const IsometricCanvas: React.FC<IsometricCanvasProps> = ({
  agentState,
  alertState,
  tokenCount,
  maxBuffer,
  latestTokenText,
  isScratchpadOpen,
  onToggleScratchpad,
  ecoMode = false,
  onToggleDevHud,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHoveringDesk, setIsHoveringDesk] = useState(false);
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number; time: number } | null>(null);

  // Internal logical canvas dimensions (fixed retro GBA aspect ratio for crisp pixel rendering)
  const V_WIDTH = 520;
  const V_HEIGHT = 380;

  // Animation ticks ref
  const animRef = useRef({
    tick: 0,
    typingFrame: 0,
    blinkTimer: 100,
    sweatY: 0,
    sweatActive: false,
    paperJitters: Array.from({ length: 40 }, () => ({
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 4,
      rot: (Math.random() - 0.5) * 0.15,
    })),
  });

  // Desk bounding polygon for hit testing (in logical coordinates)
  // Desk center is around (260, 225)
  const isPointInDesk = useCallback((px: number, py: number) => {
    // Desk surface is an isometric diamond centered at ~ (260, 220)
    // Approximate with bounding diamond / polygon
    const dx = px - 260;
    const dy = py - 220;
    // Diamond condition: |dx| / 90 + |dy| / 45 <= 1
    return Math.abs(dx) / 100 + Math.abs(dy) / 50 <= 1;
  }, []);

  // Handle canvas click / tap
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    const scaleX = V_WIDTH / rect.width;
    const scaleY = V_HEIGHT / rect.height;
    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

    // Trigger ripple
    setClickRipple({ x: clickX, y: clickY, time: Date.now() });

    // Tapping bottom left footer triggers Dev HUD
    if (clickY > 270 && clickX < 260 && onToggleDevHud) {
      onToggleDevHud();
      return;
    }

    // Always toggle scratchpad when tapping the desk or center area
    if (isPointInDesk(clickX, clickY) || (clickY > 160 && clickY <= 270)) {
      onToggleScratchpad();
    }
  };

  // Mouse move for hover highlight
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = V_WIDTH / rect.width;
    const scaleY = V_HEIGHT / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    setIsHoveringDesk(isPointInDesk(mx, my));
  };

  const handleMouseLeave = () => {
    setIsHoveringDesk(false);
  };

  // Main Render Loop with older hardware & battery optimizations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastFrameTime = performance.now();
    const targetFps = ecoMode ? 30 : 60;
    const frameInterval = 1000 / targetFps;
    let isTabVisible = !document.hidden;

    const handleVisibility = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const render = (now: number) => {
      if (!isTabVisible) return;

      const elapsed = now - lastFrameTime;
      if (elapsed < frameInterval) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastFrameTime = now - (elapsed % frameInterval);

      animRef.current.tick++;
      const tick = animRef.current.tick;

      // Update sub-animations
      if (agentState === 'processing' && tick % 6 === 0) {
        animRef.current.typingFrame = (animRef.current.typingFrame + 1) % 4;
      }
      animRef.current.blinkTimer--;
      if (animRef.current.blinkTimer <= 0) {
        animRef.current.blinkTimer = 120 + Math.floor(Math.random() * 80);
      }

      // Configure crisp pixel rendering
      ctx.imageSmoothingEnabled = false;

      // Clear Canvas with retro background
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

      // --- 1. DRAW ISOMETRIC ROOM (GBA / SIMS STYLE) ---
      const originX = 260;
      const originY = 175;
      const tileW = 44;
      const tileH = 22;
      const gridCount = 6;

      // Draw Walls (Back-left and Back-right)
      const wallHeight = 110;
      const backCornerX = originX;
      const backCornerY = originY - (gridCount * tileH) / 2 - 10;
      const leftWallX = originX - (gridCount * tileW) / 2;
      const leftWallY = originY - 10;
      const rightWallX = originX + (gridCount * tileW) / 2;
      const rightWallY = originY - 10;

      // Left Wall
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(backCornerX, backCornerY);
      ctx.lineTo(leftWallX, leftWallY);
      ctx.lineTo(leftWallX, leftWallY - wallHeight);
      ctx.lineTo(backCornerX, backCornerY - wallHeight);
      ctx.closePath();
      ctx.fill();

      // Right Wall
      ctx.fillStyle = '#182234';
      ctx.beginPath();
      ctx.moveTo(backCornerX, backCornerY);
      ctx.lineTo(rightWallX, rightWallY);
      ctx.lineTo(rightWallX, rightWallY - wallHeight);
      ctx.lineTo(backCornerX, backCornerY - wallHeight);
      ctx.closePath();
      ctx.fill();

      // Wall Baseboard moldings
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(leftWallX, leftWallY);
      ctx.lineTo(backCornerX, backCornerY);
      ctx.lineTo(rightWallX, rightWallY);
      ctx.stroke();

      // Wall Poster on Left Wall ("BPE TOKENIZER")
      ctx.save();
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(originX - 105, originY - 135, 42, 30);
      ctx.fillStyle = '#2dd4bf';
      ctx.fillRect(originX - 103, originY - 133, 38, 26);
      ctx.fillStyle = '#134e4a';
      ctx.font = '6px monospace';
      ctx.fillText('BPE TOKENS', originX - 101, originY - 123);
      ctx.fillText('straw|berry', originX - 101, originY - 114);
      ctx.restore();

      // Wall Clock on Right Wall
      ctx.save();
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(originX + 70, originY - 120, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(originX + 70, originY - 120, 10, 0, Math.PI * 2);
      ctx.fill();
      // Clock hands
      const secAngle = (tick % 60) * ((Math.PI * 2) / 60);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(originX + 70, originY - 120);
      ctx.lineTo(originX + 70 + Math.cos(secAngle) * 7, originY - 120 + Math.sin(secAngle) * 7);
      ctx.stroke();
      ctx.restore();

      // Draw Floor Tiles (Diamond Grid)
      for (let x = -3; x < 3; x++) {
        for (let y = -3; y < 3; y++) {
          const isoX = originX + (x - y) * (tileW / 2);
          const isoY = originY + (x + y) * (tileH / 2);

          const isAlt = (x + y) % 2 === 0;
          ctx.fillStyle = isAlt ? '#222f3e' : '#1b2633';
          ctx.beginPath();
          ctx.moveTo(isoX, isoY);
          ctx.lineTo(isoX + tileW / 2, isoY + tileH / 2);
          ctx.lineTo(isoX, isoY + tileH);
          ctx.lineTo(isoX - tileW / 2, isoY + tileH / 2);
          ctx.closePath();
          ctx.fill();

          // Tile borders
          ctx.strokeStyle = '#141c24';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // --- 2. DRAW AGENT CHAIR & SPRITE (BEHIND DESK) ---
      const agentX = originX;
      const agentY = originY + 10;

      // Chair backrest
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(agentX - 16, agentY - 45, 32, 38);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(agentX - 14, agentY - 43, 28, 34);
      // Chair headrest
      ctx.fillStyle = '#334155';
      ctx.fillRect(agentX - 12, agentY - 56, 24, 10);

      // Agent Body (Shirt / Hoodie)
      const isPanic = alertState.isOverflowing || alertState.category !== 'none' || agentState === 'alert';
      ctx.fillStyle = isPanic ? '#e11d48' : '#0284c7'; // red hoodie if alert, sky blue if normal
      ctx.fillRect(agentX - 12, agentY - 26, 24, 22);

      // Arms / Hands
      ctx.fillStyle = '#fcd34d'; // skin tone
      if (agentState === 'processing') {
        const typeOffset = (animRef.current.typingFrame % 2 === 0) ? 2 : -2;
        ctx.fillRect(agentX - 15, agentY - 14 + typeOffset, 6, 8);
        ctx.fillRect(agentX + 9, agentY - 14 - typeOffset, 6, 8);
      } else if (isPanic) {
        // Hands waving in panic
        const panicHandY = Math.sin(tick * 0.3) * 4;
        ctx.fillRect(agentX - 17, agentY - 24 + panicHandY, 6, 8);
        ctx.fillRect(agentX + 11, agentY - 24 - panicHandY, 6, 8);
      } else {
        // Resting hands
        ctx.fillRect(agentX - 14, agentY - 12, 6, 6);
        ctx.fillRect(agentX + 8, agentY - 12, 6, 6);
      }

      // Agent Head
      ctx.fillStyle = '#fcd34d'; // face
      ctx.fillRect(agentX - 10, agentY - 46, 20, 18);

      // Hair
      ctx.fillStyle = '#451a03'; // dark brown pixel hair
      ctx.fillRect(agentX - 11, agentY - 50, 22, 7);
      ctx.fillRect(agentX - 11, agentY - 44, 3, 7);
      ctx.fillRect(agentX + 8, agentY - 44, 3, 7);

      // Eyes
      const isBlinking = animRef.current.blinkTimer < 8 && !isPanic;
      if (isPanic) {
        // Big alarmed wide eyes with sweat drops
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(agentX - 7, agentY - 40, 5, 5);
        ctx.fillRect(agentX + 2, agentY - 40, 5, 5);
        // Small pupils shaking
        const pupilShake = Math.sin(tick * 0.5) * 1;
        ctx.fillStyle = '#000000';
        ctx.fillRect(agentX - 5 + pupilShake, agentY - 38, 2, 2);
        ctx.fillRect(agentX + 4 + pupilShake, agentY - 38, 2, 2);

        // Agitated mouth (open O or zigzag)
        ctx.fillStyle = '#000000';
        ctx.fillRect(agentX - 3, agentY - 32, 6, 3);
      } else if (isBlinking) {
        // Blinked closed eyes
        ctx.fillStyle = '#78350f';
        ctx.fillRect(agentX - 6, agentY - 38, 4, 1);
        ctx.fillRect(agentX + 2, agentY - 38, 4, 1);
      } else {
        // Normal eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(agentX - 6, agentY - 40, 3, 4);
        ctx.fillRect(agentX + 3, agentY - 40, 3, 4);
        // Calm mouth
        ctx.fillStyle = '#78350f';
        ctx.fillRect(agentX - 2, agentY - 32, 4, 1);
      }

      // --- 3. ALERT STATE: SWEAT DROP ANIMATION ---
      if (alertState.hasSweatDrop || isPanic) {
        const sweatFrame = (tick * 0.15) % 1;
        const dropX = agentX - 15;
        const dropY = agentY - 46 + sweatFrame * 14;

        ctx.fillStyle = '#38bdf8'; // light blue sweat
        // Teardrop shape (pixelated)
        ctx.fillRect(dropX + 1, dropY, 2, 1);
        ctx.fillRect(dropX, dropY + 1, 4, 3);
        ctx.fillRect(dropX + 1, dropY + 4, 2, 1);

        // Second sweat drop on right side if high panic
        if (alertState.isOverflowing || alertState.paperCount > 15) {
          const drop2X = agentX + 13;
          const drop2Y = agentY - 44 + ((sweatFrame + 0.5) % 1) * 14;
          ctx.fillRect(drop2X + 1, drop2Y, 2, 1);
          ctx.fillRect(drop2X, drop2Y + 1, 4, 3);
          ctx.fillRect(drop2X + 1, drop2Y + 4, 2, 1);
        }
      }

      // --- 4. ALERT STATE: OVERHEAD RED PROGRESS BAR ---
      const barW = 110;
      const barH = 13;
      const barX = agentX - barW / 2;
      const barY = agentY - 74;

      // Bar Outer Frame
      ctx.fillStyle = '#020617';
      ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
      ctx.strokeStyle = isPanic ? (tick % 16 < 8 ? '#f43f5e' : '#fda4af') : '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

      // Bar Background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(barX, barY, barW, barH);

      // Bar Fill (Calculated from bufferPercent)
      const fillW = Math.min(barW, Math.max(0, (alertState.bufferPercent / 100) * barW));
      let barFillColor = '#10b981'; // green
      if (alertState.bufferPercent >= 90 || alertState.isOverflowing) {
        barFillColor = tick % 10 < 5 ? '#e11d48' : '#be123c'; // flashing intense crimson
      } else if (alertState.bufferPercent >= 65) {
        barFillColor = '#f59e0b'; // amber warning
      }

      ctx.fillStyle = barFillColor;
      ctx.fillRect(barX, barY, fillW, barH);

      // Overhead Bar Label Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      if (alertState.isOverflowing) {
        ctx.fillText(`BUFFER OVERFLOW! ${alertState.bufferPercent}%`, agentX, barY + 9);
      } else if (isPanic) {
        ctx.fillText(`BREAKDOWN: ${tokenCount}/${maxBuffer}`, agentX, barY + 9);
      } else {
        ctx.fillText(`BUFFER: ${tokenCount}/${maxBuffer} (${Math.round(alertState.bufferPercent)}%)`, agentX, barY + 9);
      }

      // --- 5. DRAW ISOMETRIC DESK ---
      const deskW = 160;
      const deskD = 78;
      const deskH = 38;
      const deskSurfaceY = originY + 38;

      // Desk Legs / Front Frame
      const deskLeftX = originX - deskW / 2;
      const deskRightX = originX + deskW / 2;
      const deskTopY = deskSurfaceY - deskD / 2;
      const deskBottomY = deskSurfaceY + deskD / 2;

      // Desk Front Panels
      ctx.fillStyle = '#5c4033'; // dark warm wood shadow
      ctx.beginPath();
      ctx.moveTo(originX, deskBottomY);
      ctx.lineTo(deskRightX, deskSurfaceY);
      ctx.lineTo(deskRightX, deskSurfaceY + deskH);
      ctx.lineTo(originX, deskBottomY + deskH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3b271e';
      ctx.stroke();

      // Desk Left Side Panel
      ctx.fillStyle = '#7a5542';
      ctx.beginPath();
      ctx.moveTo(deskLeftX, deskSurfaceY);
      ctx.lineTo(originX, deskBottomY);
      ctx.lineTo(originX, deskBottomY + deskH);
      ctx.lineTo(deskLeftX, deskSurfaceY + deskH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#4a3328';
      ctx.stroke();

      // Desk Top Surface (Diamond)
      ctx.fillStyle = isHoveringDesk ? '#b58863' : '#a07855'; // warm oak desktop, brightens on hover
      ctx.beginPath();
      ctx.moveTo(originX, deskTopY);
      ctx.lineTo(deskRightX, deskSurfaceY);
      ctx.lineTo(originX, deskBottomY);
      ctx.lineTo(deskLeftX, deskSurfaceY);
      ctx.closePath();
      ctx.fill();

      // Desk Surface Border / Selection Outline
      if (isHoveringDesk) {
        ctx.strokeStyle = tick % 16 < 8 ? '#facc15' : '#38bdf8'; // flashing pixel selection
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = '#4a3328';
        ctx.lineWidth = 1;
      }
      ctx.stroke();

      // --- 6. DESK ACCESSORIES (COMPUTER, KEYBOARD, COFFEE) ---
      // Retro CRT Monitor (Center-Left on desk)
      const monitorX = originX - 32;
      const monitorY = deskSurfaceY - 18;

      // Monitor Stand
      ctx.fillStyle = '#475569';
      ctx.fillRect(monitorX - 4, monitorY + 12, 10, 4);
      ctx.fillRect(monitorX - 8, monitorY + 15, 18, 2);

      // Monitor Casing
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(monitorX - 16, monitorY - 14, 32, 26);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(monitorX - 15, monitorY - 13, 30, 2);

      // Glowing CRT Screen
      ctx.fillStyle = '#064e3b'; // green terminal
      ctx.fillRect(monitorX - 13, monitorY - 11, 26, 20);

      // CRT screen content (scrolling green text or token pulse)
      ctx.fillStyle = isPanic ? '#f43f5e' : '#34d399';
      for (let line = 0; line < 4; line++) {
        const lw = 8 + ((tick + line * 7) % 14);
        ctx.fillRect(monitorX - 11, monitorY - 9 + line * 4, lw, 2);
      }

      // Keyboard (Right in front of monitor/agent)
      const kbX = originX - 12;
      const kbY = deskSurfaceY + 8;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(kbX, kbY, 26, 9);
      ctx.fillStyle = '#cbd5e1';
      for (let k = 0; k < 6; k++) {
        ctx.fillRect(kbX + 2 + k * 4, kbY + 2, 2, 2);
        ctx.fillRect(kbX + 2 + k * 4, kbY + 5, 2, 2);
      }

      // Coffee Mug (Right side of desk)
      const mugX = originX + 54;
      const mugY = deskSurfaceY - 4;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(mugX, mugY, 10, 11);
      // Mug handle
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(mugX + 10, mugY + 2, 3, 6);
      // Coffee dark liquid top
      ctx.fillStyle = '#451a03';
      ctx.fillRect(mugX + 1, mugY + 1, 8, 2);
      // Coffee Steam Particle
      const steamY = (tick * 0.25) % 12;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(mugX + 4 + Math.sin(tick * 0.1) * 2, mugY - 2 - steamY, 2, 2);

      // --- 7. ALERT STATE: FLAT PAPERS PILING UP ON THE DESK ---
      // Piles on the left/front of desk
      const paperStackBaseX = originX + 26;
      const paperStackBaseY = deskSurfaceY + 12;
      const paperCount = Math.min(35, alertState.paperCount);

      if (paperCount > 0) {
        for (let i = 0; i < paperCount; i++) {
          const jitter = animRef.current.paperJitters[i] || { dx: 0, dy: 0, rot: 0 };
          const pY = paperStackBaseY - i * 2.2;
          const pX = paperStackBaseX + jitter.dx * 0.4;

          ctx.save();
          ctx.translate(pX, pY);
          ctx.rotate(jitter.rot);

          // Paper Sheet (Flat Isometric Quad)
          ctx.fillStyle = (i % 5 === 0 && isPanic) ? '#fee2e2' : '#f8fafc'; // slightly reddish if warning
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 0.75;

          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(16, 2);
          ctx.lineTo(2, 10);
          ctx.lineTo(-14, 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Tiny simulated lines of printed tokens on top paper
          if (i === paperCount - 1) {
            ctx.fillStyle = isPanic ? '#f43f5e' : '#64748b';
            ctx.fillRect(-6, 0, 8, 1);
            ctx.fillRect(-4, 3, 10, 1);
          }

          ctx.restore();
        }

        // Paper Count Badge on stack if high
        if (paperCount >= 6) {
          ctx.fillStyle = isPanic ? '#be123c' : '#0f766e';
          ctx.fillRect(paperStackBaseX + 18, paperStackBaseY - paperCount * 2.2 - 10, 24, 12);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${paperCount} pgs`, paperStackBaseX + 30, paperStackBaseY - paperCount * 2.2 - 2);
        }
      }

      // --- 8. HOVER & TAP INDICATORS ---
      if (isHoveringDesk) {
        // Floating "TAP DESK" badge
        const badgeX = originX;
        const badgeY = deskBottomY + 24;
        ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
        ctx.fillRect(badgeX - 68, badgeY - 10, 136, 20);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1;
        ctx.strokeRect(badgeX - 68, badgeY - 10, 136, 20);

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isScratchpadOpen ? '⚡ TAP DESK TO CLOSE PAD' : '📋 TAP DESK FOR SCRATCHPAD', badgeX, badgeY + 4);
      }

      // Click Ripple Effect
      if (clickRipple) {
        const elapsed = Date.now() - clickRipple.time;
        if (elapsed < 400) {
          const progress = elapsed / 400;
          const radius = progress * 32;
          ctx.strokeStyle = `rgba(56, 189, 248, ${1 - progress})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(clickRipple.x, clickRipple.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // --- 9. RETRO HUD MARQUEE (BOTTOM CORNER) ---
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(10, V_HEIGHT - 32, V_WIDTH - 20, 24);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, V_HEIGHT - 32, V_WIDTH - 20, 24);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `PROFILE: WIREFRAME TIER 1 | 0% GPU | ${ecoMode ? 'ECO (30 FPS)' : '60 FPS'} | PAPERS: ${paperCount}`,
        18,
        V_HEIGHT - 17
      );

      ctx.textAlign = 'right';
      ctx.fillStyle = isScratchpadOpen ? '#38bdf8' : '#e2e8f0';
      ctx.fillText(
        isScratchpadOpen ? '[SCRATCHPAD OPEN]' : '[TAP DESK FOR SCRATCHPAD]',
        V_WIDTH - 18,
        V_HEIGHT - 17
      );

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      cancelAnimationFrame(animationFrameId);
    };
  }, [agentState, alertState, tokenCount, maxBuffer, isHoveringDesk, clickRipple, isScratchpadOpen, isPointInDesk, ecoMode]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] max-h-[440px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center select-none"
    >
      <canvas
        ref={canvasRef}
        width={V_WIDTH}
        height={V_HEIGHT}
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full object-contain cursor-pointer"
        style={{
          imageRendering: 'pixelated',
          touchAction: 'manipulation',
        }}
      />

      {/* Floating Quick Tap Desk Shortcut Pill on mobile / desktop */}
      <button
        id="desk-tap-button"
        onClick={onToggleScratchpad}
        className="absolute top-3 right-3 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-xs font-mono text-cyan-300 border border-cyan-500/40 rounded-md shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        {isScratchpadOpen ? 'Close Scratchpad' : 'Tap Desk / Scratchpad'}
      </button>

      {/* Alert Banner overlay when critical breakdown or buffer overflow occurs */}
      {alertState.category !== 'none' && (
        <div className="absolute top-3 left-3 px-3 py-1.5 bg-rose-950/90 border border-rose-500/60 rounded-md text-rose-200 text-xs font-mono flex items-center gap-2 shadow-lg animate-bounce">
          <span className="text-base leading-none">⚠️</span>
          <span>{alertState.reason}</span>
        </div>
      )}
    </div>
  );
};
