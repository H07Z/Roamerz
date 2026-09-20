/**
 * NeedType - Phase 10 NPC Life Simulation
 * Defines NPC needs and their properties
 */

export enum NeedType {
  ENERGY = 'ENERGY',       // Restored by sleeping/home
  HUNGER = 'HUNGER',       // Restored by eating
  SOCIAL = 'SOCIAL',       // Restored by socializing
  HAPPINESS = 'HAPPINESS', // Affected by other needs, work, play
  HEALTH = 'HEALTH'        // Overall health, affected by other needs
}

export interface NeedProperties {
  type: NeedType;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  criticalColor: string;
  decayRate: number; // per game hour, 0-100 scale
  restoreRate: number; // per second when doing restorative activity
  criticalThreshold: number; // below this is critical
  description: string;
}

const NEED_PROPERTIES: Record<NeedType, NeedProperties> = {
  [NeedType.ENERGY]: {
    type: NeedType.ENERGY,
    name: 'Energy',
    icon: '⚡',
    color: '#ffeb3b',
    bgColor: 'rgba(255, 235, 59, 0.3)',
    criticalColor: '#ff9800',
    decayRate: 4, // 4 per hour awake, 24h = 96 drain
    restoreRate: 15, // 15 per second while sleeping
    criticalThreshold: 20,
    description: 'Restored by sleeping'
  },
  [NeedType.HUNGER]: {
    type: NeedType.HUNGER,
    name: 'Hunger',
    icon: '🍖',
    color: '#8bc34a',
    bgColor: 'rgba(139, 195, 74, 0.3)',
    criticalColor: '#f44336',
    decayRate: 5, // 5 per hour
    restoreRate: 25, // 25 per second while eating
    criticalThreshold: 25,
    description: 'Restored by eating'
  },
  [NeedType.SOCIAL]: {
    type: NeedType.SOCIAL,
    name: 'Social',
    icon: '💬',
    color: '#03a9f4',
    bgColor: 'rgba(3, 169, 244, 0.3)',
    criticalColor: '#9c27b0',
    decayRate: 3, // 3 per hour alone
    restoreRate: 10, // 10 per second while socializing
    criticalThreshold: 20,
    description: 'Restored by socializing'
  },
  [NeedType.HAPPINESS]: {
    type: NeedType.HAPPINESS,
    name: 'Happiness',
    icon: '😊',
    color: '#ff9800',
    bgColor: 'rgba(255, 152, 0, 0.3)',
    criticalColor: '#795548',
    decayRate: 1, // slow decay
    restoreRate: 5, // restored by play, social, home
    criticalThreshold: 30,
    description: 'Affected by other needs and activities'
  },
  [NeedType.HEALTH]: {
    type: NeedType.HEALTH,
    name: 'Health',
    icon: '❤️',
    color: '#f44336',
    bgColor: 'rgba(244, 67, 54, 0.3)',
    criticalColor: '#b71c1c',
    decayRate: 0.5, // very slow, only when other needs critical
    restoreRate: 2,
    criticalThreshold: 30,
    description: 'Overall health, critical if low'
  }
};

export function getNeedProperties(type: NeedType): NeedProperties {
  return NEED_PROPERTIES[type];
}

export function getAllNeedTypes(): NeedType[] {
  return Object.values(NeedType);
}

export function getCriticalNeeds(needs: Map<NeedType, number>): NeedType[] {
  const critical: NeedType[] = [];
  for (const [type, value] of needs.entries()) {
    const props = getNeedProperties(type);
    if (value < props.criticalThreshold) {
      critical.push(type);
    }
  }
  return critical;
}
