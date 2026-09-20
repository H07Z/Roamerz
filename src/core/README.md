# Core Systems - Phase 1

## Implemented Modules

### Game.ts
- Main game class
- Initialization
- Game Loop: START → INITIALIZE → UPDATE → RENDER → loop
- Delta time handling (capped at 100ms)
- Subsystem orchestration
- Resize handling with ResizeObserver + window resize

### Renderer.ts
- Canvas management
- Responsive resizing
- Background rendering with grid pattern
- Clear screen
- Placeholder for future camera system (worldToScreen)
- Animated grid offset to prove loop is running

### InputManager.ts
- Keyboard state tracking
- Just-pressed / just-released detection
- Mouse position and buttons
- Independent from game logic
- End-of-frame cleanup

### DebugManager.ts
- FPS tracking (smoothed over 500ms)
- Game time tracking with formatting
- Screen dimensions
- Total frames
- Debug overlay rendering
- Toggleable (D key)
- Center label for Phase 1 branding

## Architecture Rule (Phase 1)
```
INPUT
  ↓ (no player yet)

WORLD (not yet)
  ↓
MAP (not yet)
  ↓
COLLISION (not yet)
  ↓
NAVIGATION (not yet)

RENDERER
  ↓
DEBUG
```

## Testing
- See main PHASE STATUS below
