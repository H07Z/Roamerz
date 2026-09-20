/**
 * Dialogue - Phase 11 Player Interaction & Dialogue
 * Data structures for dialogue trees
 */

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string | null; // null means end dialogue
  condition?: {
    need?: string; // e.g., 'HUNGER' < 30
    item?: string; // requires item
    time?: { start: number; end: number }; // time of day condition
    wellbeing?: number; // minimum wellbeing
  };
  action?: {
    giveItem?: string;
    takeItem?: string;
    restoreNeed?: { type: string; amount: number };
    setFlag?: string;
    coins?: number;
  };
  icon?: string;
}

export interface DialogueNode {
  id: string;
  speaker: 'NPC' | 'PLAYER';
  speakerName?: string;
  text: string;
  choices: DialogueChoice[];
  isEnd?: boolean;
  action?: {
    restoreNeed?: { type: string; amount: number };
    giveItem?: string;
    coins?: number;
  };
}

export interface Dialogue {
  id: string;
  npcId: string;
  npcName: string;
  role: string;
  startNodeId: string;
  nodes: Map<string, DialogueNode>;
  flags?: Map<string, boolean>;
}

export class DialogueBuilder {
  static createNode(
    id: string,
    speaker: 'NPC' | 'PLAYER',
    text: string,
    choices: DialogueChoice[] = [],
    speakerName?: string,
    isEnd: boolean = false
  ): DialogueNode {
    return {
      id,
      speaker,
      speakerName,
      text,
      choices,
      isEnd
    };
  }

  static createChoice(
    id: string,
    text: string,
    nextNodeId: string | null,
    icon?: string,
    condition?: DialogueChoice['condition'],
    action?: DialogueChoice['action']
  ): DialogueChoice {
    return {
      id,
      text,
      nextNodeId,
      icon,
      condition,
      action
    };
  }

  static replacePlaceholders(text: string, context: {
    playerName?: string;
    npcName?: string;
    role?: string;
    time?: string;
    day?: number;
    phase?: string;
    wellbeing?: number;
    needs?: string;
    inventory?: string;
    job?: string;
  }): string {
    let result = text;
    if (context.playerName) result = result.replace(/\{playerName\}/g, context.playerName);
    if (context.npcName) result = result.replace(/\{npcName\}/g, context.npcName);
    if (context.role) result = result.replace(/\{role\}/g, context.role);
    if (context.time) result = result.replace(/\{time\}/g, context.time);
    if (context.day !== undefined) result = result.replace(/\{day\}/g, String(context.day));
    if (context.phase) result = result.replace(/\{phase\}/g, context.phase);
    if (context.wellbeing !== undefined) result = result.replace(/\{wellbeing\}/g, String(Math.floor(context.wellbeing)));
    if (context.needs) result = result.replace(/\{needs\}/g, context.needs);
    if (context.inventory) result = result.replace(/\{inventory\}/g, context.inventory);
    if (context.job) result = result.replace(/\{job\}/g, context.job);
    return result;
  }
}
