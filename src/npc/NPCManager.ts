/**
 * NPCManager - Phase 6
 * Manages all NPCs, updates, and provides access
 */

import { NPC, NPCData, NPCPoint } from './NPC';
import { WorldMap } from '../world/WorldMap';
import { CollisionSystem } from '../collision/CollisionSystem';
import { WorldRenderer } from '../world/WorldRenderer';

export class NPCManager {
  private npcs: Map<string, NPC> = new Map();

  constructor() {}

  initialize(worldMap: WorldMap | null): void {
    console.log('[NPCManager] Initializing Phase 6 - NPC Foundation...');

    this.npcs.clear();

    const tileSize = WorldRenderer.TILE_SIZE;

    // Define 5 NPCs as per Phase 6 spec
    // Each has two points to move between for testing movement without pathfinding

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
        pointA: { x: 15 * tileSize + 16, y: 31 * tileSize + 16 }, // Farm
        pointB: { x: 25 * tileSize + 16, y: 20 * tileSize + 16 }  // Village square
      },
      {
        data: {
          id: 'NPC002',
          name: 'Shopkeeper',
          role: 'shopkeeper',
          x: 32 * tileSize + 16,
          y: 13 * tileSize + 16,
          speed: 35,
          direction: 'down' as any,
          state: 'WALK' as any,
          homeId: 'HOUSE002'
        },
        pointA: { x: 32 * tileSize + 16, y: 13 * tileSize + 16 }, // Near shop (HOUSE002)
        pointB: { x: 22 * tileSize + 16, y: 18 * tileSize + 16 }  // Square
      },
      {
        data: {
          id: 'NPC003',
          name: 'Blacksmith',
          role: 'blacksmith',
          x: 15 * tileSize + 16,
          y: 25 * tileSize + 16,
          speed: 30,
          direction: 'right' as any,
          state: 'IDLE' as any,
          homeId: 'HOUSE003'
        },
        pointA: { x: 15 * tileSize + 16, y: 25 * tileSize + 16 }, // HOUSE003
        pointB: { x: 28 * tileSize + 16, y: 20 * tileSize + 16 }  // Square / workshop
      },
      {
        data: {
          id: 'NPC004',
          name: 'Villager',
          role: 'villager',
          x: 28 * tileSize + 16,
          y: 26 * tileSize + 16,
          speed: 45,
          direction: 'up' as any,
          state: 'WALK' as any,
          homeId: 'HOUSE004'
        },
        pointA: { x: 28 * tileSize + 16, y: 26 * tileSize + 16 }, // HOUSE004
        pointB: { x: 24 * tileSize + 16, y: 19 * tileSize + 16 }  // Square
      },
      {
        data: {
          id: 'NPC005',
          name: 'Child',
          role: 'child',
          x: 5 * tileSize + 16,
          y: 17 * tileSize + 16,
          speed: 60,
          direction: 'right' as any,
          state: 'IDLE' as any,
          homeId: 'HOUSE005'
        },
        pointA: { x: 5 * tileSize + 16, y: 17 * tileSize + 16 },  // HOUSE005
        pointB: { x: 25 * tileSize + 16, y: 17 * tileSize + 16 }  // Near square playground
      }
    ];

    for (const def of npcDefinitions) {
      const npc = new NPC(def.data, def.pointA, def.pointB);
      this.npcs.set(npc.id, npc);
      console.log(`[NPCManager] Created ${npc.id} - ${npc.name} (${npc.role}) at ${npc.x.toFixed(0)},${npc.y.toFixed(0)} speed=${npc.speed}`);
    }

    console.log(`[NPCManager] Initialized ${this.npcs.size} NPCs`);
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

  // For debugging
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
}
