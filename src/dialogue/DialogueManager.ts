/**
 * DialogueManager - Phase 11 Player Interaction & Dialogue
 * Manages active dialogue, history, and state
 */

import { Dialogue, DialogueNode, DialogueChoice, DialogueBuilder } from './Dialogue';
import { DialogueData } from './DialogueData';
import { NPC } from '../npc/NPC';
import { LifeManager } from '../life/LifeManager';
import { TimeManager } from '../time/TimeManager';
import { BuildingManager } from '../building/BuildingManager';

export interface DialogueContext {
  playerName: string;
  time: string;
  day: number;
  phase: string;
  timeManager: TimeManager | null;
  lifeManager: LifeManager | null;
  buildingManager: BuildingManager | null;
}

export class DialogueManager {
  private activeDialogue: Dialogue | null = null;
  private currentNodeId: string | null = null;
  private dialogueHistory: { dialogueId: string; nodeId: string; choiceId: string; timestamp: number }[] = [];
  private totalDialogues: number = 0;
  private totalChoices: number = 0;
  private isDialogueOpen: boolean = false;
  private currentNPC: NPC | null = null;
  private context: DialogueContext | null = null;

  // For building interaction
  private activeBuildingDialogue: { buildingId: string; buildingName: string; text: string } | null = null;

  constructor() {}

  startDialogue(
    npc: NPC,
    context: DialogueContext
  ): boolean {
    this.context = context;
    this.currentNPC = npc;

    // Create dialogue for NPC with dynamic context
    const lifeData = context.lifeManager?.getLifeData(npc.id);
    const needs = lifeData?.needs;
    const inventory = lifeData?.inventory;
    const job = lifeData?.job;
    const home = npc.getHomeBuilding();

    const dialogueContext = {
      time: context.time,
      day: context.day,
      phase: context.phase,
      wellbeing: needs?.getOverallWellbeing(),
      needs: needs?.getDebugString(),
      inventory: inventory?.getDebugString(),
      job: job?.getDebugString(),
      home: home?.id ?? 'none'
    };

    const dialogue = DialogueData.createDialogueForNPC(
      npc.id,
      npc.name,
      npc.role,
      dialogueContext
    );

    // Replace placeholders in all nodes
    for (const node of dialogue.nodes.values()) {
      node.text = DialogueBuilder.replacePlaceholders(node.text, {
        playerName: context.playerName,
        npcName: npc.name,
        role: npc.role,
        time: context.time,
        day: context.day,
        phase: context.phase,
        wellbeing: needs?.getOverallWellbeing(),
        needs: needs?.getDebugString(),
        inventory: inventory?.getDebugString(),
        job: job?.getDebugString()
      });

      // Also replace in choices? No, keep choice text simple

      if (node.speaker === 'NPC') {
        node.speakerName = npc.name;
      }
    }

    this.activeDialogue = dialogue;
    this.currentNodeId = dialogue.startNodeId;
    this.isDialogueOpen = true;
    this.totalDialogues++;

    // Increase social for NPC when starting dialogue
    if (lifeData?.needs) {
      lifeData.needs.restoreSocial(5);
      lifeData.needs.modifyNeed('HAPPINESS' as any, 3);
    }

    // Increment NPC social interactions
    npc.incrementSocialInteractions();

    console.log(`[DialogueManager] Started dialogue with ${npc.id} ${npc.name} at ${context.time} Day ${context.day}`);

    return true;
  }

  startBuildingDialogue(
    buildingId: string,
    buildingName: string,
    buildingType: string,
    ownerId: string | null,
    occupied: boolean,
    occupantId: string | null,
    context: DialogueContext
  ): boolean {
    this.context = context;
    this.currentNPC = null;
    this.activeDialogue = null;
    this.currentNodeId = null;

    const ownerText = ownerId ? `Owned by ${ownerId}` : 'No owner';
    const occupiedText = occupied ? `Occupied by ${occupantId}` : 'Empty';
    const timeText = `${context.time} Day ${context.day} ${context.phase}`;

    const text = `Building: ${buildingName} (${buildingType})\nID: ${buildingId}\n${ownerText}\n${occupiedText}\nTime: ${timeText}\n\nThis is a ${buildingType} building. ${ownerId ? `It belongs to ${ownerId}.` : ''} ${occupied ? `Someone is inside.` : 'No one is inside right now.'}\n\nDoors are walkable ROAD tiles (INTERACTABLE), house tiles are BLOCKED. NPCs path to front-of-door, not inside.`;

    this.activeBuildingDialogue = {
      buildingId,
      buildingName,
      text
    };

    this.isDialogueOpen = true;
    this.totalDialogues++;

    console.log(`[DialogueManager] Started building dialogue with ${buildingId} ${buildingName}`);

    return true;
  }

  getCurrentNode(): DialogueNode | null {
    if (this.activeBuildingDialogue) {
      // Return building as a node
      return {
        id: 'building',
        speaker: 'NPC',
        speakerName: this.activeBuildingDialogue.buildingName,
        text: this.activeBuildingDialogue.text,
        choices: [
          { id: 'close', text: 'Close', nextNodeId: null, icon: '❌' }
        ],
        isEnd: false
      };
    }

    if (!this.activeDialogue || !this.currentNodeId) return null;
    return this.activeDialogue.nodes.get(this.currentNodeId) ?? null;
  }

