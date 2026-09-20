/**
 * Schedule - Phase 9 Time & NPC Schedules
 * Daily schedule for an NPC, collection of entries sorted by time
 */

import { ScheduleEntry, ScheduleEntryData } from './ScheduleEntry';
import { ScheduleActivityType } from './ScheduleActivityType';

export class Schedule {
  public readonly npcId: string;
  private entries: ScheduleEntry[] = [];

  constructor(npcId: string, entriesData: ScheduleEntryData[] = []) {
    this.npcId = npcId;
    this.entries = entriesData.map(data => new ScheduleEntry(data));
    this.sortEntries();
  }

  private sortEntries(): void {
    this.entries.sort((a, b) => a.startMinutes - b.startMinutes);
  }

  addEntry(entryData: ScheduleEntryData): void {
    this.entries.push(new ScheduleEntry(entryData));
    this.sortEntries();
  }

  addEntries(entriesData: ScheduleEntryData[]): void {
    for (const data of entriesData) {
      this.entries.push(new ScheduleEntry(data));
    }
    this.sortEntries();
  }

  getEntries(): ScheduleEntry[] {
    return [...this.entries];
  }

  getEntryCount(): number {
    return this.entries.length;
  }

  // Get current entry based on minutes since midnight
  getCurrentEntry(minutesSinceMidnight: number): ScheduleEntry | null {
    // Find entry that contains current time
    for (const entry of this.entries) {
      if (entry.containsTime(minutesSinceMidnight)) {
        return entry;
      }
    }

    // If no entry found (gap in schedule), find the previous entry that ended most recently
    // Or return null
    return null;
  }

  // Get next entry after current time
  getNextEntry(minutesSinceMidnight: number): ScheduleEntry | null {
    // Entries are sorted by start time
    // Find first entry with start > current time
    for (const entry of this.entries) {
      if (entry.startMinutes > minutesSinceMidnight) {
        return entry;
      }
    }

    // If none found, next is first entry of next day (wrap around)
    if (this.entries.length > 0) {
      return this.entries[0];
    }

    return null;
  }

  // Get entry by activity type
  getEntriesByActivity(activity: ScheduleActivityType): ScheduleEntry[] {
    return this.entries.filter(e => e.activity === activity);
  }

  // Check if schedule has any gaps (times not covered by any entry)
  // Returns gaps as {startMinutes, endMinutes}
  getGaps(): { startMinutes: number; endMinutes: number }[] {
    if (this.entries.length === 0) {
      return [{ startMinutes: 0, endMinutes: 24 * 60 }];
    }

    const gaps: { startMinutes: number; endMinutes: number }[] = [];

    // Create a coverage map for each minute (simplified: check every minute)
    // For performance, we check sorted entries for overlaps/gaps
    // Since entries may wrap midnight, we need to handle carefully

    // For simplicity, assume schedule should cover 24h
    // We'll check if there are times not covered

    // Sort entries by start
    const sorted = [...this.entries].sort((a, b) => a.startMinutes - b.startMinutes);

    // Check from 0 to first entry start
    if (sorted[0].startMinutes > 0) {
      // Check if previous day's wrapping entry covers it
      const hasWrappingCover = this.entries.some(e => e.startMinutes > e.endMinutes && e.startMinutes <= 24*60);
      if (!hasWrappingCover) {
        // Actually check if any wrapping entry covers 0..firstStart
        let covered = false;
        for (const entry of this.entries) {
          if (entry.startMinutes > entry.endMinutes) {
            // Wraps, so it covers from start to 24*60 and 0 to end
            if (entry.endMinutes > 0) {
              covered = true;
              break;
            }
          }
        }
        if (!covered) {
          gaps.push({ startMinutes: 0, endMinutes: sorted[0].startMinutes });
        }
      }
    }

    // Check gaps between entries
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      // If current wraps midnight, it covers to end of day, so no gap until next day
      if (current.startMinutes > current.endMinutes) {
        continue;
      }

      if (current.endMinutes < next.startMinutes) {
        // Check if any other entry (including wrapping) covers this gap
        let covered = false;
        for (const entry of this.entries) {
          if (entry === current || entry === next) continue;
          if (entry.containsTime(current.endMinutes)) {
            covered = true;
            break;
          }
        }
        if (!covered) {
          gaps.push({ startMinutes: current.endMinutes, endMinutes: next.startMinutes });
        }
      }
    }

    return gaps;
  }

  // Validate schedule covers 24h without gaps (ideal)
  isFullDayCoverage(): boolean {
    return this.getGaps().length === 0;
  }

  toString(): string {
    return `Schedule for ${this.npcId}: ${this.entries.length} entries\n` +
      this.entries.map(e => `  ${e.toString()}`).join('\n');
  }

  // Get activity at a specific time formatted
  getActivityAtTime(minutesSinceMidnight: number): { entry: ScheduleEntry | null; activity: ScheduleActivityType | null } {
    const entry = this.getCurrentEntry(minutesSinceMidnight);
    return {
      entry,
      activity: entry ? entry.activity : null
    };
  }
}
