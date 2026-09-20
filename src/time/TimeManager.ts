/**
 * TimeManager - Phase 9 Time & NPC Schedules
 * Manages game time, day progression, day phases, time scale
 */

export enum DayPhase {
  NIGHT = 'NIGHT',       // 0-5
  DAWN = 'DAWN',         // 5-7
  MORNING = 'MORNING',   // 7-11
  MIDDAY = 'MIDDAY',     // 11-13
  AFTERNOON = 'AFTERNOON', // 13-17
  EVENING = 'EVENING',   // 17-20
  LATE_NIGHT = 'LATE_NIGHT' // 20-24
}

export interface TimeData {
  day: number;
  hour: number;
  minute: number;
  second: number;
  totalSeconds: number; // total game seconds since start
  dayProgress: number; // 0-1 progress through current day
  phase: DayPhase;
  isDaytime: boolean;
  timeScale: number;
  isPaused: boolean;
}

export class TimeManager {
  private totalSeconds: number = 0; // total game seconds elapsed
  private day: number = 1;
  private hour: number = 6; // Start at 6 AM
  private minute: number = 0;
  private second: number = 0;

  private timeScale: number = 60; // 1 real second = 60 game seconds = 1 game minute
  // At 60x, full day (86400 sec) = 1440 real seconds = 24 minutes
  // At 120x, full day = 12 minutes real time

  private isPaused: boolean = false;
  private dayDurationSeconds: number = 24 * 60 * 60; // 86400 seconds per day

  // For smooth interpolation and events
  private lastPhase: DayPhase;
  private onPhaseChangeCallbacks: ((oldPhase: DayPhase, newPhase: DayPhase, time: TimeData) => void)[] = [];
  private onDayChangeCallbacks: ((newDay: number, time: TimeData) => void)[] = [];
  private onHourChangeCallbacks: ((newHour: number, time: TimeData) => void)[] = [];

  constructor(initialHour: number = 6, initialDay: number = 1, timeScale: number = 60) {
    this.hour = initialHour;
    this.day = initialDay;
    this.timeScale = timeScale;
    this.totalSeconds = (initialDay - 1) * this.dayDurationSeconds + initialHour * 3600;
    this.lastPhase = this.calculatePhase(this.hour);
    console.log(`[TimeManager] Initialized Day ${this.day} ${this.formatTime()} scale ${this.timeScale}x phase ${this.lastPhase}`);
  }

  update(deltaTime: number): void {
    if (this.isPaused) return;

    const gameDelta = deltaTime * this.timeScale;
    this.totalSeconds += gameDelta;

    // Calculate new day/hour/minute/second
    const previousDay = this.day;
    const previousHour = this.hour;
    const previousPhase = this.lastPhase;

    const totalSecondsInDay = this.totalSeconds % this.dayDurationSeconds;
    this.day = Math.floor(this.totalSeconds / this.dayDurationSeconds) + 1;
    this.hour = Math.floor(totalSecondsInDay / 3600);
    this.minute = Math.floor((totalSecondsInDay % 3600) / 60);
    this.second = Math.floor(totalSecondsInDay % 60);

    const currentPhase = this.calculatePhase(this.hour);

    // Check for day change
    if (this.day !== previousDay) {
      console.log(`[TimeManager] Day changed: Day ${previousDay} -> Day ${this.day} at ${this.formatTime()}`);
      const timeData = this.getTimeData();
      for (const cb of this.onDayChangeCallbacks) {
        cb(this.day, timeData);
      }
    }

    // Check for hour change
    if (this.hour !== previousHour) {
      const timeData = this.getTimeData();
      for (const cb of this.onHourChangeCallbacks) {
        cb(this.hour, timeData);
      }
    }

    // Check for phase change
    if (currentPhase !== previousPhase) {
      console.log(`[TimeManager] Phase changed: ${previousPhase} -> ${currentPhase} at ${this.formatTime()} Day ${this.day}`);
      this.lastPhase = currentPhase;
      const timeData = this.getTimeData();
      for (const cb of this.onPhaseChangeCallbacks) {
        cb(previousPhase, currentPhase, timeData);
      }
    }
  }

