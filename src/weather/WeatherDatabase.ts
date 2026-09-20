/**
 * WeatherDatabase - Phase 16.4 Weather System
 * Data-driven weather definitions, 6 types
 */

import { WeatherDefinition, WeatherType } from './Weather';

export class WeatherDatabase {
  private static instance: WeatherDatabase | null = null;
  private weathers: Map<string, WeatherDefinition> = new Map();

  private constructor() {
    this.loadDefaultWeathers();
  }

  static getInstance(): WeatherDatabase {
    if (!WeatherDatabase.instance) {
      WeatherDatabase.instance = new WeatherDatabase();
    }
    return WeatherDatabase.instance;
  }

  private loadDefaultWeathers(): void {
    const defs: WeatherDefinition[] = [
      {
        id: 'sunny',
        type: WeatherType.SUNNY,
        name: 'Sunny',
        icon: '☀️',
        description: 'Clear skies, bright sun. Perfect for farming and exploring.',
        effects: {
          farmingGrowthMultiplier: 1.0,
          animalHappinessModifier: 2,
          playerStaminaDrain: 1.0,
          visionRadiusModifier: 1,
          movementSpeedModifier: 1.0
        },
        visual: {
          overlayColor: 'rgba(255, 240, 150, 0.08)',
          particleType: 'none',
          brightnessModifier: 1.1
        },
        minDurationSeconds: 1 * 24 * 60 * 60, // 1 day
        maxDurationSeconds: 3 * 24 * 60 * 60, // 3 days
        weight: 30,
        intensityMin: 0,
        intensityMax: 0.2,
        tags: ['clear', 'bright', 'warm']
      },
      {
        id: 'cloudy',
        type: WeatherType.CLOUDY,
        name: 'Cloudy',
        icon: '☁️',
        description: 'Overcast skies, soft light. Calm day.',
        effects: {
          farmingGrowthMultiplier: 1.0,
          animalHappinessModifier: 0,
          playerStaminaDrain: 1.0,
          visionRadiusModifier: 0,
          movementSpeedModifier: 1.0
        },
        visual: {
          overlayColor: 'rgba(100, 100, 120, 0.15)',
          particleType: 'none',
          brightnessModifier: 0.95
        },
        minDurationSeconds: 0.5 * 24 * 60 * 60,
        maxDurationSeconds: 2 * 24 * 60 * 60,
        weight: 25,
        intensityMin: 0,
        intensityMax: 0.3,
        tags: ['overcast', 'calm']
      },
      {
        id: 'rainy',
        type: WeatherType.RAINY,
        name: 'Rainy',
        icon: '🌧️',
        description: 'Gentle rain waters crops automatically. Great for farming!',
        effects: {
          farmingGrowthMultiplier: 1.5,
          animalHappinessModifier: -2,
          playerStaminaDrain: 1.1,
          visionRadiusModifier: -1,
          movementSpeedModifier: 0.95
        },
        visual: {
          overlayColor: 'rgba(80, 120, 200, 0.18)',
          particleType: 'rain',
          particleCount: 120,
          brightnessModifier: 0.85
        },
        minDurationSeconds: 0.3 * 24 * 60 * 60,
        maxDurationSeconds: 1.5 * 24 * 60 * 60,
        weight: 20,
        intensityMin: 0.4,
        intensityMax: 0.8,
        tags: ['wet', 'farming_boost', 'waters_crops']
      },
      {
        id: 'stormy',
        type: WeatherType.STORMY,
        name: 'Stormy',
        icon: '⛈️',
        description: 'Heavy storm, strong winds and downpour. Animals dislike it.',
        effects: {
          farmingGrowthMultiplier: 1.2,
          animalHappinessModifier: -5,
          playerStaminaDrain: 1.3,
          visionRadiusModifier: -2,
          movementSpeedModifier: 0.9
        },
        visual: {
          overlayColor: 'rgba(40, 40, 80, 0.35)',
          particleType: 'heavy_rain',
          particleCount: 200,
          brightnessModifier: 0.7
        },
        minDurationSeconds: 0.2 * 24 * 60 * 60,
        maxDurationSeconds: 0.8 * 24 * 60 * 60,
        weight: 10,
        intensityMin: 0.7,
        intensityMax: 1.0,
        tags: ['wet', 'windy', 'dark', 'waters_crops']
      },
      {
        id: 'foggy',
        type: WeatherType.FOGGY,
        name: 'Foggy',
        icon: '🌫️',
        description: 'Thick fog reduces visibility. Mysterious atmosphere.',
        effects: {
          farmingGrowthMultiplier: 0.8,
          animalHappinessModifier: -1,
          playerStaminaDrain: 1.0,
          visionRadiusModifier: -3,
          movementSpeedModifier: 0.95
        },
        visual: {
          overlayColor: 'rgba(180, 180, 190, 0.30)',
          particleType: 'fog',
          particleCount: 40,
          brightnessModifier: 0.9
        },
        minDurationSeconds: 0.2 * 24 * 60 * 60,
        maxDurationSeconds: 1 * 24 * 60 * 60,
        weight: 10,
        intensityMin: 0.3,
        intensityMax: 0.7,
        tags: ['fog', 'low_visibility']
      },
      {
        id: 'snowy',
        type: WeatherType.SNOWY,
        name: 'Snowy',
        icon: '❄️',
        description: 'Snowfall chills the air. Farming slows, but beautiful.',
        effects: {
          farmingGrowthMultiplier: 0.5,
          animalHappinessModifier: -3,
          playerStaminaDrain: 1.2,
          visionRadiusModifier: -1,
          movementSpeedModifier: 0.85
        },
        visual: {
          overlayColor: 'rgba(200, 220, 255, 0.22)',
          particleType: 'snow',
          particleCount: 100,
          brightnessModifier: 1.05
        },
        minDurationSeconds: 0.5 * 24 * 60 * 60,
        maxDurationSeconds: 2 * 24 * 60 * 60,
        weight: 5,
        intensityMin: 0.3,
        intensityMax: 0.8,
        tags: ['cold', 'slow_farming', 'beautiful']
      }
    ];

    for (const d of defs) {
      this.weathers.set(d.id, d);
    }
    console.log(`[WeatherDatabase] Loaded ${this.weathers.size} weathers`);
  }

