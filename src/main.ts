/**
 * Roamerz - Living World Adventure Game
 * Phase 2 Entry Point
 *
 * Objective: First small village map
 * - Village, forest entrance, road, square, houses, farm, river, bridge
 * - World grid system
 * - Terrain types visually distinguishable
 * - Map data separate from logic
 */

import { Game } from './core/Game';

function bootstrap(): void {
  console.log('%c ROAMERZ - Living World Adventure ', 'background:#1a2e1a; color:#8f8; font-size:14px; padding:4px;');
  console.log('Phase 2 - World Map');
  console.log('Technology: TypeScript + Vite + HTML5 Canvas');
  console.log('Map: village_01 - Greenhollow Village 50x40');

  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;

  if (!canvas) {
    console.error('Game canvas not found! #game-canvas');
    const loading = document.getElementById('loading');
    if (loading) loading.textContent = 'ERROR: Canvas not found';
    return;
  }

  try {
    const game = new Game(canvas);

    // Expose for debugging in console (Phase 2 debug tool)
    (window as any).ROAMERZ_GAME = game;
    (window as any).ROAMERZ_WORLD = game.getWorld();
    (window as any).ROAMERZ_WORLD_RENDERER = game.getWorldRenderer();

    // Initialize
    game.initialize();

    // Start loop
    game.start();

    console.log('[Bootstrap] Game started successfully');
    console.log('[Bootstrap] Phase 2 Controls:');
    console.log('  - WASD / Arrows + E to pan map');
    console.log('  - C to center on village square');
    console.log('  - G to toggle grid');
    console.log('  - B to toggle tile coords');
    console.log('  - D to toggle debug overlay');
    console.log('  - H to toggle help');
    console.log('  - R to reset timer + center');
    console.log('  - window.ROAMERZ_GAME for console access');
    console.log('  - window.ROAMERZ_WORLD.getCurrentMap() to inspect map data');

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
