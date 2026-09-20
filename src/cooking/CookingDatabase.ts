/**
 * CookingDatabase - Phase 16.3 Cooking System
 * Data-driven cooking recipes
 */

import { CookingRecipeDefinition, CookingCategory } from './CookingRecipe';

export class CookingDatabase {
  private static instance: CookingDatabase | null = null;
  private recipes: Map<string, CookingRecipeDefinition> = new Map();

  constructor() {
    this.initialize();
  }

  static getInstance(): CookingDatabase {
    if (!CookingDatabase.instance) {
      CookingDatabase.instance = new CookingDatabase();
    }
    return CookingDatabase.instance;
  }

  static resetInstance(): void {
    CookingDatabase.instance = null;
  }

  private initialize(): void {
    this.recipes.clear();

    const defaultRecipes: CookingRecipeDefinition[] = [
      {
        id: 'cook_fried_egg',
        name: 'Fry Egg',
        resultItemId: 'fried_egg',
        resultQuantity: 1,
        ingredients: [
          { itemId: 'egg', quantity: 1 }
        ],
        category: CookingCategory.BREAKFAST,
        requiredStation: 'campfire',
        cookingTimeSeconds: 5,
        description: 'Simple fried egg on campfire. 1 egg → 1 fried egg.',
        icon: '🍳',
        unlockedByDefault: true,
        tags: ['breakfast', 'egg', 'campfire'],
        effects: '+35 hunger, +5 health'
      },
      {
        id: 'cook_omelette',
        name: 'Make Omelette',
        resultItemId: 'omelette',
        resultQuantity: 1,
        ingredients: [
          { itemId: 'egg', quantity: 2 },
          { itemId: 'milk', quantity: 1 },
          { itemId: 'mushroom', quantity: 1 }
        ],
        category: CookingCategory.BREAKFAST,
        requiredStation: 'stove',
        cookingTimeSeconds: 15,
        description: 'Fluffy omelette. 2 egg + 1 milk + 1 mushroom → 1 omelette.',
        icon: '🥘',
        unlockedByDefault: true,
        tags: ['breakfast', 'egg', 'dairy'],
        effects: '+60 hunger, +15 health, +20 stamina'
      },
      {
        id: 'cook_cheese',
        name: 'Make Cheese',
        resultItemId: 'cheese',
        resultQuantity: 1,
        ingredients: [
          { itemId: 'milk', quantity: 2 }
        ],
        category: CookingCategory.DAIRY,
        requiredStation: 'kitchen',
        cookingTimeSeconds: 30,
        description: 'Age milk into cheese. 2 milk → 1 cheese.',
        icon: '🧀',
        unlockedByDefault: true,
        tags: ['dairy', 'milk'],
        effects: '+40 hunger, +8 health'
      },
      {
        id: 'cook_pancake',
        name: 'Make Pancakes',
        resultItemId: 'pancake',
        resultQuantity: 2,
        ingredients: [
          { itemId: 'wheat', quantity: 1 },
          { itemId: 'egg', quantity: 1 },
          { itemId: 'milk', quantity: 1 }
        ],
        category: CookingCategory.BREAKFAST,
        requiredStation: 'stove',
        cookingTimeSeconds: 20,
        description: 'Fluffy pancakes. 1 wheat + 1 egg + 1 milk → 2 pancakes.',
        icon: '🥞',
        unlockedByDefault: true,
        tags: ['breakfast', 'baking'],
        effects: '+55 hunger, +10 health, +20 stamina'
      },
      {
        id: 'cook_soup',
        name: 'Cook Soup',
        resultItemId: 'soup',
        resultQuantity: 1,
        ingredients: [
          { itemId: 'carrot', quantity: 1 },
          { itemId: 'mushroom', quantity: 1 },
          { itemId: 'herb', quantity: 1 }
        ],
        category: CookingCategory.SOUP,
        requiredStation: 'campfire',
        cookingTimeSeconds: 15,
        description: 'Warm vegetable soup. 1 carrot + 1 mushroom + 1 herb → 1 soup.',
        icon: '🍲',
        unlockedByDefault: true,
        tags: ['soup', 'vegetable', 'healthy'],
        effects: '+50 hunger, +12 health'
      },
      {
        id: 'cook_stew',
        name: 'Cook Stew',
        resultItemId: 'stew',
        resultQuantity: 1,
        ingredients: [
          { itemId: 'carrot', quantity: 1 },
          { itemId: 'wheat', quantity: 1 },
          { itemId: 'mushroom', quantity: 1 },
          { itemId: 'milk', quantity: 1 }
        ],
        category: CookingCategory.MEAL,
        requiredStation: 'stove',
        cookingTimeSeconds: 25,
        description: 'Hearty stew. 1 carrot + 1 wheat + 1 mushroom + 1 milk → 1 stew.',
        icon: '🍛',
        unlockedByDefault: true,
        tags: ['meal', 'hearty', 'farm'],
        effects: '+75 hunger, +20 health, +25 stamina'
      },
      {
        id: 'cook_cake',
        name: 'Bake Cake',
        resultItemId: 'cake',
        resultQuantity: 1,
        ingredients: [
          { itemId: 'wheat', quantity: 2 },
          { itemId: 'egg', quantity: 2 },
          { itemId: 'milk', quantity: 1 },
          { itemId: 'berry', quantity: 2 }
        ],
        category: CookingCategory.DESSERT,
        requiredStation: 'kitchen',
        cookingTimeSeconds: 40,
        description: 'Delicious berry cake. 2 wheat + 2 egg + 1 milk + 2 berry → 1 cake.',
        icon: '🍰',
        unlockedByDefault: true,
        tags: ['dessert', 'baking', 'festive'],
        effects: '+80 hunger, +25 health, +30 stamina'
      },
      {
        id: 'cook_salad',
        name: 'Make Salad',
        resultItemId: 'salad',
        resultQuantity: 1,
        ingredients: [
          { itemId: 'carrot', quantity: 1 },
          { itemId: 'berry', quantity: 1 },
          { itemId: 'herb', quantity: 1 }
        ],
        category: CookingCategory.MEAL,
        requiredStation: 'kitchen',
        cookingTimeSeconds: 10,
        description: 'Fresh healthy salad. 1 carrot + 1 berry + 1 herb → 1 salad.',
        icon: '🥗',
        unlockedByDefault: true,
        tags: ['meal', 'healthy', 'vegetable'],
        effects: '+35 hunger, +15 health'
      },
      {
        id: 'cook_truffle_soup',
        name: 'Truffle Soup',
        resultItemId: 'soup',
        resultQuantity: 2,
        ingredients: [
          { itemId: 'truffle', quantity: 1 },
          { itemId: 'milk', quantity: 1 },
          { itemId: 'mushroom', quantity: 1 }
        ],
        category: CookingCategory.SOUP,
        requiredStation: 'kitchen',
        cookingTimeSeconds: 30,
        description: 'Luxury truffle soup. 1 truffle + 1 milk + 1 mushroom → 2 soup.',
        icon: '🍲',
        unlockedByDefault: true,
        tags: ['soup', 'luxury', 'rare', 'animal'],
        effects: '+50 hunger, +12 health (x2)'
      },
      {
        id: 'cook_egg_bread',
        name: 'Egg Bread Deluxe',
        resultItemId: 'bread',
        resultQuantity: 2,
        ingredients: [
          { itemId: 'wheat', quantity: 2 },
          { itemId: 'egg', quantity: 1 },
          { itemId: 'cheese', quantity: 1 }
        ],
        category: CookingCategory.MEAL,
        requiredStation: 'kitchen',
        cookingTimeSeconds: 20,
        description: 'Deluxe bread with cheese. 2 wheat + 1 egg + 1 cheese → 2 bread.',
        icon: '🍞',
        unlockedByDefault: true,
        tags: ['meal', 'baking', 'dairy'],
        effects: '+40 hunger'
      }
    ];

    for (const recipe of defaultRecipes) {
      this.recipes.set(recipe.id, recipe);
    }

    console.log(`[CookingDatabase] Loaded ${this.recipes.size} recipes`);
  }

  getRecipe(id: string): CookingRecipeDefinition | undefined {
    return this.recipes.get(id);
  }

  getAllRecipes(): CookingRecipeDefinition[] {
    return Array.from(this.recipes.values());
  }

  getRecipesByCategory(category: CookingCategory): CookingRecipeDefinition[] {
    return this.getAllRecipes().filter(r => r.category === category);
  }

  getUnlockedRecipes(unlockedIds?: string[]): CookingRecipeDefinition[] {
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

  registerRecipe(def: CookingRecipeDefinition): boolean {
    if (this.recipes.has(def.id)) {
      console.warn(`[CookingDatabase] Recipe ${def.id} already exists, overwriting`);
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
