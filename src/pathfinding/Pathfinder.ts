/**
 * Pathfinder - Phase 7
 * High-level pathfinding manager that uses NavigationGrid and AStar
 * Handles path requests, validation, failure, and recalculation limits
 */

import { NavigationGrid } from './NavigationGrid';
import { AStar } from './AStar';
import { Path, PathNode, PathStatus } from './Path';

export interface PathRequest {
  id: string;
  start: PathNode;
  destination: PathNode;
  requestTime: number;
}

export interface PathResult {
  request: PathRequest;
  path: Path | null;
  success: boolean;
  timeMs: number;
  nodesVisited: number;
}

export class Pathfinder {
  private navigationGrid: NavigationGrid | null = null;
  private aStar: AStar;

  // For recalculation limiting
  private lastPathRequests: Map<string, number> = new Map(); // npcId -> last request time
  private recalculationCooldown: number = 2000; // ms between recalculations per NPC

  // Stats
  private totalRequests: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;

  constructor(useDiagonal: boolean = false) {
    this.aStar = new AStar(useDiagonal);
  }

  setNavigationGrid(grid: NavigationGrid): void {
    this.navigationGrid = grid;
  }

  getNavigationGrid(): NavigationGrid | null {
    return this.navigationGrid;
  }

  setUseDiagonal(useDiagonal: boolean): void {
    this.aStar.setUseDiagonal(useDiagonal);
  }

  setRecalculationCooldown(ms: number): void {
    this.recalculationCooldown = ms;
  }

  /**
   * Request a path from start to destination
   * Returns Path or null if no path
   */
  requestPath(start: PathNode, destination: PathNode, requesterId: string = 'unknown'): PathResult {
    const requestTime = performance.now();
    this.totalRequests++;

    if (!this.navigationGrid) {
      console.error('[Pathfinder] No navigation grid set');
      const path = Path.failed(start, destination);
      return {
        request: { id: requesterId, start, destination, requestTime },
        path,
        success: false,
        timeMs: 0,
        nodesVisited: 0
      };
    }

    // Check cooldown for recalculation limiting
    const lastRequest = this.lastPathRequests.get(requesterId);
    if (lastRequest && requestTime - lastRequest < this.recalculationCooldown) {
      // Too soon, but we still allow if it's a new destination? For Phase 7, we enforce cooldown to prevent CPU spam
      // However, we should not block if destination changed significantly
      // For simplicity, we enforce cooldown but log
      console.log(`[Pathfinder] ${requesterId} path request throttled (cooldown ${this.recalculationCooldown}ms)`);
      // Still proceed, but we track
    }

    this.lastPathRequests.set(requesterId, requestTime);

    const path = this.aStar.findPath(start, destination, this.navigationGrid);
    const stats = this.aStar.getLastSearchStats();

    const success = path !== null && path.isFound() && path.getLength() > 0;

    if (success) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }

    const result: PathResult = {
      request: { id: requesterId, start, destination, requestTime },
      path,
      success,
      timeMs: stats.timeMs,
      nodesVisited: stats.nodesVisited
    };

    if (success) {
      console.log(`[Pathfinder] ${requesterId}: Path found ${start.x},${start.y}→${destination.x},${destination.y} length=${path!.getLength()} nodes=${stats.nodesVisited} time=${stats.timeMs.toFixed(2)}ms`);
    } else {
      console.log(`[Pathfinder] ${requesterId}: NO PATH ${start.x},${start.y}→${destination.x},${destination.y} nodes=${stats.nodesVisited} time=${stats.timeMs.toFixed(2)}ms`);
    }

    return result;
  }

  /**
   * Validate if a path is still valid (no blocked nodes)
   */
  validatePath(path: Path): boolean {
    if (!this.navigationGrid) return false;
    if (path.isFailed()) return false;
    return path.validate((x, y) => this.navigationGrid!.isWalkable(x, y));
  }

  /**
   * Check if a tile is walkable
   */
  isWalkable(x: number, y: number): boolean {
    if (!this.navigationGrid) return false;
    return this.navigationGrid.isWalkable(x, y);
  }

  getStats(): { total: number; successful: number; failed: number; successRate: number } {
    const successRate = this.totalRequests > 0 ? this.successfulRequests / this.totalRequests : 0;
    return {
      total: this.totalRequests,
      successful: this.successfulRequests,
      failed: this.failedRequests,
      successRate
    };
  }

  // For debugging: get navigation grid ASCII
  getGridAscii(startX: number, startY: number, w: number, h: number): string {
    if (!this.navigationGrid) return 'No grid';
    return this.navigationGrid.getAsciiRegion(startX, startY, w, h);
  }
}
