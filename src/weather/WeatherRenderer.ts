/**
 * WeatherRenderer - Phase 16.4 Weather System
 * Renders weather overlay: tint + particles (rain, heavy rain, snow, fog)
 */

import { WeatherSystem } from './WeatherSystem';
import { WeatherDefinition } from './Weather';

export class WeatherRenderer {
  private showWeather: boolean = true;
  private particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
  private lastParticleType: string = 'none';
  private timeAccum: number = 0;

  constructor() {
    this.initParticles('none', 100);
  }

  setShowWeather(show: boolean): void {
    this.showWeather = show;
  }

  isShowing(): boolean {
    return this.showWeather;
  }

  toggle(): void {
    this.showWeather = !this.showWeather;
  }

  private initParticles(type: string, count: number): void {
    this.particles = [];
    this.lastParticleType = type;
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(type));
    }
  }

  private createParticle(type: string): { x: number; y: number; vx: number; vy: number; size: number; alpha: number } {
    const x = Math.random();
    const y = Math.random();
    let vx = 0, vy = 0, size = 2, alpha = 0.8;

    switch (type) {
      case 'rain':
        vx = -0.02 + Math.random() * -0.05;
        vy = 0.5 + Math.random() * 0.5;
        size = 1 + Math.random() * 2;
        alpha = 0.6 + Math.random() * 0.4;
        break;
      case 'heavy_rain':
        vx = -0.05 + Math.random() * -0.1;
        vy = 0.8 + Math.random() * 0.7;
        size = 2 + Math.random() * 3;
        alpha = 0.7 + Math.random() * 0.3;
        break;
      case 'snow':
        vx = -0.05 + Math.random() * 0.1;
        vy = 0.1 + Math.random() * 0.2;
        size = 2 + Math.random() * 4;
        alpha = 0.7 + Math.random() * 0.3;
        break;
      case 'fog':
        vx = -0.02 + Math.random() * 0.04;
        vy = -0.01 + Math.random() * 0.02;
        size = 20 + Math.random() * 40;
        alpha = 0.1 + Math.random() * 0.2;
        break;
      default:
        vx = 0; vy = 0; size = 0; alpha = 0;
    }

    return { x, y, vx, vy, size, alpha };
  }

  private updateParticles(type: string, deltaTime: number, intensity: number): void {
    if (type !== this.lastParticleType) {
      const count = type === 'heavy_rain' ? 200 : type === 'rain' ? 120 : type === 'snow' ? 100 : type === 'fog' ? 40 : 0;
      this.initParticles(type, count);
    }

    if (type === 'none') return;

    const speedMult = 1 + intensity;

    for (const p of this.particles) {
      p.x += p.vx * deltaTime * 60 * speedMult * 0.5;
      p.y += p.vy * deltaTime * 60 * speedMult * 0.5;

      if (type === 'rain' || type === 'heavy_rain') {
        if (p.y > 1) {
          p.x = Math.random() * 1.2 - 0.1;
          p.y = -0.1;
        }
        if (p.x < -0.2) p.x = 1.1;
      } else if (type === 'snow') {
        if (p.y > 1) {
          p.x = Math.random();
          p.y = -0.1;
        }
        // slight sway
        p.x += Math.sin(this.timeAccum * 2 + p.y * 10) * 0.001 * deltaTime * 60;
      } else if (type === 'fog') {
        if (p.x < -0.2) p.x = 1.2;
        if (p.x > 1.2) p.x = -0.2;
        if (p.y < -0.2) p.y = 1.2;
        if (p.y > 1.2) p.y = -0.2;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, weatherSystem: WeatherSystem, deltaTime: number = 0.016): void {
    if (!this.showWeather) return;

    const def = weatherSystem.getCurrentWeather();
    if (!def) return;

    const intensity = weatherSystem.getIntensity();
    this.timeAccum += deltaTime;
    this.updateParticles(def.visual.particleType, deltaTime, intensity);

    ctx.save();

    // Overlay color
    if (def.visual.overlayColor && def.visual.overlayColor !== 'none') {
      // Adjust alpha by intensity
      const baseAlphaMatch = def.visual.overlayColor.match(/rgba\(([^)]+)\)/);
      if (baseAlphaMatch) {
        const parts = baseAlphaMatch[1].split(',').map(s => s.trim());
        if (parts.length === 4) {
          const r = parseInt(parts[0]);
          const g = parseInt(parts[1]);
          const b = parseInt(parts[2]);
          const baseA = parseFloat(parts[3]);
          const finalA = Math.min(0.6, baseA * (0.5 + intensity * 0.8));
          ctx.fillStyle = `rgba(${r},${g},${b},${finalA})`;
          ctx.fillRect(0, 0, screenWidth, screenHeight);
        } else {
          ctx.fillStyle = def.visual.overlayColor;
          ctx.globalAlpha = 0.3 + intensity * 0.4;
          ctx.fillRect(0, 0, screenWidth, screenHeight);
          ctx.globalAlpha = 1;
        }
      } else {
        ctx.fillStyle = def.visual.overlayColor;
        ctx.globalAlpha = 0.2 + intensity * 0.3;
        ctx.fillRect(0, 0, screenWidth, screenHeight);
        ctx.globalAlpha = 1;
      }
    }

    // Brightness modifier via additional overlay
    if (def.visual.brightnessModifier !== undefined && def.visual.brightnessModifier !== 1) {
      if (def.visual.brightnessModifier < 1) {
        const darken = 1 - def.visual.brightnessModifier;
        ctx.fillStyle = `rgba(0,0,0,${darken * 0.4 * (0.5 + intensity * 0.5)})`;
        ctx.fillRect(0, 0, screenWidth, screenHeight);
      } else if (def.visual.brightnessModifier > 1) {
        const brighten = def.visual.brightnessModifier - 1;
        ctx.fillStyle = `rgba(255,255,200,${brighten * 0.15 * (0.5 + intensity * 0.5)})`;
        ctx.fillRect(0, 0, screenWidth, screenHeight);
      }
    }

    // Particles
    const particleType = def.visual.particleType;
    if (particleType !== 'none' && this.particles.length > 0) {
      if (particleType === 'rain' || particleType === 'heavy_rain') {
        ctx.strokeStyle = particleType === 'heavy_rain' ? 'rgba(180, 200, 255, 0.8)' : 'rgba(150, 180, 255, 0.6)';
        ctx.lineWidth = particleType === 'heavy_rain' ? 2 : 1;
        ctx.lineCap = 'round';
        for (const p of this.particles) {
          const x = p.x * screenWidth;
          const y = p.y * screenHeight;
          const len = particleType === 'heavy_rain' ? 18 : 12;
          ctx.globalAlpha = p.alpha * (0.5 + intensity * 0.5);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + p.vx * 30, y + len);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (particleType === 'snow') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        for (const p of this.particles) {
          const x = p.x * screenWidth;
          const y = p.y * screenHeight;
          ctx.globalAlpha = p.alpha * (0.5 + intensity * 0.5);
          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else if (particleType === 'fog') {
        // Fog as large soft blobs
        for (const p of this.particles) {
          const x = p.x * screenWidth;
          const y = p.y * screenHeight;
          ctx.globalAlpha = p.alpha * (0.3 + intensity * 0.4);
          ctx.fillStyle = 'rgba(200, 200, 210, 0.5)';
          ctx.beginPath();
          ctx.ellipse(x, y, p.size * 2, p.size, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }

    // Weather info small badge top-left under debug
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(10, 50, 140, 22);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(10, 50, 140, 22);
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${def.icon} ${def.name} ${(intensity*100).toFixed(0)}%`, 16, 61);

    ctx.restore();
  }

  renderDebugInfo(ctx: CanvasRenderingContext2D, weatherSystem: WeatherSystem, screenWidth: number, screenHeight: number): void {
    const def = weatherSystem.getCurrentWeather();
    if (!def) return;

    ctx.save();
    const boxW = 300;
    const boxH = 80;
    const x = screenWidth - boxW - 10;
    const y = 120;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.5)';
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.fillStyle = '#8af';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Weather: ${def.icon} ${def.name} (${def.type})`, x + 10, y + 12);

    ctx.fillStyle = '#aaa';
    ctx.font = '9px monospace';
    ctx.fillText(`Intensity: ${(weatherSystem.getIntensity()*100).toFixed(0)}% | Changes: ${weatherSystem.getTotalChanges()} | Next: ${(weatherSystem.getNextChange()/3600).toFixed(1)}h game`, x + 10, y + 26);
    ctx.fillText(`Effects: farm x${def.effects.farmingGrowthMultiplier ?? 1} | happy ${def.effects.animalHappinessModifier ?? 0} | vision ${def.effects.visionRadiusModifier ?? 0}`, x + 10, y + 40);
    ctx.fillText(`Visual: ${def.visual.particleType} | ${def.visual.overlayColor} | bright x${def.visual.brightnessModifier ?? 1}`, x + 10, y + 54);
    ctx.fillStyle = '#666';
    ctx.font = '8px monospace';
    ctx.fillText(`${def.description.substring(0, 60)}`, x + 10, y + 68);

    ctx.restore();
  }
}
