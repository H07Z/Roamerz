/**
 * SaveMigration - Phase 13 Save Versioning & Migration
 * Handles migration between save versions with backward compatibility
 * Future phases will add more migrations
 */

import { SAVE_VERSION, SaveFile, createDefaultSaveFile, createDefaultPlayerSaveData, createDefaultWorldSaveData, createDefaultQuestSaveData, createDefaultMetaSaveData } from './SaveTypes';

export function needsMigration(version: number): boolean {
  return version < SAVE_VERSION;
}

export function migrateSaveFile(saveFile: any): SaveFile {
  let currentVersion = saveFile.version ?? 1;
  let migratedFile: any = { ...saveFile };
  const migrations: string[] = saveFile.migrations ?? [];

  console.log(`[SaveMigration] Starting migration from v${currentVersion} to v${SAVE_VERSION}`);

  // Sequential migration: apply each version step
  while (currentVersion < SAVE_VERSION) {
    const nextVersion = currentVersion + 1;
    console.log(`[SaveMigration] Migrating v${currentVersion} -> v${nextVersion}`);

    switch (nextVersion) {
      case 13:
        migratedFile = migrateToV13(migratedFile);
        migrations.push(`Migrated to v13 (Phase 13 Save System)`);
        break;
      // Future versions:
      // case 14: migratedFile = migrateToV14(migratedFile); break;
      // case 15: migratedFile = migrateToV15(migratedFile); break;
      default:
        // Generic migration: ensure defaults for unknown future version
        migratedFile = migrateGeneric(migratedFile, nextVersion);
        migrations.push(`Generic migration to v${nextVersion}`);
        break;
    }

    currentVersion = nextVersion;
    migratedFile.version = currentVersion;
  }

  migratedFile.migrations = migrations;
  migratedFile.meta = {
    ...migratedFile.meta,
    saveVersion: SAVE_VERSION,
    migrations
  };

  console.log(`[SaveMigration] Migration complete to v${SAVE_VERSION}: ${migrations.join(', ')}`);

  return migratedFile as SaveFile;
}

