/**
 * SaveManager - Phase 13 Save, Load & World Persistence
 * Reliable save/load with validation, corruption protection, versioning, defaults
 */

import {
  SAVE_VERSION,
  SAVE_GAME_VERSION,
  MAX_SAVE_SLOTS,
  STORAGE_KEY_PREFIX,
  AUTO_SAVE_SLOT,
  SaveFile,
  SaveSlotInfo,
  SaveValidationResult,
  createDefaultSaveFile,
  createDefaultPlayerSaveData,
  createDefaultWorldSaveData,
  createDefaultQuestSaveData,
  createDefaultMetaSaveData,
  PlayerSaveData,
  WorldSaveData,
  ExplorationMapSaveData
} from './SaveTypes';
import { migrateSaveFile, needsMigration } from './SaveMigration';

export class SaveManager {
  private static instance: SaveManager | null = null;

  // For testing / stats
  private saveCount: number = 0;
  private lastSaveTime: number = 0;
  private lastLoadTime: number = 0;
  private lastError: string | null = null;

  // Cache for slot infos
  private slotCache: Map<number, SaveSlotInfo> = new Map();

  constructor() {
    console.log(`[SaveManager] Initialized v${SAVE_VERSION} game ${SAVE_GAME_VERSION}, slots ${MAX_SAVE_SLOTS}`);
    this.refreshSlotCache();
  }

  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  static resetInstance(): void {
    SaveManager.instance = null;
  }

  // --- Storage keys ---
  private getStorageKey(slotId: number): string {
    return `${STORAGE_KEY_PREFIX}${slotId}`;
  }

  // --- Validation ---
  validateSaveFile(data: any): SaveValidationResult {
    const result: SaveValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      migrated: false,
      version: SAVE_VERSION
    };

    if (!data || typeof data !== 'object') {
      result.valid = false;
      result.errors.push('Save data is not an object');
      return result;
    }

    // Check version
    if (typeof data.version !== 'number') {
      result.warnings.push('Missing version, assuming version 1');
      data.version = 1;
      result.migrated = true;
    }
    result.originalVersion = data.version;
    result.version = data.version;

