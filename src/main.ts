/**
 * Roamerz - Living World Adventure Game
 * Phase 4 Entry Point
 *
 * Objective: Collision System
 * - WALKABLE, BLOCKED, INTERACTABLE
 * - Prevent walking through trees, rocks, water, houses
 * - Bridge remains walkable
 * - Collision separate from graphics
 */

import { Game } from './core/Game';

function bootstrap(): void {
  console.log('%c ROAMERZ - Living World Adventure ', 'background:#1a2e1a; color:#8f8; font-size:14px; padding:4px;');
  console.log('Phase 4 - Collision System');
  console.log('Technology: TypeScript + Vite + HTML5 Canvas');
  console.log('Collision: WALKABLE/BLOCKED/INTERACTABLE separate from graphics');

  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;

  if (!canvas) {
    console.error('Game canvas not found!');
    const loading = document.getElementById('loading');
    if (loading) loading.textContent = 'ERROR: Canvas not found';
    return;
  }

  try {
    const game = new Game(canvas);

    (window as any).ROAMERZ_GAME = game;
    (window as any).ROAMERZ_WORLD = game.getWorld();
    (window as any).ROAMERZ_PLAYER = game.getPlayer();
    (window as any).ROAMERZ_COLLISION = game.getCollisionSystem();

    game.initialize();
    game.start();

    console.log('[Bootstrap] Game started successfully');
    console.log('[Bootstrap] Phase 4 Tests:');
    console.log('  - Player → Tree should stop');
    console.log('  - Player → Rock should stop');
    console.log('  - Player → Water should stop');
    console.log('  - Player → House should stop');
    console.log('  - Player → Bridge should cross');
    console.log('  - Test corners/diagonal');
    console.log('[Bootstrap] Controls:');
    console.log('  - WASD/Arrows move');
    console.log('  - K toggle collision overlay (red=blocked, yellow=interact)');
    console.log('  - 1/2/3/4 teleport to test areas');
    console.log('  - window.ROAMERZ_COLLISION for collision debug');

  } catch (err) {
    console.error('[Bootstrap] Failed:', err);
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
