/**
 * Roamerz - Phase 5+6
 * Phase 5: Camera System (follow, boundaries, clamping, smooth, zoom)
 * Phase 6: NPC Foundation (5 NPCs, IDLE/WALK, A↔B movement)
 */

import { Game } from './core/Game';

function bootstrap(): void {
  console.log('%c ROAMERZ - Living World Adventure ', 'background:#1a2e1a; color:#8f8; font-size:14px; padding:4px;');
  console.log('Phase 5 - Camera System + Phase 6 - NPC Foundation');
  console.log('Camera: follow, clamp, smooth (5), zoom, deadZone');
  console.log('NPCs: 5 with A↔B movement test');

  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    console.error('Canvas not found!');
    return;
  }

  try {
    const game = new Game(canvas);

    (window as any).ROAMERZ_GAME = game;
    (window as any).ROAMERZ_CAMERA = game.getCamera();
    (window as any).ROAMERZ_NPCS = game.getNPCManager();
    (window as any).ROAMERZ_PLAYER = game.getPlayer();
    (window as any).ROAMERZ_COLLISION = game.getCollisionSystem();

    game.initialize();
    game.start();

    console.log('[Bootstrap] Started');
    console.log('Phase 5 Tests: player visible, camera follows, no outside world, no shake, smooth');
    console.log('Phase 6 Tests: NPCs render, move A↔B, stop, no crash, state changes');
    console.log('Controls: WASD move, Z zoom, X smoothing, N NPC paths, P NPC states, K collision, etc');

  } catch (err) {
    console.error('Failed:', err);
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