    // Check required top-level fields
    const requiredFields = ['player', 'world', 'npcs', 'quests', 'meta'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        result.errors.push(`Missing required field: ${field}`);
        result.valid = false;
      }
    }

    // Player validation
    if (data.player) {
      if (typeof data.player.x !== 'number' || typeof data.player.y !== 'number') {
        result.errors.push('Player position invalid');
        result.valid = false;
      }
      if (!data.player.mapId || typeof data.player.mapId !== 'string') {
        result.warnings.push('Player mapId missing, defaulting to village_01');
        result.migrated = true;
      }
      if (!data.player.inventory) {
        result.warnings.push('Player inventory missing, will create default');
        result.migrated = true;
      }
    }

    // World validation
    if (data.world) {
      if (!data.world.currentMapId) {
        result.warnings.push('World currentMapId missing');
        result.migrated = true;
      }
      if (!data.world.time) {
        result.errors.push('World time missing');
        result.valid = false;
      }
      if (!data.world.exploration) {
        result.warnings.push('World exploration missing, will create default');
        result.migrated = true;
      }
    }

    // NPCs validation
    if (data.npcs && typeof data.npcs !== 'object') {
      result.errors.push('NPCs data invalid');
      result.valid = false;
    }

    // Meta validation
    if (data.meta) {
      if (!data.meta.preview) {
        result.warnings.push('Meta preview missing');
        result.migrated = true;
      }
    }

    // Check for future incompatible version
    if (data.version > SAVE_VERSION) {
      result.warnings.push(`Save version ${data.version} is newer than current ${SAVE_VERSION}, may have compatibility issues`);
    }

    // If needs migration, mark
    if (needsMigration(data.version)) {
      result.migrated = true;
      result.warnings.push(`Save version ${data.version} needs migration to ${SAVE_VERSION}`);
    }

    return result;
  }

  // --- Migration ---
  private applyMigration(data: any): { migrated: boolean; data: SaveFile; migrations: string[] } {
    const originalVersion = data.version ?? 1;
    if (needsMigration(originalVersion)) {
      const migrated = migrateSaveFile(data);
      return {
        migrated: true,
        data: migrated,
        migrations: [`Migrated from v${originalVersion} to v${SAVE_VERSION}`]
      };
    }
    return { migrated: false, data, migrations: [] };
  }

  // --- Checksum (simple) ---
  private calculateChecksum(jsonString: string): string {
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  // --- Save ---
  saveGame(slotId: number, saveFile: SaveFile): boolean {
    try {
      if (slotId < 0 || slotId >= MAX_SAVE_SLOTS) {
        this.lastError = `Invalid slotId ${slotId}, must be 0-${MAX_SAVE_SLOTS - 1}`;
        console.error(`[SaveManager] ${this.lastError}`);
        return false;
      }

      // Ensure version and timestamp
      saveFile.version = SAVE_VERSION;
      saveFile.gameVersion = SAVE_GAME_VERSION;
      saveFile.timestamp = Date.now();
      saveFile.slotId = slotId;

      // Update meta
      if (!saveFile.meta) {
        saveFile.meta = createDefaultMetaSaveData(slotId);
      }
      saveFile.meta.lastSaved = Date.now();
      saveFile.meta.saveVersion = SAVE_VERSION;
      saveFile.meta.gameVersion = SAVE_GAME_VERSION;
      saveFile.meta.slotId = slotId;
      saveFile.meta.saveCount = (saveFile.meta.saveCount ?? 0) + 1;
      if (!saveFile.meta.createdAt) {
        saveFile.meta.createdAt = Date.now();
      }

      // Validate before save
      const validation = this.validateSaveFile(saveFile);
      if (!validation.valid) {
        this.lastError = `Save validation failed: ${validation.errors.join(', ')}`;
        console.error(`[SaveManager] ${this.lastError}`);
        return false;
      }

      // Calculate checksum (without checksum field itself)
      const tempForChecksum = { ...saveFile };
      delete (tempForChecksum as any).checksum;
      const jsonForChecksum = JSON.stringify(tempForChecksum);
      saveFile.checksum = this.calculateChecksum(jsonForChecksum);

      // Stringify
      const jsonString = JSON.stringify(saveFile);

      // Size check (localStorage limit ~5MB, we warn at 1MB)
      const sizeBytes = new Blob([jsonString]).size;
      if (sizeBytes > 1024 * 1024) {
        console.warn(`[SaveManager] Save file large: ${(sizeBytes / 1024).toFixed(1)}KB for slot ${slotId}`);
      }
      if (sizeBytes > 4 * 1024 * 1024) {
        this.lastError = `Save file too large: ${sizeBytes} bytes`;
        console.error(`[SaveManager] ${this.lastError}`);
        return false;
      }

      // Write to localStorage with protection
      const key = this.getStorageKey(slotId);
      localStorage.setItem(key, jsonString);

      // Verify write
      const verify = localStorage.getItem(key);
      if (!verify) {
        this.lastError = `Failed to verify save write for slot ${slotId}`;
        console.error(`[SaveManager] ${this.lastError}`);
        return false;
      }

      this.saveCount++;
      this.lastSaveTime = Date.now();
      this.lastError = null;

      // Update cache
      this.refreshSlotCacheForSlot(slotId);

      console.log(`[SaveManager] Saved slot ${slotId} v${saveFile.version} ${(sizeBytes / 1024).toFixed(1)}KB at ${new Date(saveFile.timestamp).toLocaleString()} Day ${saveFile.world.time.day} ${saveFile.player.mapId}`);

      return true;
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      this.lastError = `Save failed: ${err}`;
      console.error(`[SaveManager] Save slot ${slotId} failed:`, e);
      return false;
    }
  }

  // --- Load ---
  loadGame(slotId: number): SaveFile | null {
    try {
      if (slotId < 0 || slotId >= MAX_SAVE_SLOTS) {
        this.lastError = `Invalid slotId ${slotId}`;
        console.error(`[SaveManager] ${this.lastError}`);
        return null;
      }

      const key = this.getStorageKey(slotId);
      const jsonString = localStorage.getItem(key);

      if (!jsonString) {
        this.lastError = `No save found in slot ${slotId}`;
        console.warn(`[SaveManager] ${this.lastError}`);
        return null;
      }

      // Parse with corruption protection
      let parsed: any;
      try {
        parsed = JSON.parse(jsonString);
      } catch (parseError) {
        this.lastError = `Corrupted save file in slot ${slotId}: JSON parse failed`;
        console.error(`[SaveManager] ${this.lastError}`, parseError);
        // Mark as corrupted in cache
        this.slotCache.set(slotId, {
          slotId,
          exists: true,
          corrupted: true,
          error: this.lastError,
          sizeBytes: jsonString.length
        });
        return null;
      }

      // Validate
      const validation = this.validateSaveFile(parsed);
      if (!validation.valid) {
        this.lastError = `Save validation failed for slot ${slotId}: ${validation.errors.join(', ')}`;
        console.error(`[SaveManager] ${this.lastError}`);
        // Still try to migrate / fix if possible? For now return null if invalid
        // But if we can migrate missing fields, attempt migration
        if (validation.errors.some(e => e.includes('Missing required field'))) {
          console.warn(`[SaveManager] Attempting to repair missing fields for slot ${slotId}`);
          const repaired = this.repairSaveFile(parsed);
          if (repaired) {
            const revalidation = this.validateSaveFile(repaired);
            if (revalidation.valid) {
              parsed = repaired;
              console.log(`[SaveManager] Repaired save file for slot ${slotId}`);
            } else {
              return null;
            }
          } else {
            return null;
          }
        } else {
          return null;
        }
      }

      // Migration
      let finalData: SaveFile = parsed;
      let migrations: string[] = [];

      if (needsMigration(parsed.version) || validation.migrated) {
        console.log(`[SaveManager] Migrating save slot ${slotId} from v${parsed.version} to v${SAVE_VERSION}`);
        const migrationResult = this.applyMigration(parsed);
        finalData = migrationResult.data;
        migrations = migrationResult.migrations;
        if (migrationResult.migrated) {
          finalData.migrations = [...(finalData.migrations ?? []), ...migrations];
          console.log(`[SaveManager] Migration applied for slot ${slotId}: ${migrations.join(', ')}`);
        }
      }

      // Checksum verification (warning only, not blocking)
      if (finalData.checksum) {
        const temp = { ...finalData };
        const storedChecksum = temp.checksum;
        delete (temp as any).checksum;
        const calculated = this.calculateChecksum(JSON.stringify(temp));
        if (storedChecksum !== calculated) {
          console.warn(`[SaveManager] Checksum mismatch for slot ${slotId}: stored ${storedChecksum} vs calculated ${calculated}, file may be corrupted but continuing`);
        }
      }

      // Ensure defaults for any missing new properties (missing-data handling)
      finalData = this.ensureDefaults(finalData);

      this.lastLoadTime = Date.now();
      this.lastError = null;

      console.log(`[SaveManager] Loaded slot ${slotId} v${finalData.version} game ${finalData.gameVersion} Day ${finalData.world.time.day} ${finalData.player.mapId} ${finalData.meta.preview.time}`);

      return finalData;
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      this.lastError = `Load failed: ${err}`;
      console.error(`[SaveManager] Load slot ${slotId} failed:`, e);
      return null;
    }
  }

  // --- Repair / Defaults ---
  private repairSaveFile(data: any): SaveFile | null {
    try {
      const defaults = createDefaultSaveFile(data.slotId ?? 0);

      // Merge missing top-level fields
      const repaired: any = {
        ...defaults,
        ...data,
        player: { ...defaults.player, ...(data.player ?? {}) },
        world: {
          ...defaults.world,
          ...(data.world ?? {}),
          time: { ...defaults.world.time, ...(data.world?.time ?? {}) },
          exploration: { ...defaults.world.exploration, ...(data.world?.exploration ?? {}) },
          flags: { ...(data.world?.flags ?? {}) }
        },
        npcs: data.npcs ?? {},
        quests: { ...defaults.quests, ...(data.quests ?? {}) },
        meta: { ...defaults.meta, ...(data.meta ?? {}) },
        future: { ...(data.future ?? {}) }
      };

      // Ensure nested defaults
      repaired.player.inventory = { ...defaults.player.inventory, ...(data.player?.inventory ?? {}) };
      repaired.player.progression = { ...defaults.player.progression, ...(data.player?.progression ?? {}) };
      repaired.player.stats = { ...defaults.player.stats, ...(data.player?.stats ?? {}) };

      return repaired as SaveFile;
    } catch (e) {
      console.error('[SaveManager] Repair failed:', e);
      return null;
    }
  }

  private ensureDefaults(saveFile: SaveFile): SaveFile {
    // Ensure player defaults
    const defaultPlayer = createDefaultPlayerSaveData();
    saveFile.player = {
      ...defaultPlayer,
      ...saveFile.player,
      inventory: { ...defaultPlayer.inventory, ...(saveFile.player.inventory ?? {}) },
      progression: { ...defaultPlayer.progression, ...(saveFile.player.progression ?? {}) },
      stats: { ...defaultPlayer.stats, ...(saveFile.player.stats ?? {}) },
      flags: saveFile.player.flags ?? {},
      importantFlags: saveFile.player.importantFlags ?? {},
      relationships: saveFile.player.relationships ?? {},
      relationshipStages: saveFile.player.relationshipStages ?? {},
      questProgress: saveFile.player.questProgress ?? {},
      // future placeholders
      farming: saveFile.player.farming ?? {},
      crafting: saveFile.player.crafting ?? {},
      cooking: (saveFile.player as any).cooking ?? {},
      equipment: saveFile.player.equipment ?? {},
      combat: saveFile.player.combat ?? {}
    };

    // Ensure world defaults
    const defaultWorld = createDefaultWorldSaveData();
    saveFile.world = {
      ...defaultWorld,
      ...saveFile.world,
      time: { ...defaultWorld.time, ...(saveFile.world.time ?? {}) },
      exploration: {
        ...defaultWorld.exploration,
        ...(saveFile.world.exploration ?? {}),
        maps: saveFile.world.exploration?.maps ?? {}
      },
      flags: saveFile.world.flags ?? {},
      openedLocations: saveFile.world.openedLocations ?? ['village_01'],
      closedLocations: saveFile.world.closedLocations ?? [],
      collectedObjects: saveFile.world.collectedObjects ?? [],
      changedObjects: saveFile.world.changedObjects ?? {},
      questRelatedChanges: saveFile.world.questRelatedChanges ?? {},
      eventStates: saveFile.world.eventStates ?? {},
      // future
      farming: saveFile.world.farming ?? { plots: {}, totalPlotsCreated: 0, totalHarvested: 0, totalPlanted: 0, version: 2 },
      animals: saveFile.world.animals ?? { animals: {}, totalCreated: 0, totalCollected: 0, totalFed: 0, totalPetted: 0, version: 2 },
      crafting: saveFile.world.crafting ?? { recipesUnlocked: [], totalCrafted: 0, craftedCounts: {}, version: 1 },
      cooking: (saveFile.world as any).cooking ?? { recipesUnlocked: [], totalCooked: 0, cookedCounts: {}, version: 1 },
      weather: saveFile.world.weather ?? { current: 'SUNNY', intensity: 0, nextChange: 0, version: 1 },
      economy: saveFile.world.economy ?? { shopInventories: {}, prices: {}, transactionHistory: [], version: 1 },
      dungeons: saveFile.world.dungeons ?? {},
      events: saveFile.world.events ?? {},
      seasons: saveFile.world.seasons ?? {}
    };

    // Ensure quests
    const defaultQuests = createDefaultQuestSaveData();
    saveFile.quests = {
      ...defaultQuests,
      ...(saveFile.quests ?? {}),
      quests: saveFile.quests?.quests ?? {}
    };

    // Ensure meta
    const defaultMeta = createDefaultMetaSaveData(saveFile.slotId);
    saveFile.meta = {
      ...defaultMeta,
      ...(saveFile.meta ?? {}),
      preview: { ...defaultMeta.preview, ...(saveFile.meta?.preview ?? {}) }
    };

    // Ensure NPCs have defaults
    for (const npcId of Object.keys(saveFile.npcs)) {
      const npc = saveFile.npcs[npcId];
      if (!npc) continue;
      saveFile.npcs[npcId] = {
        ...npc,
        relationships: npc.relationships ?? {},
        relationshipStages: npc.relationshipStages ?? {},
        memory: npc.memory ?? [],
        questState: npc.questState ?? {},
        flags: npc.flags ?? {},
        farming: npc.farming ?? {},
        dialogueHistory: npc.dialogueHistory ?? []
      };
    }

    // Ensure future container
    saveFile.future = saveFile.future ?? {};

    // Ensure version
    saveFile.version = saveFile.version ?? SAVE_VERSION;
    saveFile.gameVersion = saveFile.gameVersion ?? SAVE_GAME_VERSION;

    return saveFile;
  }

  // --- Slots ---
  hasSave(slotId: number): boolean {
    const key = this.getStorageKey(slotId);
    return localStorage.getItem(key) !== null;
  }

  deleteSave(slotId: number): boolean {
    try {
      const key = this.getStorageKey(slotId);
      localStorage.removeItem(key);
      this.slotCache.delete(slotId);
      console.log(`[SaveManager] Deleted slot ${slotId}`);
      return true;
    } catch (e) {
      console.error(`[SaveManager] Delete slot ${slotId} failed:`, e);
      return false;
    }
  }

  getSaveSlotInfo(slotId: number): SaveSlotInfo {
    // Check cache first
    if (this.slotCache.has(slotId)) {
      return this.slotCache.get(slotId)!;
    }
    return this.refreshSlotCacheForSlot(slotId);
  }

  getAllSaveSlots(): SaveSlotInfo[] {
    const slots: SaveSlotInfo[] = [];
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      slots.push(this.getSaveSlotInfo(i));
    }
    return slots;
  }

  private refreshSlotCache(): void {
    this.slotCache.clear();
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      this.refreshSlotCacheForSlot(i);
    }
  }

  private refreshSlotCacheForSlot(slotId: number): SaveSlotInfo {
    const key = this.getStorageKey(slotId);
    const jsonString = localStorage.getItem(key);

    if (!jsonString) {
      const info: SaveSlotInfo = {
        slotId,
        exists: false
      };
      this.slotCache.set(slotId, info);
      return info;
    }

    try {
      const parsed = JSON.parse(jsonString);
      const sizeBytes = new Blob([jsonString]).size;

      const info: SaveSlotInfo = {
        slotId,
        exists: true,
        timestamp: parsed.timestamp,
        gameVersion: parsed.gameVersion,
        saveVersion: parsed.version,
        preview: parsed.meta?.preview,
        meta: parsed.meta,
        corrupted: false,
        sizeBytes
      };

      // Validate for corruption flag
      const validation = this.validateSaveFile(parsed);
      if (!validation.valid) {
        info.corrupted = true;
        info.error = validation.errors.join('; ');
      }

      this.slotCache.set(slotId, info);
      return info;
    } catch (e) {
      const info: SaveSlotInfo = {
        slotId,
        exists: true,
        corrupted: true,
        error: e instanceof Error ? e.message : String(e),
        sizeBytes: jsonString.length
      };
      this.slotCache.set(slotId, info);
      return info;
    }
  }

  getLatestSaveSlot(): SaveSlotInfo | null {
    const slots = this.getAllSaveSlots().filter(s => s.exists && !s.corrupted);
    if (slots.length === 0) return null;
    slots.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    return slots[0];
  }

  // --- Export / Import ---
  exportSave(slotId: number): string | null {
    const key = this.getStorageKey(slotId);
    const data = localStorage.getItem(key);
    if (!data) return null;
    return data;
  }

  importSave(jsonString: string, slotId: number): boolean {
    try {
      // Validate JSON
      const parsed = JSON.parse(jsonString);
      const validation = this.validateSaveFile(parsed);
      if (!validation.valid) {
        this.lastError = `Import validation failed: ${validation.errors.join(', ')}`;
        console.error(`[SaveManager] ${this.lastError}`);
        return false;
      }

      // Save to slot
      const key = this.getStorageKey(slotId);
      localStorage.setItem(key, jsonString);
      this.refreshSlotCacheForSlot(slotId);
      console.log(`[SaveManager] Imported save to slot ${slotId}`);
      return true;
    } catch (e) {
      this.lastError = `Import failed: ${e instanceof Error ? e.message : String(e)}`;
      console.error(`[SaveManager] ${this.lastError}`);
      return false;
    }
  }

  // --- Auto save ---
  autoSave(saveFile: SaveFile): boolean {
    return this.saveGame(AUTO_SAVE_SLOT, saveFile);
  }

  // --- Stats ---
  getStats(): { saveCount: number; lastSaveTime: number; lastLoadTime: number; lastError: string | null; slotCount: number; corruptedCount: number } {
    const slots = this.getAllSaveSlots();
    const existing = slots.filter(s => s.exists).length;
    const corrupted = slots.filter(s => s.corrupted).length;
    return {
      saveCount: this.saveCount,
      lastSaveTime: this.lastSaveTime,
      lastLoadTime: this.lastLoadTime,
      lastError: this.lastError,
      slotCount: existing,
      corruptedCount: corrupted
    };
  }

  getLastError(): string | null {
    return this.lastError;
  }

  // --- New Game ---
  createNewGameSave(slotId: number = AUTO_SAVE_SLOT): SaveFile {
    const saveFile = createDefaultSaveFile(slotId);
    saveFile.meta.createdAt = Date.now();
    saveFile.meta.lastSaved = Date.now();
    console.log(`[SaveManager] Created new game save for slot ${slotId}`);
    return saveFile;
  }

  // --- Utility: compress explored boolean[] to string and vice versa ---
  static compressExplored(explored: boolean[]): string {
    // Simple: convert to string of 0/1
    return explored.map(b => b ? '1' : '0').join('');
  }

  static decompressExplored(data: string): boolean[] {
    return data.split('').map(c => c === '1');
  }

  static compressExploredToBase64(explored: boolean[]): string {
    // For future optimization: pack bits into base64
    // For now use simple 0/1 string
    return SaveManager.compressExplored(explored);
  }

  // --- Debug ---
  debugPrintSlots(): void {
    console.log('[SaveManager] === SAVE SLOTS ===');
    for (const slot of this.getAllSaveSlots()) {
      if (slot.exists) {
        console.log(`  Slot ${slot.slotId}: ${slot.corrupted ? 'CORRUPTED' : 'OK'} v${slot.saveVersion} ${slot.gameVersion} ${slot.preview ? `Day ${slot.preview.day} ${slot.preview.time} ${slot.preview.mapId}` : ''} ${slot.sizeBytes ? `${(slot.sizeBytes / 1024).toFixed(1)}KB` : ''} ${slot.error ? `Error: ${slot.error}` : ''}`);
      } else {
        console.log(`  Slot ${slot.slotId}: EMPTY`);
      }
    }
    console.log('[SaveManager] Stats:', this.getStats());
  }

  clearAllSaves(): void {
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      this.deleteSave(i);
    }
    console.log('[SaveManager] Cleared all saves');
  }
}
