/**
 * AStar - Phase 7
 * Grid-based A* pathfinding implementation
 * Separate from NPC logic, reusable
 */

import { NavigationGrid } from './NavigationGrid';
import { Path, PathNode, PathStatus } from './Path';

interface AStarNode {
  x: number;
  y: number;
  g: number; // cost from start
  h: number; // heuristic to end
  f: number; // g + h
  parent: AStarNode | null;
}

export class AStar {
  // For performance tracking
  private lastSearchNodesVisited: number = 0;
  private lastSearchTimeMs: number = 0;

  // 4-directional movement (up, down, left, right) - more reliable, no corner cutting
  private readonly directions4 = [
    { x: 0, y: -1, cost: 1 },
    { x: 0, y: 1, cost: 1 },
    { x: -1, y: 0, cost: 1 },
    { x: 1, y: 0, cost: 1 }
  ];

  // 8-directional movement (includes diagonals) - optional, with corner checks
  private readonly directions8 = [
    { x: 0, y: -1, cost: 1 },
    { x: 0, y: 1, cost: 1 },
    { x: -1, y: 0, cost: 1 },
    { x: 1, y: 0, cost: 1 },
    { x: -1, y: -1, cost: 1.4 },
    { x: 1, y: -1, cost: 1.4 },
    { x: -1, y: 1, cost: 1.4 },
    { x: 1, y: 1, cost: 1.4 }
  ];

  private useDiagonal: boolean = false;

  constructor(useDiagonal: boolean = false) {
    this.useDiagonal = useDiagonal;
  }

  setUseDiagonal(useDiagonal: boolean): void {
    this.useDiagonal = useDiagonal;
  }

  findPath(start: PathNode, end: PathNode, grid: NavigationGrid): Path | null {
    const startTime = performance.now();

    // Validate start and end
    if (!grid.isWalkable(start.x, start.y)) {
      console.warn(`[AStar] Start not walkable: ${start.x},${start.y}`);
      return Path.failed(start, end);
    }
    if (!grid.isWalkable(end.x, end.y)) {
      console.warn(`[AStar] Destination not walkable: ${end.x},${end.y}`);
      return Path.notFound(start, end);
    }

    // If start == end
    if (start.x === end.x && start.y === end.y) {
      return new Path([start], PathStatus.FOUND);
    }

    const openList: AStarNode[] = [];
    const closedSet: Set<string> = new Set();
    const openMap: Map<string, AStarNode> = new Map(); // for quick lookup

    const startNode: AStarNode = {
      x: start.x,
      y: start.y,
      g: 0,
      h: this.heuristic(start, end),
      f: 0,
      parent: null
    };
    startNode.f = startNode.g + startNode.h;

    openList.push(startNode);
    openMap.set(`${start.x},${start.y}`, startNode);

    let nodesVisited = 0;
    const directions = this.useDiagonal ? this.directions8 : this.directions4;

    while (openList.length > 0) {
      // Find node with lowest f in open list
      // For performance, we sort openList each iteration (simple) - could use heap for larger maps
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift()!;
      openMap.delete(`${current.x},${current.y}`);
      closedSet.add(`${current.x},${current.y}`);
      nodesVisited++;

      // Reached destination
      if (current.x === end.x && current.y === end.y) {
        const pathNodes = this.reconstructPath(current);
        this.lastSearchNodesVisited = nodesVisited;
        this.lastSearchTimeMs = performance.now() - startTime;
        return new Path(pathNodes, PathStatus.FOUND);
      }

      // Explore neighbors
      for (const dir of directions) {
        const neighborX = current.x + dir.x;
        const neighborY = current.y + dir.y;
        const key = `${neighborX},${neighborY}`;

        // Skip if already closed
        if (closedSet.has(key)) continue;

        // Skip if not walkable
        if (!grid.isWalkable(neighborX, neighborY)) continue;

        // For diagonal movement, check if cutting corners through blocked tiles
        if (this.useDiagonal && dir.cost > 1) {
          // Check if both adjacent cardinal tiles are blocked (corner cutting)
          const horizWalkable = grid.isWalkable(current.x + dir.x, current.y);
          const vertWalkable = grid.isWalkable(current.x, current.y + dir.y);
          if (!horizWalkable || !vertWalkable) {
            continue; // Don't cut corners
          }
        }

        const gCost = current.g + dir.cost;
        const hCost = this.heuristic({ x: neighborX, y: neighborY }, end);
        const fCost = gCost + hCost;

        const existingNode = openMap.get(key);

        if (!existingNode) {
          // New node
          const neighborNode: AStarNode = {
            x: neighborX,
            y: neighborY,
            g: gCost,
            h: hCost,
            f: fCost,
            parent: current
          };
          openList.push(neighborNode);
          openMap.set(key, neighborNode);
        } else if (gCost < existingNode.g) {
          // Better path found
          existingNode.g = gCost;
          existingNode.f = fCost;
          existingNode.parent = current;
        }
      }

      // Safety: prevent excessive search (for very large maps or no path)
      if (nodesVisited > grid.width * grid.height * 2) {
        console.warn(`[AStar] Search exceeded max nodes, aborting`);
        break;
      }
    }

    // No path found
    this.lastSearchNodesVisited = nodesVisited;
    this.lastSearchTimeMs = performance.now() - startTime;
    console.log(`[AStar] No path found from ${start.x},${start.y} to ${end.x},${end.y} after ${nodesVisited} nodes`);
    return Path.notFound(start, end);
  }

  private heuristic(a: PathNode, b: PathNode): number {
    // Manhattan distance for 4-dir, Chebyshev/Euclidean for 8-dir
    if (this.useDiagonal) {
      // Octile distance for 8-dir
      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y - b.y);
      return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
    } else {
      // Manhattan for 4-dir
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
  }

  private reconstructPath(endNode: AStarNode): PathNode[] {
    const path: PathNode[] = [];
    let current: AStarNode | null = endNode;
    while (current) {
      path.push({ x: current.x, y: current.y });
      current = current.parent;
    }
    path.reverse();
    return path;
  }

  getLastSearchStats(): { nodesVisited: number; timeMs: number } {
    return { nodesVisited: this.lastSearchNodesVisited, timeMs: this.lastSearchTimeMs };
  }
}
