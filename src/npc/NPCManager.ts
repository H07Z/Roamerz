/**
 * NPCManager - Phase 8 Homes & Buildings
 * Manages NPCs with pathfinding, navigation grid, pathfinder, and home buildings
 */

import { NPC, NPCData, NPCPoint } from './NPC';
import { WorldMap } from '../world/WorldMap';
import { CollisionSystem } from '../collision/CollisionSystem';
import { WorldRenderer } from '../world/WorldRenderer';
import { NavigationGrid } from '../pathfinding/NavigationGrid';
import { Pathfinder } from '../pathfinding/Pathfinder';
import { CollisionMap } from '../collision/CollisionMap';
import { BuildingManager } from '../building/BuildingManager';

export class NPCManager {
  private npcs: Map<string, NPC> = new Map();
  private navigationGrid: NavigationGrid | null = null;
  private pathfinder: Pathfinder | null = null;
  private buildingManager: BuildingManager | null = null;

  constructor() {}

  initialize(
    worldMap: WorldMap | null,
    collisionMap: CollisionMap | null = null,
    navigationGrid: NavigationGrid | null = null,
    pathfinder: Pathfinder | null = null,
    buildingManager: BuildingManager | null = null
  ): void {
    console.log('[NPCManager] Initializing Phase 8 - Homes & Buildings...');

    this.npcs.clear();

    // Setup navigation grid and pathfinder
    if (navigationGrid) {
      this.navigationGrid = navigationGrid;
    } else if (collisionMap) {
      this.navigationGrid = NavigationGrid.fromCollisionMap(collisionMap);
    } else if (worldMap) {
      this.navigationGrid = NavigationGrid.fromWorldMap(worldMap);
    }

    if (pathfinder) {
      this.pathfinder = pathfinder;
      if (this.navigationGrid) {
        this.pathfinder.setNavigationGrid(this.navigationGrid);
      }
    } else {
      this.pathfinder = new Pathfinder(false); // 4-dir for reliability
      if (this.navigationGrid) {
        this.pathfinder.setNavigationGrid(this.navigationGrid);
      }
      this.pathfinder.setRecalculationCooldown(2000);
    }

    // Phase 8: Building manager
    this.buildingManager = buildingManager;

    const tileSize = WorldRenderer.TILE_SIZE;

    // Define 5 NPCs - now with pathfinding, they will navigate around obstacles
    // PointA and PointB must be walkable (not inside HOUSE which is BLOCKED)
    const npcDefinitions: { data: NPCData; pointA: NPCPoint; pointB: NPCPoint }[] = [
      {
        data: {
          id: 'NPC001',
          name: 'Farmer Joe',
          role: 'farmer',
          x: 15 * tileSize + 16,
          y: 31 * tileSize + 16,
          speed: 40,
          direction: 'down' as any,
          state: 'IDLE' as any,
          homeId: 'HOUSE001'
        },
        pointA: { x: 15 * tileSize + 16, y: 31 * tileSize + 16 }, // Farm (walkable)
        pointB: { x: 25 * tileSize + 16, y: 20 * tileSize + 16 }  // Village square
      },
      {
        data: {
          id: 'NPC002',
          name: 'Shopkeeper',
          role: 'shopkeeper',
          x: 34 * tileSize + 16,
          y: 13 * tileSize + 16,
          speed: 35,
          direction: 'down' as any,
          state: 'IDLE' as any,
          homeId: 'HOUSE002'
        },
        pointA: { x: 34 * tileSize + 16, y: 13 * tileSize + 16 }, // Door of HOUSE002 (walkable ROAD)
        pointB: { x: 22 * tileSize + 16, y: 18 * tileSize + 16 }  // Square
      },
      {
        data: {
          id: 'NPC003',
          name: 'Blacksmith',
          role: 'blacksmith',
          x: 18 * tileSize + 16,
          y: 25 * tileSize + 16,
          speed: 30,
          direction: 'right' as any,
          state: 'IDLE' as any,
          homeId: 'HOUSE003'
        },
        pointA: { x: 18 * tileSize + 16, y: 25 * tileSize + 16 }, // Door of HOUSE003 (walkable)
        pointB: { x: 28 * tileSize + 16, y: 20 * tileSize + 16 }  // Square / workshop
      },
      {
        data: {
          id: 'NPC004',
          name: 'Villager',
          role: 'villager',
          x: 30 * tileSize + 16,
          y: 26 * tileSize + 16,
          speed: 45,
          direction: 'up' as any,
          state: 'IDLE' as any,
          homeId: 'HOUSE004'
        },
        pointA: { x: 30 * tileSize + 16, y: 26 * tileSize + 16 }, // Door of HOUSE004
        pointB: { x: 24 * tileSize + 16, y: 19 * tileSize + 16 }  // Square
      },
      {
        data: {
          id: 'NPC005',
          name: 'Child',
          role: 'child',
          x: 10 * tileSize + 16,
          y: 19 * tileSize + 16,
          speed: 60,
          direction: 'right' as any,
          state: 'IDLE' as any,
          homeId: 'HOUSE005'
        },
        pointA: { x: 10 * tileSize + 16, y: 19 * tileSize + 16 },  // Door of HOUSE005
        pointB: { x: 25 * tileSize + 16, y: 17 * tileSize + 16 }  // Near square playground
      }
    ];

    for (const def of npcDefinitions) {
      const npc = new NPC(def.data, def.pointA, def.pointB);
      if (this.pathfinder) {
        npc.setPathfinder(this.pathfinder);
      }

      // Phase 8: Link home building
      if (this.buildingManager && def.data.homeId) {
        const homeBuilding = this.buildingManager.getBuilding(def.data.homeId);
        if (homeBuilding) {
          npc.setHomeBuilding(homeBuilding);
          console.log(`[NPCManager] ${npc.id} home linked to ${homeBuilding.id} at door ${homeBuilding.door.x},${homeBuilding.door.y}`);
        } else {
          console.warn(`[NPCManager] ${npc.id} home ${def.data.homeId} not found in BuildingManager`);
        }
      }

      if (this.pathfinder) {
        // Immediately request path to B for testing
        const tileB = { x: Math.floor(def.pointB.x / tileSize), y: Math.floor(def.pointB.y / tileSize) };
        npc.requestPath(tileB);
      }

      this.npcs.set(npc.id, npc);
      console.log(`[NPCManager] Created ${npc.id} - ${npc.name} (${npc.role}) at ${npc.x.toFixed(0)},${npc.y.toFixed(0)} speed=${npc.speed} home=${def.data.homeId} path to ${def.pointB.x.toFixed(0)},${def.pointB.y.toFixed(0)}`);
    }

    console.log(`[NPCManager] Initialized ${this.npcs.size} NPCs with pathfinding and homes`);
    if (this.navigationGrid) {
      console.log(`[NPCManager] Navigation grid:`, this.navigationGrid.getCounts());
    }
    if (this.buildingManager) {
      console.log(`[NPCManager] Building manager:`, this.buildingManager.getCounts());
    }
  }

