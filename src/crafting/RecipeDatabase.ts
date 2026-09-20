/**
 * RecipeDatabase - Phase 16.2 Crafting System
 * Data-driven recipes
 */

import { RecipeDefinition, RecipeCategory } from './Recipe';

export class RecipeDatabase {
  private static instance: RecipeDatabase | null = null;
  private recipes: Map<string, RecipeDefinition> = new Map();

  constructor() {
    this.initialize();
  }

  static getInstance(): RecipeDatabase {
    if (!RecipeDatabase.instance) {
      RecipeDatabase.instance = new RecipeDatabase();
    }
    return RecipeDatabase.instance;
  }

  static resetInstance(): void {
    RecipeDatabase.instance = null;
  }

  private initialize(): void {
    this.recipes.clear();

    const defaultRecipes: RecipeDefinition[] = [
      // Tools
      {
        id: 'craft_axe',
        name: 'Craft Axe',
        resultItemId: 'axe',
        resultQuantity: 1,
        ingredients: [
          { itemId: 'wood', quantity: 3 },
          { itemId: 'stone', quantity: 2 }
        ],
        category: RecipeCategory.TOOL,
        description: 'Basic axe for chopping wood. 3 wood + 2 stone.',
        icon: '🪓',
        unlockedByDefault: true,
        tags: ['tool', 'woodcutting']
      },
      {
        id: 'craft_pickaxe',
        name: 'Craft Pickaxe',
        resultItemId: 'pickaxe',
        resultQuantity: 1,
        ingredients: [
          { itemId: 'wood', quantity: 3 },
          { itemId: 'stone', quantity: 3 },
          { itemId: 'ore', quantity: 1 }
        ],
        category: RecipeCategory.TOOL,
        description: 'Pickaxe for mining. 3 wood + 3 stone + 1 ore.',
        icon: '⛏️',
        unlockedByDefault: true,
        tags: ['tool', 'mining']
      },
      {
        id: 'craft_fishing_rod',
        name: 'Craft Fishing Rod',
        resultItemId: 'fishing_rod',
        resultQuantity: 1,
        ingredients: [
          { itemId: 'wood', quantity: 3 },
          { itemId: 'fiber', quantity: 2 }
        ],
        category: RecipeCategory.TOOL,
        description: 'Fishing rod for catching fish. 3 wood + 2 fiber.',
        icon: '🎣',
        unlockedByDefault: true,
        tags: ['tool', 'fishing']
      },
      {
        id: 'craft_sickle',
        name: 'Craft Sickle',
        resultItemId: 'sickle',
        resultQuantity: 1,
        ingredients: [
          { itemId: 'wood', quantity: 2 },
          { itemId: 'ore', quantity: 1 }
        ],
        category: RecipeCategory.TOOL,
        description: 'Sickle for harvesting crops. 2 wood + 1 ore.',
        icon: '🔪',
        unlockedByDefault: true,
        tags: ['tool', 'farming']
      },
      // Food
      {
        id: 'craft_bread',
        name: 'Bake Bread',
        resultItemId: 'bread',
        resultQuantity: 1,
        ingredients: [
          { itemId: 'wheat', quantity: 3 }
        ],
        category: RecipeCategory.FOOD,
        description: 'Bake bread from wheat. 3 wheat → 1 bread.',
        icon: '🍞',
        unlockedByDefault: true,
        tags: ['food', 'cooking', 'farm']
      },
      {
        id: 'craft_bread_egg',
        name: 'Egg Bread',
        resultItemId: 'bread',
        resultQuantity: 2,
        ingredients: [
          { itemId: 'wheat', quantity: 2 },
          { itemId: 'egg', quantity: 1 }
        ],
        category: RecipeCategory.FOOD,
        description: 'Better bread with egg. 2 wheat + 1 egg → 2 bread.',
        icon: '🍞',
        unlockedByDefault: true,
        tags: ['food', 'cooking', 'animal']
      },
      // Feed
      {
        id: 'craft_hay',
        name: 'Make Hay',
        resultItemId: 'hay',
        resultQuantity: 2,
        ingredients: [
          { itemId: 'wheat', quantity: 2 }
        ],
        category: RecipeCategory.FEED,
        description: 'Dry wheat into hay. 2 wheat → 2 hay.',
        icon: '🌾',
        unlockedByDefault: true,
        tags: ['feed', 'farm']
      },
      {
        id: 'craft_animal_feed',
        name: 'Mix Animal Feed',
        resultItemId: 'animal_feed',
        resultQuantity: 3,
        ingredients: [
          { itemId: 'hay', quantity: 2 },
          { itemId: 'wheat', quantity: 1 },
          { itemId: 'carrot', quantity: 1 }
        ],
        category: RecipeCategory.FEED,
        description: 'Mixed feed for all animals. 2 hay + 1 wheat + 1 carrot → 3 feed.',
        icon: '🥣',
        unlockedByDefault: true,
        tags: ['feed', 'animal', 'farm']
      },
      // Potions
      {
        id: 'craft_health_potion',
        name: 'Brew Health Potion',
        resultItemId: 'health_potion',
        resultQuantity: 1,
        ingredients: [
          { itemId: 'herb', quantity: 2 },
          { itemId: 'mushroom', quantity: 1 }
        ],
        category: RecipeCategory.POTION,
        description: 'Brew health potion. 2 herb + 1 mushroom.',
        icon: '🧪',
        unlockedByDefault: true,
        tags: ['potion', 'alchemy']
      },
      {
        id: 'craft_stamina_potion',
        name: 'Brew Stamina Potion',
        resultItemId: 'stamina_potion',
        resultQuantity: 1,
        ingredients: [
          { itemId: 'herb', quantity: 1 },
          { itemId: 'berry', quantity: 2 },
          { itemId: 'mushroom', quantity: 1 }
        ],
        category: RecipeCategory.POTION,
        description: 'Brew stamina potion. 1 herb + 2 berry + 1 mushroom.',
        icon: '⚗️',
        unlockedByDefault: true,
        tags: ['potion', 'alchemy']
      },
      // Materials
      {
        id: 'craft_fiber',
        name: 'Process Fiber',
        resultItemId: 'fiber',
        resultQuantity: 2,
        ingredients: [
          { itemId: 'wood', quantity: 1 }
        ],
        category: RecipeCategory.MATERIAL,
        description: 'Process wood into fiber. 1 wood → 2 fiber.',
        icon: '🧵',
        unlockedByDefault: true,
        tags: ['material', 'crafting']
      },
      {
        id: 'craft_coin',
        name: 'Smelt Coins',
        resultItemId: 'coin',
        resultQuantity: 10,
        ingredients: [
          { itemId: 'ore', quantity: 1 }
        ],
        category: RecipeCategory.MATERIAL,
        description: 'Smelt ore into coins. 1 ore → 10 coins.',
        icon: '🪙',
        unlockedByDefault: true,
        tags: ['material', 'treasure', 'smelting']
      }
    ];

    for (const recipe of defaultRecipes) {
      this.recipes.set(recipe.id, recipe);
    }

    console.log(`[RecipeDatabase] Loaded ${this.recipes.size} recipes`);
  }