  private calculatePhase(hour: number): DayPhase {
    if (hour >= 0 && hour < 5) return DayPhase.NIGHT;
    if (hour >= 5 && hour < 7) return DayPhase.DAWN;
    if (hour >= 7 && hour < 11) return DayPhase.MORNING;
    if (hour >= 11 && hour < 13) return DayPhase.MIDDAY;
    if (hour >= 13 && hour < 17) return DayPhase.AFTERNOON;
    if (hour >= 17 && hour < 20) return DayPhase.EVENING;
    return DayPhase.LATE_NIGHT; // 20-24
  }

  getTimeData(): TimeData {
    const totalSecondsInDay = this.totalSeconds % this.dayDurationSeconds;
    const dayProgress = totalSecondsInDay / this.dayDurationSeconds;
    const phase = this.calculatePhase(this.hour);
    const isDaytime = phase !== DayPhase.NIGHT && phase !== DayPhase.LATE_NIGHT;

    return {
      day: this.day,
      hour: this.hour,
      minute: this.minute,
      second: this.second,
      totalSeconds: this.totalSeconds,
      dayProgress,
      phase,
      isDaytime,
      timeScale: this.timeScale,
      isPaused: this.isPaused
    };
  }

  getDay(): number { return this.day; }
  getHour(): number { return this.hour; }
  getMinute(): number { return this.minute; }
  getSecond(): number { return this.second; }
  getTotalSeconds(): number { return this.totalSeconds; }
  getPhase(): DayPhase { return this.lastPhase; }
  getTimeScale(): number { return this.timeScale; }
  isPausedTime(): boolean { return this.isPaused; }

  getMinutesSinceMidnight(): number {
    return this.hour * 60 + this.minute;
  }

  getDayProgress(): number {
    return (this.totalSeconds % this.dayDurationSeconds) / this.dayDurationSeconds;
  }

