# Save System - Phase 13

## Overview
Reliable save/load & world persistence with versioning, validation, corruption protection, and forward compatibility.

## Files
- `SaveTypes.ts` - Versioned save file structures, defaults, placeholders for future systems (farming, animals, weather, crafting, combat, dungeons, events, relationships, marriage, reputation, seasons)
- `SaveManager.ts` - Core save/load logic, localStorage, slots, validation, checksum, migration, export/import, auto-save
- `SaveMigration.ts` - Migration path between versions, backward compatibility
- `SaveRenderer.ts` - UI overlay for save/load slots, status messages

## Save Structure
```json
{
  "version": 13,
  "gameVersion": "0.13.0",
  "timestamp": 1234567890,
  "slotId": 0,
  "checksum": "abc123",
  "player": { "x","y","mapId","health","stamina","money","inventory","progression","relationships","flags", ... },
  "world": { "currentMapId","time","exploration","flags","openedLocations","collectedObjects","changedObjects","farming","animals","weather","economy", ... },
  "npcs": { "NPC001": { "x","y","state","needs","inventory","job","relationships","memory", ... } },
  "quests": { "quests": {}, "version": 1 },
  "meta": { "playTime","saveCount","preview": { "day","time","mapId","explorationPercent" } },
  "future": {}
}
```

## Features
- **Slots**: 5 slots (0 auto), localStorage `roamerz_save_<id>`
- **Validation**: Required fields check, type check, version check
- **Missing-data handling**: `ensureDefaults()` fills missing with defaults
- **Corrupted protection**: try/catch JSON parse, checksum warning, mark corrupted, don't crash
- **Versioning**: SAVE_VERSION=13, migration from v1..12 to v13, generic forward migration
- **Forward compatible**: future container, placeholders for farming, animals, weather, etc.
- **Auto-save**: Every 60s and on map transition to slot 0

## Controls
- Ctrl+S: Quick save slot 0
- Ctrl+L: Quick load slot 0
- Ctrl+Shift+S: Save UI (UP/DOWN select, 1-5 quick select, Enter save, D delete, ESC close)
- Ctrl+Shift+L: Load UI
- Ctrl+N: New Game
- Shift+F5 / Shift+F6: Alternative save/load UI

## Testing
- Save after move, time change, area change, NPC interaction
- Load and verify player pos, time, area, NPC pos, schedule, exploration, flags
- Test corrupted JSON, missing fields, version migration
- T runs all tests including Phase 13 (13 tests)