  getRecipe(id: string): RecipeDefinition | undefined {
    return this.recipes.get(id);
  }

  getAllRecipes(): RecipeDefinition[] {
    return Array.from(this.recipes.values());
  }

  getRecipesByCategory(category: RecipeCategory): RecipeDefinition[] {
    return this.getAllRecipes().filter(r => r.category === category);
  }

  getUnlockedRecipes(unlockedIds?: string[]): RecipeDefinition[] {
    if (!unlockedIds || unlockedIds.length === 0) {
      return this.getAllRecipes().filter(r => r.unlockedByDefault);
    }
    return this.getAllRecipes().filter(r => r.unlockedByDefault || unlockedIds.includes(r.id));
  }

  getCount(): number {
    return this.recipes.size;
  }

  hasRecipe(id: string): boolean {
    return this.recipes.has(id);
  }

  registerRecipe(def: RecipeDefinition): boolean {
    if (this.recipes.has(def.id)) {
      console.warn(`[RecipeDatabase] Recipe ${def.id} already exists, overwriting`);
    }
    this.recipes.set(def.id, def);
    return true;
  }

  unregisterRecipe(id: string): boolean {
    return this.recipes.delete(id);
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const recipe of this.recipes.values()) {
      if (!recipe.id) errors.push(`Recipe missing id`);
      if (!recipe.resultItemId) errors.push(`Recipe ${recipe.id} missing resultItemId`);
      if (recipe.resultQuantity <= 0) errors.push(`Recipe ${recipe.id} invalid resultQuantity`);
      if (recipe.ingredients.length === 0) errors.push(`Recipe ${recipe.id} no ingredients`);
      for (const ing of recipe.ingredients) {
        if (!ing.itemId) errors.push(`Recipe ${recipe.id} ingredient missing itemId`);
        if (ing.quantity <= 0) errors.push(`Recipe ${recipe.id} ingredient ${ing.itemId} invalid qty`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  getDebugString(): string {
    return `${this.recipes.size} recipes: ${Array.from(this.recipes.keys()).join(', ')}`;
  }
}
