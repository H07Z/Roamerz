/**
 * Roamerz - Living World Adventure Game
 * Phase 1 Entry Point
 *
 * Objective: Smallest possible working game application
 * - Game window
 * - Rendering surface
 * - Basic game loop
 * - Simple background
 * - FPS/debug information
 */

import { Game } from './core/Game';

function bootstrap(): void {
  console.log('%c ROAMERZ - Living World Adventure ', 'background:#1a2e1a; color:#8f8; font-size:14px; padding:4px;');
  console.log('Phase 1 - Project Foundation');
  console.log('Technology: TypeScript + Vite + HTML5 Canvas');

  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;

  if (!canvas) {
    console.error('Game canvas not found! #game-canvas');
    const loading = document.getElementById('loading');
    if (loading) loading.textContent = 'ERROR: Canvas not found';
    return;
  }

  try {
    const game = new Game(canvas);

    // Expose for debugging in console (Phase 1 debug tool)
    (window as any).ROAMERZ_GAME = game;

    // Initialize
    game.initialize();

    // Start loop
    game.start();

    console.log('[Bootstrap] Game started successfully');
    console.log('[Bootstrap] Available debug commands:');
    console.log('  - Press D to toggle debug overlay');
    console.log('  - Press R to reset game timer');
    console.log('  - window.ROAMERZ_GAME for console access');

    // Handle page visibility to pause/resume logging (optional)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('[Game] Tab hidden - loop continues but you may want to pause in future phases');
      }
    });

  } catch (err) {
    console.error('[Bootstrap] Failed to start game:', err);
    const loading = document.getElementById('loading');
    if (loading) {
      loading.textContent = `ERROR: ${(err as Error).message}`;
      loading.style.display = 'block';
      loading.style.color = '#f88';
    }
  }
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
