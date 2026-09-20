/**
 * InteractionSystem - Phase 11 Player Interaction & Dialogue
 * Detects nearby interactable NPCs and buildings, handles interaction input
 */

import { Player } from '../player/Player';
import { NPC } from '../npc/NPC';
import { Building } from '../building/Building';
import { BuildingManager } from '../building/BuildingManager';

export enum InteractableType {
  NPC = 'NPC',
  BUILDING = 'BUILDING',
  NONE = 'NONE'
}

export interface Interactable {
  type: InteractableType;
  id: string;
  name: string;
  distance: number;
  npc?: NPC;
  building?: Building;
  prompt: string;
}

export class InteractionSystem {
  private interactionRange: number = 60; // pixels
  private currentInteractable: Interactable | null = null;
  private nearbyInteractables: Interactable[] = [];
  private totalInteractions: number = 0;

  constructor() {}

  update(
    player: Player | null,
    npcs: NPC[],
    buildingManager: BuildingManager | null
  ): void {
    if (!player) {
      this.currentInteractable = null;
      this.nearbyInteractables = [];
      return;
    }

    const playerPos = player.getPosition();
    this.nearbyInteractables = [];

    // Check NPCs
    for (const npc of npcs) {
      // Skip if NPC is inside building
      if (npc.state === 'INSIDE' as any || npc.state === 'SLEEPING' as any) continue;

      const npcPos = npc.getPosition();
      const dx = npcPos.x - playerPos.x;
      const dy = npcPos.y - playerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= this.interactionRange) {
        this.nearbyInteractables.push({
          type: InteractableType.NPC,
          id: npc.id,
          name: npc.name,
          distance: dist,
          npc: npc,
          prompt: `Press E to talk to ${npc.name} (${npc.role})`
        });
      }
    }

    // Check buildings (doors)
    if (buildingManager) {
      const buildings = buildingManager.getAllBuildings();
      for (const building of buildings) {
        const doorWorld = building.getDoorWorldPosition();
        const dx = doorWorld.x - playerPos.x;
        const dy = doorWorld.y - playerPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= this.interactionRange + 20) { // slightly larger for buildings
          const occupied = building.getIsOccupied();
          const prompt = occupied 
            ? `${building.name} (Occupied by ${building.getOccupantId()}) - Press E to knock`
            : `${building.name} (${building.type}) - Press E to interact`;

          this.nearbyInteractables.push({
            type: InteractableType.BUILDING,
            id: building.id,
            name: building.name,
            distance: dist,
            building: building,
            prompt: prompt
          });
        }
      }
    }

    // Sort by distance and pick closest
    this.nearbyInteractables.sort((a, b) => a.distance - b.distance);
    
    // Prioritize NPCs over buildings if both nearby and NPC is close
    const closestNPC = this.nearbyInteractables.find(i => i.type === InteractableType.NPC);
    const closestBuilding = this.nearbyInteractables.find(i => i.type === InteractableType.BUILDING);
    
    if (closestNPC && closestBuilding) {
      // If NPC is within 40px, prioritize NPC, otherwise closest
      if (closestNPC.distance <= 40 || closestNPC.distance <= closestBuilding.distance) {
        this.currentInteractable = closestNPC;
      } else {
        this.currentInteractable = closestBuilding;
      }
    } else {
      this.currentInteractable = this.nearbyInteractables[0] ?? null;
    }
  }

  getCurrentInteractable(): Interactable | null {
    return this.currentInteractable;
  }

  getNearbyInteractables(): Interactable[] {
    return this.nearbyInteractables;
  }

  hasInteractable(): boolean {
    return this.currentInteractable !== null;
  }

  canInteractWithNPC(): boolean {
    return this.currentInteractable?.type === InteractableType.NPC;
  }

  canInteractWithBuilding(): boolean {
    return this.currentInteractable?.type === InteractableType.BUILDING;
  }

  getInteractableNPC(): NPC | null {
    return this.currentInteractable?.npc ?? null;
  }

  getInteractableBuilding(): Building | null {
    return this.currentInteractable?.building ?? null;
  }

  recordInteraction(): void {
    this.totalInteractions++;
  }

  getTotalInteractions(): number {
    return this.totalInteractions;
  }

  getInteractionRange(): number {
    return this.interactionRange;
  }

  setInteractionRange(range: number): void {
    this.interactionRange = range;
  }

  getDebugString(): string {
    if (!this.currentInteractable) return 'No interactable nearby';
    return `${this.currentInteractable.type} ${this.currentInteractable.name} ${this.currentInteractable.distance.toFixed(0)}px - ${this.currentInteractable.prompt}`;
  }
}