function migrateToV13(oldSave: any): any {
  // V13 is the first versioned save with full Phase 1-12 data
  // If old save is from pre-versioned era (e.g., raw data), convert to new structure

  const defaults = createDefaultSaveFile(oldSave.slotId ?? 0);

  // If old save already has new structure, just ensure fields
  if (oldSave.player && oldSave.world && oldSave.npcs) {
    // Ensure new fields added in v13
    return {
      ...defaults,
      ...oldSave,
      version: 13,
      gameVersion: oldSave.gameVersion ?? '0.13.0',
      player: {
        ...defaults.player,
        ...(oldSave.player ?? {}),
        // Ensure new Phase 13 fields
        health: oldSave.player.health ?? 100,
        maxHealth: oldSave.player.maxHealth ?? 100,
        stamina: oldSave.player.stamina ?? 100,
        maxStamina: oldSave.player.maxStamina ?? 100,
        money: oldSave.player.money ?? oldSave.player.inventory?.coins ?? 50,
        inventory: {
          ...defaults.player.inventory,
          ...(oldSave.player.inventory ?? {}),
          coins: oldSave.player.inventory?.coins ?? oldSave.player.money ?? 50
        },
        progression: {
          ...defaults.player.progression,
          ...(oldSave.player.progression ?? {})
        },
        stats: {
          ...defaults.player.stats,
          ...(oldSave.player.stats ?? {})
        },
        flags: oldSave.player.flags ?? {},
        importantFlags: oldSave.player.importantFlags ?? {},
        relationships: oldSave.player.relationships ?? {},
        questProgress: oldSave.player.questProgress ?? {}
      },
      world: {
        ...defaults.world,
        ...(oldSave.world ?? {}),
        time: {
          ...defaults.world.time,
          ...(oldSave.world?.time ?? {})
        },
        exploration: {
          ...defaults.world.exploration,
          ...(oldSave.world?.exploration ?? {}),
          maps: oldSave.world?.exploration?.maps ?? {}
        },
        flags: oldSave.world?.flags ?? {},
        openedLocations: oldSave.world?.openedLocations ?? ['village_01'],
        collectedObjects: oldSave.world?.collectedObjects ?? [],
        changedObjects: oldSave.world?.changedObjects ?? {},
        // Ensure future placeholders
        farming: oldSave.world?.farming ?? { plots: {}, version: 1 },
        animals: oldSave.world?.animals ?? { animals: {}, version: 1 },
        weather: oldSave.world?.weather ?? { current: 'SUNNY', intensity: 0, nextChange: 0, version: 1 },
        economy: oldSave.world?.economy ?? { shopInventories: {}, prices: {}, transactionHistory: [], version: 1 }
      },
      npcs: oldSave.npcs ?? {},
      quests: {
        ...defaults.quests,
        ...(oldSave.quests ?? {}),
        quests: oldSave.quests?.quests ?? {}
      },
      future: oldSave.future ?? {},
      meta: {
        ...defaults.meta,
        ...(oldSave.meta ?? {}),
        saveVersion: 13,
        gameVersion: oldSave.gameVersion ?? '0.13.0'
      }
    };
  }

  // If old save is from even older format (e.g., just player position), try to salvage
  if (oldSave.x && oldSave.y && !oldSave.player) {
    console.log('[SaveMigration] Detected legacy raw player position save, converting');
    return {
      ...defaults,
      version: 13,
      player: {
        ...defaults.player,
        x: oldSave.x,
        y: oldSave.y,
        mapId: oldSave.mapId ?? 'village_01'
      },
      world: {
        ...defaults.world,
        currentMapId: oldSave.mapId ?? 'village_01',
        playerMapId: oldSave.mapId ?? 'village_01'
      }
    };
  }

  // Fallback: return defaults with old data merged where possible
  return {
    ...defaults,
    ...oldSave,
    version: 13
  };
}

function migrateGeneric(saveFile: any, targetVersion: number): any {
  // Generic forward-compatibility: ensure defaults for any new fields
  const defaults = createDefaultSaveFile(saveFile.slotId ?? 0);

  return {
    ...defaults,
    ...saveFile,
    version: targetVersion,
    player: {
      ...defaults.player,
      ...(saveFile.player ?? {}),
      inventory: { ...defaults.player.inventory, ...(saveFile.player?.inventory ?? {}) },
      progression: { ...defaults.player.progression, ...(saveFile.player?.progression ?? {}) },
      stats: { ...defaults.player.stats, ...(saveFile.player?.stats ?? {}) }
    },
    world: {
      ...defaults.world,
      ...(saveFile.world ?? {}),
      time: { ...defaults.world.time, ...(saveFile.world?.time ?? {}) },
      exploration: { ...defaults.world.exploration, ...(saveFile.world?.exploration ?? {}) }
    },
    quests: { ...defaults.quests, ...(saveFile.quests ?? {}) },
    future: { ...(saveFile.future ?? {}) }
  };
}

// For future phases, add specific migrations:
// function migrateToV14(saveFile: any): any { ... }
// function migrateToV15(saveFile: any): any { ... }

export function getMigrationPath(fromVersion: number, toVersion: number = SAVE_VERSION): number[] {
  const path: number[] = [];
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    path.push(v);
  }
  return path;
}

export function isSaveCompatible(saveVersion: number): boolean {
  // For now, all versions < current are compatible via migration
  // Future: if breaking change, return false for very old versions
  if (saveVersion > SAVE_VERSION) {
    // Newer save than current game - may be incompatible
    // Allow with warning if only 1 version ahead, else incompatible
    return saveVersion <= SAVE_VERSION + 1;
  }
  // Allow migration from any older version for now
  // In future, might set minimum supported version
  const MIN_SUPPORTED_VERSION = 1;
  return saveVersion >= MIN_SUPPORTED_VERSION;
}
