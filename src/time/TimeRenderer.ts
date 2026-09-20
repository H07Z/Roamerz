/**
 * TimeRenderer - Phase 9 Time & NPC Schedules
 * Renders day/night overlay and clock
 */

import { TimeManager, DayPhase } from './TimeManager';

export class TimeRenderer {
  constructor() {}

  // Render day/night tint overlay over entire screen
  renderDayNightOverlay(
    ctx: CanvasRenderingContext2D,
    timeManager: TimeManager,
    screenWidth: number,
    screenHeight: number
  ): void {
    const lighting = timeManager.getLightingColor();
    const phase = timeManager.getPhase();

    // Only render overlay if not full daylight
    if (lighting.intensity >= 0.95) return;

    ctx.save();

    // Calculate overlay alpha based on intensity (1.0 = no overlay, 0.2 = dark)
    const alpha = (1.0 - lighting.intensity) * 0.7;

    // Different tints for different phases
    let overlayColor: string;
    switch (phase) {
      case DayPhase.DAWN:
        overlayColor = `rgba(255, 180, 100, ${alpha * 0.5})`;
        break;
      case DayPhase.EVENING:
        overlayColor = `rgba(255, 120, 50, ${alpha * 0.6})`;
        break;
      case DayPhase.LATE_NIGHT:
        overlayColor = `rgba(30, 30, 80, ${alpha})`;
        break;
      case DayPhase.NIGHT:
        overlayColor = `rgba(20, 20, 60, ${alpha})`;
        break;
      default:
        overlayColor = `rgba(0, 0, 0, ${alpha * 0.3})`;
        break;
    }

    ctx.fillStyle = overlayColor;
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    ctx.restore();
  }

  // Render clock in corner
  renderClock(
    ctx: CanvasRenderingContext2D,
    timeManager: TimeManager,
    screenWidth: number,
    screenHeight: number
  ): void {
    const timeData = timeManager.getTimeData();

    ctx.save();

    const padding = 10;
    const boxWidth = 200;
    const boxHeight = 60;
    const x = screenWidth / 2 - boxWidth / 2;
    const y = padding;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = this.getPhaseColor(timeData.phase);
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    // Time text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${timeData.day} ${timeManager.formatTime()}`, x + boxWidth / 2, y + 8);

    // Phase and 12-hour
    ctx.font = '11px monospace';
    ctx.fillStyle = this.getPhaseColor(timeData.phase);
    ctx.fillText(`${timeData.phase} ${timeManager.format12Hour()} ${timeData.isDaytime ? '☀' : '🌙'}`, x + boxWidth / 2, y + 30);

    // Time scale and paused
    ctx.font = '9px monospace';
    ctx.fillStyle = timeData.isPaused ? '#f88' : '#aaa';
    ctx.fillText(`Scale: ${timeData.timeScale}x ${timeData.isPaused ? 'PAUSED' : ''} DayProgress: ${(timeData.dayProgress * 100).toFixed(0)}%`, x + boxWidth / 2, y + 44);

    ctx.restore();
  }

  private getPhaseColor(phase: DayPhase): string {
    switch (phase) {
      case DayPhase.DAWN: return '#ffaa55';
      case DayPhase.MORNING: return '#88ff88';
      case DayPhase.MIDDAY: return '#ffff88';
      case DayPhase.AFTERNOON: return '#ffcc88';
      case DayPhase.EVENING: return '#ff8855';
      case DayPhase.LATE_NIGHT: return '#8888ff';
      case DayPhase.NIGHT: return '#5555aa';
      default: return '#ffffff';
    }
  }

  // Render schedule timeline for debug
  renderScheduleTimeline(
    ctx: CanvasRenderingContext2D,
    timeManager: TimeManager,
    screenWidth: number,
    screenHeight: number
  ): void {
    const timeData = timeManager.getTimeData();
    const minutes = timeData.hour * 60 + timeData.minute;

    ctx.save();

    const timelineWidth = screenWidth - 20;
    const timelineHeight = 20;
    const x = 10;
    const y = screenHeight - 30;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, timelineWidth, timelineHeight);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(x, y, timelineWidth, timelineHeight);

    // Day phases background
    const phases = [
      { phase: DayPhase.NIGHT, start: 0, end: 5, color: 'rgba(20,20,60,0.5)' },
      { phase: DayPhase.DAWN, start: 5, end: 7, color: 'rgba(255,180,100,0.3)' },
      { phase: DayPhase.MORNING, start: 7, end: 11, color: 'rgba(100,255,100,0.2)' },
      { phase: DayPhase.MIDDAY, start: 11, end: 13, color: 'rgba(255,255,100,0.2)' },
      { phase: DayPhase.AFTERNOON, start: 13, end: 17, color: 'rgba(255,200,100,0.2)' },
      { phase: DayPhase.EVENING, start: 17, end: 20, color: 'rgba(255,100,50,0.3)' },
      { phase: DayPhase.LATE_NIGHT, start: 20, end: 24, color: 'rgba(30,30,80,0.5)' }
    ];

    for (const p of phases) {
      const startX = x + (p.start / 24) * timelineWidth;
      const endX = x + (p.end / 24) * timelineWidth;
      ctx.fillStyle = p.color;
      ctx.fillRect(startX, y, endX - startX, timelineHeight);
    }

    // Current time indicator
    const currentX = x + (minutes / (24 * 60)) * timelineWidth;
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(currentX - 1, y - 2, 2, timelineHeight + 4);

    // Hour marks
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    for (let hour = 0; hour <= 24; hour += 3) {
      const hx = x + (hour / 24) * timelineWidth;
      ctx.fillRect(hx, y, 1, timelineHeight);
      ctx.fillText(`${hour}`, hx, y - 8);
    }

    ctx.restore();
  }
}
