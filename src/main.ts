/**
 * Roamerz - Living World Adventure Game
 * Phase 3 Entry Point
 *
 * Objective: Single player with movement
 * - Player rectangle/circle placeholder
 * - WASD + Arrows, diagonal support
 * - deltaTime based movement
 * - IDLE/WALK states, direction
 * - World boundary clamping
 */

import { Game } from './core/Game';

function bootstrap(): void {
  console.log('%c ROAMERZ - Living World Adventure ', 'background:#1a2e1a; color:#8f8; font-size:14px; padding:4px;');
  console.log('Phase 3 - Player Movement');
  console.log('Technology: TypeScript + Vite + HTML5 Canvas');
  console.log('Map: village_01 - Greenhollow Village 50x40');
  console.log('Player: 150 px/s, 8-dir, deltaTime, boundary clamped');

  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;

  if (!canvas) {
    console.error('Game canvas not found! #game-canvas');
    const loading = document.getElementById('loading');
    if (loading) loading.textContent = 'ERROR: Canvas not found';
    return;
  }

  try {
    const game = new Game(canvas);

    // Expose for debugging
    (window as any).ROAMERZ_GAME = game;
    (window as any).ROAMERZ_WORLD = game.getWorld();
    (window as any).ROAMERZ_WORLD_RENDERER = game.getWorldRenderer();
    (window as any).ROAMERZ_PLAYER = game.getPlayer();

    game.initialize();
    game.start();

    console.log('[Bootstrap] Game started successfully');
    console.log('[Bootstrap] Phase 3 Controls:');
    console.log('  - WASD / Arrows - Move player (diagonal supported)');
    console.log('  - C - Center on player');
    console.log('  - V - Center on village square');
    console.log('  - G - Toggle grid');
    console.log('  - B - Toggle tile coords');
    console.log('  - ` / F2 / Shift+D - Toggle debug overlay');
    console.log('  - H - Toggle help');
    console.log('  - R - Reset player to village square');
    console.log('  - window.ROAMERZ_GAME.getPlayer() - inspect player data');
    console.log('  - Player speed uses deltaTime, consistent at any FPS');

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('[Game] Tab hidden - loop continues');
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
