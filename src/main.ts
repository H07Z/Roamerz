/**
 * Roamerz - Phase 7 Pathfinding
 * A* navigation, path request, failure handling, stuck detection, debug view
 */

import { Game } from './core/Game';

function bootstrap(): void {
  console.log('%c ROAMERZ - Living World Adventure ', 'background:#1a2e1a; color:#8f8; font-size:14px; padding:4px;');
  console.log('Phase 7 - NPC Pathfinding (A*)');
  console.log('NavigationGrid separate from visual, A* 4-dir, path request, validation, stuck detection');

  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    console.error('Canvas not found!');
    return;
  }

  try {
    const game = new Game(canvas);

    (window as any).ROAMERZ_GAME = game;
    (window as any).ROAMERZ_PATHFINDER = game.getPathfinder();
    (window as any).ROAMERZ_NAVGRID = game.getNavigationGrid();
    (window as any).ROAMERZ_NPCS = game.getNPCManager();

    game.initialize();
    game.start();

    console.log('[Bootstrap] Started');
    console.log('Phase 7 Tests:');
    console.log('  Test1: NPC→nearby (press 5)');
    console.log('  Test2: around building (press 6)');
    console.log('  Test3: across bridge (press 7)');
    console.log('  Test4: blocked dest water (press 8)');
    console.log('  Test5: no path 0,0 (press 9)');
    console.log('  Test6: obstacle added (press O) should recalculate');
    console.log('  Test7: multiple NPCs simultaneously (already)');
    console.log('  Press T to run all tests');
    console.log('Controls: N paths, M nav grid, P print states, Z zoom, X smoothing');

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
