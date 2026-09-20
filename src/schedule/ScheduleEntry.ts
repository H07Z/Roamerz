/**
 * ScheduleEntry - Phase 9 Time & NPC Schedules
 * Single entry in an NPC's daily schedule
 */

import { ScheduleActivityType } from './ScheduleActivityType';

export interface ScheduleDestination {
  type: 'building' | 'tile' | 'point' | 'square' | 'farm' | 'home';
  buildingId?: string; // If type is building or home
  tile?: { x: number; y: number }; // If type is tile
  point?: { x: number; y: number }; // World pixel if type is point
  // For square, farm, home - uses building manager or hardcoded positions
}

export interface ScheduleEntryData {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  activity: ScheduleActivityType;
  destination: ScheduleDestination;
  description?: string;
  priority?: number;
}

export class ScheduleEntry {
  public readonly startHour: number;
  public readonly startMinute: number;
  public readonly endHour: number;
  public readonly endMinute: number;
  public readonly startMinutes: number; // Minutes since midnight for start
  public readonly endMinutes: number; // Minutes since midnight for end
  public readonly activity: ScheduleActivityType;
  public readonly destination: ScheduleDestination;
  public readonly description: string;
  public readonly priority: number;

  constructor(data: ScheduleEntryData) {
    this.startHour = data.startHour;
    this.startMinute = data.startMinute;
    this.endHour = data.endHour;
    this.endMinute = data.endMinute;
    this.startMinutes = data.startHour * 60 + data.startMinute;
    this.endMinutes = data.endHour * 60 + data.endMinute;
    this.activity = data.activity;
    this.destination = data.destination;
    this.description = data.description ?? `${data.activity} at ${this.formatStartTime()}-${this.formatEndTime()}`;
    this.priority = data.priority ?? 0;
  }

  formatStartTime(): string {
    const h = String(this.startHour).padStart(2, '0');
    const m = String(this.startMinute).padStart(2, '0');
    return `${h}:${m}`;
  }

  formatEndTime(): string {
    const h = String(this.endHour).padStart(2, '0');
    const m = String(this.endMinute).padStart(2, '0');
    return `${h}:${m}`;
  }

  formatTimeRange(): string {
    return `${this.formatStartTime()}-${this.formatEndTime()}`;
  }

  // Check if a given minutes-since-midnight falls within this entry
  // Handles wrapping midnight (e.g., 22:00-6:00)
  containsTime(minutesSinceMidnight: number): boolean {
    if (this.startMinutes <= this.endMinutes) {
      // Normal range (e.g., 8:00-12:00)
      return minutesSinceMidnight >= this.startMinutes && minutesSinceMidnight < this.endMinutes;
    } else {
      // Wraps midnight (e.g., 22:00-6:00)
      return minutesSinceMidnight >= this.startMinutes || minutesSinceMidnight < this.endMinutes;
    }
  }

  getDurationMinutes(): number {
    if (this.startMinutes <= this.endMinutes) {
      return this.endMinutes - this.startMinutes;
    } else {
      return (24 * 60 - this.startMinutes) + this.endMinutes;
    }
  }

  toString(): string {
    return `${this.formatTimeRange()} ${this.activity} -> ${JSON.stringify(this.destination)} ${this.description}`;
  }
}