  setBuildingManager(buildingManager: BuildingManager): void {
    this.buildingManager = buildingManager;
    // Update all NPCs with their home buildings
    for (const npc of this.npcs.values()) {
      if (npc.getHomeId()) {
        const home = buildingManager.getBuilding(npc.getHomeId()!);
        if (home) {
          npc.setHomeBuilding(home);
        }
      }
    }
  }

  getBuildingManager(): BuildingManager | null {
    return this.buildingManager;
  }

  setPathfinder(pathfinder: Pathfinder): void {
    this.pathfinder = pathfinder;
    for (const npc of this.npcs.values()) {
      npc.setPathfinder(pathfinder);
    }
  }

  setNavigationGrid(grid: NavigationGrid): void {
    this.navigationGrid = grid;
    if (this.pathfinder) {
      this.pathfinder.setNavigationGrid(grid);
    }
  }

  getNavigationGrid(): NavigationGrid | null {
    return this.navigationGrid;
  }

  getPathfinder(): Pathfinder | null {
    return this.pathfinder;
  }

  update(deltaTime: number, worldMap: WorldMap | null, collisionSystem: CollisionSystem | null): void {
    for (const npc of this.npcs.values()) {
      npc.update(deltaTime, worldMap, collisionSystem);
    }
  }

  getNPC(id: string): NPC | undefined {
    return this.npcs.get(id);
  }

  getAllNPCs(): NPC[] {
    return Array.from(this.npcs.values());
  }

  getNPCsByRole(role: string): NPC[] {
    return Array.from(this.npcs.values()).filter(npc => npc.role === role);
  }

  getCount(): number {
    return this.npcs.size;
  }

  getNPCsNear(x: number, y: number, radius: number): NPC[] {
    const result: NPC[] = [];
    for (const npc of this.npcs.values()) {
      const dx = npc.x - x;
      const dy = npc.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) result.push(npc);
    }
    return result;
  }

  // For Phase 7 tests
  requestAllToDestination(tileX: number, tileY: number): void {
    for (const npc of this.npcs.values()) {
      npc.requestPath({ x: tileX, y: tileY });
    }
  }

  getStats(): { totalRequests: number; successful: number; failed: number } {
    if (!this.pathfinder) return { totalRequests: 0, successful: 0, failed: 0 };
    const stats = this.pathfinder.getStats();
    return { totalRequests: stats.total, successful: stats.successful, failed: stats.failed };
  }
}
