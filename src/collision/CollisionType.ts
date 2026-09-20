/**
 * CollisionType - Phase 4
 * Defines collision types separate from visual terrain
 * Keeps collision information separate from graphics as per spec
 */

export enum CollisionType {
  WALKABLE = 0,
  BLOCKED = 1,
  INTERACTABLE = 2
}

export interface CollisionProperties {
  type: CollisionType;
  name: string;
  walkable: boolean;
  blocksMovement: boolean;
  isInteractable: boolean;
  debugColor: string;
}

export const COLLISION_PROPERTIES: Record<CollisionType, CollisionProperties> = {
  [CollisionType.WALKABLE]: {
    type: CollisionType.WALKABLE,
    name: 'Walkable',
    walkable: true,
    blocksMovement: false,
    isInteractable: false,
    debugColor: 'rgba(100, 255, 100, 0.2)'
  },
  [CollisionType.BLOCKED]: {
    type: CollisionType.BLOCKED,
    name: 'Blocked',
    walkable: false,
    blocksMovement: true,
    isInteractable: false,
    debugColor: 'rgba(255, 100, 100, 0.4)'
  },
  [CollisionType.INTERACTABLE]: {
    type: CollisionType.INTERACTABLE,
    name: 'Interactable',
    walkable: true,
    blocksMovement: false,
    isInteractable: true,
    debugColor: 'rgba(255, 255, 100, 0.4)'
  }
};

export function isWalkable(type: CollisionType): boolean {
  return COLLISION_PROPERTIES[type].walkable;
}

export function isBlocked(type: CollisionType): boolean {
  return COLLISION_PROPERTIES[type].blocksMovement;
}
