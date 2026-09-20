/**
 * DialogueRenderer - Phase 11 Player Interaction & Dialogue
 * Renders dialogue UI box, choices, interaction prompt
 */

import { DialogueManager } from './DialogueManager';
import { InteractionSystem } from '../interaction/InteractionSystem';

export class DialogueRenderer {
  private showInteractionPrompt: boolean = true;

  constructor() {}

  setShowInteractionPrompt(show: boolean): void {
    this.showInteractionPrompt = show;
  }

  renderInteractionPrompt(
    ctx: CanvasRenderingContext2D,
    interactionSystem: InteractionSystem,
    screenWidth: number,
    screenHeight: number
  ): void {
    if (!this.showInteractionPrompt) return;

    const interactable = interactionSystem.getCurrentInteractable();
    if (!interactable) return;

    ctx.save();

    const padding = 10;
    const boxHeight = 30;
    const boxWidth = Math.min(screenWidth - 20, 400);
    const x = screenWidth / 2 - boxWidth / 2;
    const y = screenHeight - 80;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = interactable.type === 'NPC' ? 'rgba(100, 255, 100, 0.6)' : 'rgba(100, 150, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    // Prompt text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(interactable.prompt, x + boxWidth / 2, y + boxHeight / 2);

    // Icon
    const icon = interactable.type === 'NPC' ? '💬' : '🏠';
    ctx.font = '16px monospace';
    ctx.fillText(icon, x + 15, y + boxHeight / 2);

    ctx.restore();
  }

  renderDialogue(
    ctx: CanvasRenderingContext2D,
    dialogueManager: DialogueManager,
    screenWidth: number,
    screenHeight: number
  ): void {
    if (!dialogueManager.isOpen()) return;

    const currentNode = dialogueManager.getCurrentNode();
    if (!currentNode) return;

    ctx.save();

    // Full screen dim
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // Dialogue box
    const padding = 20;
    const boxWidth = Math.min(screenWidth - 40, 600);
    const boxHeight = Math.min(screenHeight - 100, 400);
    const x = screenWidth / 2 - boxWidth / 2;
    const y = screenHeight - boxHeight - 20;

    // Background
    ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = currentNode.speaker === 'NPC' ? 'rgba(100, 200, 255, 0.8)' : 'rgba(100, 255, 100, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    // Speaker name
    const speakerName = currentNode.speakerName ?? (currentNode.speaker === 'NPC' ? 'NPC' : 'You');
    const speakerColor = currentNode.speaker === 'NPC' ? '#8cf' : '#8f8';
    
    ctx.fillStyle = speakerColor;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${currentNode.speaker === 'NPC' ? '🗣️' : '👤'} ${speakerName}`, x + padding, y + padding);

    // Dialogue text (wrapped)
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    const textX = x + padding;
    const textY = y + padding + 25;
    const textWidth = boxWidth - padding * 2;
    
    const lines = this.wrapText(ctx, currentNode.text, textWidth);
    const lineHeight = 16;
    const maxTextLines = 8;
    
    for (let i = 0; i < Math.min(lines.length, maxTextLines); i++) {
      ctx.fillText(lines[i], textX, textY + i * lineHeight);
    }

    if (lines.length > maxTextLines) {
      ctx.fillStyle = '#aaa';
      ctx.fillText(`... (${lines.length - maxTextLines} more lines)`, textX, textY + maxTextLines * lineHeight);
    }

    // Choices
    const choicesStartY = textY + Math.min(lines.length, maxTextLines) * lineHeight + 20;
    const choiceHeight = 30;
    const choiceSpacing = 5;

    ctx.font = '11px monospace';
    
    for (let i = 0; i < currentNode.choices.length; i++) {
      const choice = currentNode.choices[i];
      const choiceY = choicesStartY + i * (choiceHeight + choiceSpacing);
      
      if (choiceY + choiceHeight > y + boxHeight - padding) break;

      // Choice background
      const isHovered = false; // Could add mouse hover later
      ctx.fillStyle = isHovered ? 'rgba(100, 150, 255, 0.3)' : 'rgba(50, 50, 70, 0.8)';
      ctx.fillRect(x + padding, choiceY, boxWidth - padding * 2, choiceHeight);
      ctx.strokeStyle = 'rgba(100, 100, 150, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + padding, choiceY, boxWidth - padding * 2, choiceHeight);

      // Choice number and icon
      ctx.fillStyle = '#ff8';
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}.`, x + padding + 8, choiceY + 10);

      if (choice.icon) {
        ctx.fillStyle = '#fff';
        ctx.fillText(choice.icon, x + padding + 28, choiceY + 10);
      }

      // Choice text
      ctx.fillStyle = '#ddd';
      const choiceTextX = x + padding + (choice.icon ? 48 : 28);
      const choiceText = choice.text.length > 50 ? choice.text.substring(0, 50) + '...' : choice.text;
      ctx.fillText(choiceText, choiceTextX, choiceY + 10);
    }

    // Instructions
    ctx.fillStyle = '#aaa';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press 1-4 to choose, ESC to close dialogue', x + boxWidth / 2, y + boxHeight - 10);

    ctx.restore();
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      // Handle newlines in text
      if (word.includes('\n')) {
        const parts = word.split('\n');
        for (let i = 0; i < parts.length; i++) {
          if (i === 0) {
            const testLine = currentLine ? currentLine + ' ' + parts[i] : parts[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = parts[i];
            } else {
              currentLine = testLine;
            }
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = parts[i];
            if (i < parts.length - 1) {
              lines.push(currentLine);
              currentLine = '';
            }
          }
        }
        continue;
      }

      const testLine = currentLine ? currentLine + ' ' + word : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  // Render dialogue debug info
  renderDebug(
    ctx: CanvasRenderingContext2D,
    dialogueManager: DialogueManager,
    x: number,
    y: number
  ): void {
    ctx.save();

    ctx.font = '9px monospace';
    ctx.textBaseline = 'top';

    const lines = [
      `Dialogue: ${dialogueManager.isOpen() ? 'OPEN' : 'CLOSED'}`,
      `Total: ${dialogueManager.getTotalDialogues()} dialogues, ${dialogueManager.getTotalChoices()} choices`,
      `Debug: ${dialogueManager.getDebugString()}`,
      `History: ${dialogueManager.getHistory().length} entries`
    ];

    const lineHeight = 11;
    const boxWidth = 300;
    const boxHeight = lines.length * lineHeight + 10;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    ctx.fillStyle = '#ddd';
    lines.forEach((line, i) => {
      ctx.fillText(line, x + 5, y + 5 + i * lineHeight);
    });

    ctx.restore();
  }
}
