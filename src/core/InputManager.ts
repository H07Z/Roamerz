/**
 * InputManager - Phase 1
 * Handles keyboard and basic mouse input.
 * Modular, independent from Game logic.
 */

export class InputManager {
  private keys: Map<string, boolean> = new Map();
  private keysDown: Set<string> = new Set(); // just pressed this frame
  private keysUp: Set<string> = new Set();   // just released this frame

  private mouseX: number = 0;
  private mouseY: number = 0;
  private mouseDown: boolean = false;

  private canvas: HTMLCanvasElement | null = null;

  constructor() {}

  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mouseup', this.onMouseUp);

    // Prevent context menu on canvas
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.onMouseMove);
      this.canvas.removeEventListener('mousedown', this.onMouseDown);
      this.canvas.removeEventListener('mouseup', this.onMouseUp);
    }
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    if (!this.keys.get(key)) {
      this.keysDown.add(key);
    }
    this.keys.set(key, true);

    // Also track code for special keys
    this.keys.set(e.code.toLowerCase(), true);

    // Phase 13: Prevent browser default for save shortcuts (Ctrl+S, Ctrl+L, Ctrl+N, Ctrl+Shift+S/L)
    if (e.ctrlKey) {
      const k = e.key.toLowerCase();
      if (k === 's' || k === 'l' || k === 'n') {
        e.preventDefault();
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    this.keys.set(key, false);
    this.keysUp.add(key);
    this.keys.set(e.code.toLowerCase(), false);
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  };

  private onMouseDown = (_e: MouseEvent): void => {
    this.mouseDown = true;
  };

  private onMouseUp = (_e: MouseEvent): void => {
    this.mouseDown = false;
  };

  isKeyDown(key: string): boolean {
    return this.keys.get(key.toLowerCase()) === true;
  }

  isKeyJustPressed(key: string): boolean {
    return this.keysDown.has(key.toLowerCase());
  }

  isKeyJustReleased(key: string): boolean {
    return this.keysUp.has(key.toLowerCase());
  }

  getMousePosition(): { x: number; y: number } {
    return { x: this.mouseX, y: this.mouseY };
  }

  isMouseDown(): boolean {
    return this.mouseDown;
  }

  // Called at end of frame to clear just-pressed states
  endFrame(): void {
    this.keysDown.clear();
    this.keysUp.clear();
  }
}