  getWeather(id: string): WeatherDefinition | null {
    return this.weathers.get(id.toLowerCase()) ?? null;
  }

  getAllWeathers(): WeatherDefinition[] {
    return Array.from(this.weathers.values());
  }

  getWeatherByType(type: WeatherType): WeatherDefinition | null {
    for (const w of this.weathers.values()) {
      if (w.type === type) return w;
    }
    return null;
  }

  getCount(): number {
    return this.weathers.size;
  }

  hasWeather(id: string): boolean {
    return this.weathers.has(id.toLowerCase());
  }

  registerWeather(def: WeatherDefinition): void {
    this.weathers.set(def.id, def);
  }

  unregisterWeather(id: string): boolean {
    return this.weathers.delete(id.toLowerCase());
  }

  getWeathersByTag(tag: string): WeatherDefinition[] {
    return this.getAllWeathers().filter(w => w.tags?.includes(tag));
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const w of this.weathers.values()) {
      if (!w.id) errors.push(`Weather missing id`);
      if (!w.name) errors.push(`Weather ${w.id} missing name`);
      if (!w.type) errors.push(`Weather ${w.id} missing type`);
      if (w.minDurationSeconds <= 0) errors.push(`Weather ${w.id} invalid minDuration`);
      if (w.maxDurationSeconds < w.minDurationSeconds) errors.push(`Weather ${w.id} maxDuration < minDuration`);
      if (w.weight <= 0) errors.push(`Weather ${w.id} weight <=0`);
      if (w.intensityMin < 0 || w.intensityMax > 1) errors.push(`Weather ${w.id} intensity out of range`);
      if (w.intensityMin > w.intensityMax) errors.push(`Weather ${w.id} intensityMin > intensityMax`);
    }
    return { valid: errors.length === 0, errors };
  }

  getDebugString(): string {
    return `${this.weathers.size} weathers: ${Array.from(this.weathers.keys()).join(', ')}`;
  }
}