  makeChoice(choiceId: string): { ended: boolean; nextNode: DialogueNode | null } {
    const currentNode = this.getCurrentNode();
    if (!currentNode) return { ended: true, nextNode: null };

    const choice = currentNode.choices.find(c => c.id === choiceId);
    if (!choice) {
      console.warn(`[DialogueManager] Choice ${choiceId} not found in node ${currentNode.id}`);
      return { ended: false, nextNode: currentNode };
    }

    // Record history
    if (this.activeDialogue) {
      this.dialogueHistory.push({
        dialogueId: this.activeDialogue.id,
        nodeId: currentNode.id,
        choiceId: choice.id,
        timestamp: Date.now()
      });
    }
    this.totalChoices++;

    console.log(`[DialogueManager] Choice ${choiceId}: ${choice.text} -> ${choice.nextNodeId ?? 'END'}`);

    // Handle choice actions
    if (this.currentNPC && this.context?.lifeManager) {
      const lifeData = this.context.lifeManager.getLifeData(this.currentNPC.id);
      if (lifeData) {
        if (choice.action?.restoreNeed) {
          const type = choice.action.restoreNeed.type as any;
          const amount = choice.action.restoreNeed.amount;
          lifeData.needs.modifyNeed(type, amount);
          console.log(`[DialogueManager] Restored ${type} +${amount} for ${this.currentNPC.id}`);
        }
        if (choice.action?.giveItem) {
          const itemType = choice.action.giveItem as any;
          lifeData.inventory.addItem(itemType, 1);
          console.log(`[DialogueManager] Gave ${itemType} to ${this.currentNPC.id} via dialogue`);
        }
      }

      // Also restore player's social? We don't have player needs, but we can log
      // For NPC, any dialogue choice gives small social boost
      if (lifeData) {
        lifeData.needs.restoreSocial(2);
      }
    }

    // Check if ends
    if (choice.nextNodeId === null) {
      this.endDialogue();
      return { ended: true, nextNode: null };
    }

    // Handle building dialogue close
    if (this.activeBuildingDialogue && choice.nextNodeId === null) {
      this.endDialogue();
      return { ended: true, nextNode: null };
    }

    // Move to next node
    if (this.activeDialogue) {
      this.currentNodeId = choice.nextNodeId;
      const nextNode = this.activeDialogue.nodes.get(choice.nextNodeId);
      
      if (!nextNode) {
        console.warn(`[DialogueManager] Next node ${choice.nextNodeId} not found`);
        this.endDialogue();
        return { ended: true, nextNode: null };
      }

      // Check if next node is end
      if (nextNode.isEnd) {
        // Will end after showing this node? Or end immediately? We'll show it then require close
        // For simplicity, if isEnd, next choice will end
      }

      // Handle node actions
      if (nextNode.action && this.currentNPC && this.context?.lifeManager) {
        const lifeData = this.context.lifeManager.getLifeData(this.currentNPC.id);
        if (lifeData && nextNode.action.restoreNeed) {
          const type = nextNode.action.restoreNeed.type as any;
          const amount = nextNode.action.restoreNeed.amount;
          lifeData.needs.modifyNeed(type, amount);
        }
      }

      return { ended: false, nextNode };
    }

    return { ended: false, nextNode: null };
  }

  endDialogue(): void {
    console.log(`[DialogueManager] Ended dialogue ${this.activeDialogue?.id ?? this.activeBuildingDialogue?.buildingId}`);
    this.activeDialogue = null;
    this.currentNodeId = null;
    this.activeBuildingDialogue = null;
    this.isDialogueOpen = false;
    this.currentNPC = null;
  }

  isOpen(): boolean {
    return this.isDialogueOpen;
  }

  getActiveDialogue(): Dialogue | null {
    return this.activeDialogue;
  }

  getCurrentNPC(): NPC | null {
    return this.currentNPC;
  }

  getActiveBuildingDialogue(): { buildingId: string; buildingName: string; text: string } | null {
    return this.activeBuildingDialogue;
  }

  isBuildingDialogue(): boolean {
    return this.activeBuildingDialogue !== null;
  }

  getTotalDialogues(): number {
    return this.totalDialogues;
  }

  getTotalChoices(): number {
    return this.totalChoices;
  }

  getHistory(): { dialogueId: string; nodeId: string; choiceId: string; timestamp: number }[] {
    return this.dialogueHistory;
  }

  getDebugString(): string {
    if (!this.isDialogueOpen) return 'No active dialogue';
    if (this.activeBuildingDialogue) {
      return `Building ${this.activeBuildingDialogue.buildingName} dialogue open`;
    }
    if (this.activeDialogue) {
      const node = this.getCurrentNode();
      return `Dialogue ${this.activeDialogue.npcName} Node ${node?.id} Choices ${node?.choices.length}`;
    }
    return 'Dialogue open but no data';
  }
}