  formatTime(): string {
    const h = String(this.hour).padStart(2, '0');
    const m = String(this.minute).padStart(2, '0');
    const s = String(this.second).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  formatDayTime(): string {
    return `Day ${this.day} ${this.formatTime()}`;
  }

  format12Hour(): string {
    const hour12 = this.hour % 12 || 12;
    const ampm = this.hour < 12 ? 'AM' : 'PM';
    const m = String(this.minute).padStart(2, '0');
    return `${hour12}:${m} ${ampm}`;
  }

  // Controls
  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0, Math.min(scale, 1000));
    console.log(`[TimeManager] Time scale set to ${this.timeScale}x`);
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
    console.log(`[TimeManager] ${paused ? 'Paused' : 'Resumed'} at ${this.formatDayTime()}`);
  }

  togglePause(): void {
    this.setPaused(!this.isPaused);
  }

  setTime(hour: number, minute: number = 0, day?: number): void {
    if (day !== undefined) {
      this.day = day;
    }
    this.hour = Math.max(0, Math.min(hour, 23));
    this.minute = Math.max(0, Math.min(minute, 59));
    this.second = 0;
    this.totalSeconds = (this.day - 1) * this.dayDurationSeconds + this.hour * 3600 + this.minute * 60;
    this.lastPhase = this.calculatePhase(this.hour);
    console.log(`[TimeManager] Time set to ${this.formatDayTime()} phase ${this.lastPhase}`);
  }

  advanceTime(minutes: number): void {
    const seconds = minutes * 60;
    this.totalSeconds += seconds;
    const totalSecondsInDay = this.totalSeconds % this.dayDurationSeconds;
    this.day = Math.floor(this.totalSeconds / this.dayDurationSeconds) + 1;
    this.hour = Math.floor(totalSecondsInDay / 3600);
    this.minute = Math.floor((totalSecondsInDay % 3600) / 60);
    this.second = Math.floor(totalSecondsInDay % 60);
    this.lastPhase = this.calculatePhase(this.hour);
    console.log(`[TimeManager] Advanced by ${minutes}min to ${this.formatDayTime()}`);
  }

  advanceToHour(targetHour: number): void {
    const currentMinutes = this.getMinutesSinceMidnight();
    const targetMinutes = targetHour * 60;
    let diff = targetMinutes - currentMinutes;
    if (diff <= 0) diff += 24 * 60; // Next day
    this.advanceTime(diff);
  }

  // Events
  onPhaseChange(callback: (oldPhase: DayPhase, newPhase: DayPhase, time: TimeData) => void): void {
    this.onPhaseChangeCallbacks.push(callback);
  }

  onDayChange(callback: (newDay: number, time: TimeData) => void): void {
    this.onDayChangeCallbacks.push(callback);
  }

  onHourChange(callback: (newHour: number, time: TimeData) => void): void {
    this.onHourChangeCallbacks.push(callback);
  }

  // For scheduling - check if time is within range
  isTimeInRange(startMinutes: number, endMinutes: number, currentMinutes?: number): boolean {
    const current = currentMinutes ?? this.getMinutesSinceMidnight();
    if (startMinutes <= endMinutes) {
      return current >= startMinutes && current < endMinutes;
    } else {
      // Wraps midnight (e.g., 22:00-6:00)
      return current >= startMinutes || current < endMinutes;
    }
  }

  // Get lighting color based on time (for day/night effect)
  getLightingColor(): { r: number; g: number; b: number; intensity: number } {
    const phase = this.getPhase();
    const progress = this.getDayProgress();
    // Simple day/night tint
    switch (phase) {
      case DayPhase.DAWN:
        return { r: 255, g: 180, b: 120, intensity: 0.6 + (progress - 5/24) / (2/24) * 0.4 };
      case DayPhase.MORNING:
        return { r: 255, g: 255, b: 255, intensity: 1.0 };
      case DayPhase.MIDDAY:
        return { r: 255, g: 255, b: 255, intensity: 1.0 };
      case DayPhase.AFTERNOON:
        return { r: 255, g: 240, b: 200, intensity: 0.9 };
      case DayPhase.EVENING:
        return { r: 255, g: 150, b: 100, intensity: 0.6 };
      case DayPhase.LATE_NIGHT:
        return { r: 80, g: 80, b: 150, intensity: 0.3 };
      case DayPhase.NIGHT:
        return { r: 50, g: 50, b: 120, intensity: 0.2 };
      default:
        return { r: 255, g: 255, b: 255, intensity: 1.0 };
    }
  }

  getDayPhaseName(): string {
    return this.lastPhase;
  }

  // Phase 13 Save/Load
  getSaveData(): any {
    return {
      day: this.day,
      hour: this.hour,
      minute: this.minute,
      second: this.second,
      totalSeconds: this.totalSeconds,
      timeScale: this.timeScale,
      isPaused: this.isPaused,
      season: 'SPRING',
      year: 1
    };
  }

  loadSaveData(data: any): void {
    if (!data) return;
    try {
      this.day = typeof data.day === 'number' ? data.day : 1;
      this.hour = typeof data.hour === 'number' ? Math.max(0, Math.min(data.hour, 23)) : 6;
      this.minute = typeof data.minute === 'number' ? Math.max(0, Math.min(data.minute, 59)) : 0;
      this.second = typeof data.second === 'number' ? Math.max(0, Math.min(data.second, 59)) : 0;
      this.totalSeconds = typeof data.totalSeconds === 'number' ? data.totalSeconds : (this.day - 1) * this.dayDurationSeconds + this.hour * 3600 + this.minute * 60 + this.second;
      this.timeScale = typeof data.timeScale === 'number' ? data.timeScale : 60;
      this.isPaused = typeof data.isPaused === 'boolean' ? data.isPaused : false;
      this.lastPhase = this.calculatePhase(this.hour);
      console.log(`[TimeManager] Loaded save: Day ${this.day} ${this.formatTime()} scale ${this.timeScale}x`);
    } catch (e) {
      console.error('[TimeManager] Failed to load save data:', e);
    }
  }
}
