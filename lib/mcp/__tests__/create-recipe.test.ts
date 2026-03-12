/**
 * Tests for the create_recipe MCP tool
 */

import { createRecipeTool } from '../tools/create-recipe';
import type { Recipe } from '@/types/recipe';

// Mock the recipe service
jest.mock('@/lib/services/recipe-service', () => ({
  createRecipe: jest.fn(),
  markRecipeAsViewed: jest.fn(),
}));

import { createRecipe, markRecipeAsViewed } from '@/lib/services/recipe-service';

const mockCreateRecipe = createRecipe as jest.MockedFunction<typeof createRecipe>;
const mockMarkRecipeAsViewed = markRecipeAsViewed as jest.MockedFunction<typeof markRecipeAsViewed>;

const createdRecipe: Recipe = {
  id: 'recipe123',
  name: 'Chocolate Chip Cookies',
  ingredients: [{ name: 'Main', ingredients: ['2 cups flour', '1 cup sugar'] }],
  directions: ['Mix ingredients', 'Bake at 375°F for 10 mins'],
  sourceKind: 'manual',
  tags: ['dessert', 'quick'],
  notes: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const validArgs = {
  name: 'Chocolate Chip Cookies',
  ingredients: [{ name: 'Main', ingredients: ['2 cups flour', '1 cup sugar'] }],
  directions: ['Mix ingredients', 'Bake at 375°F for 10 mins'],
  sourceKind: 'manual' as const,
  tags: ['dessert', 'quick'],
  notes: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateRecipe.mockResolvedValue(createdRecipe);
  mockMarkRecipeAsViewed.mockResolvedValue(undefined);
});

describe('create_recipe tool', () => {
  describe('tool metadata', () => {
    it('has the correct name', () => {
      expect(createRecipeTool.name).toBe('create_recipe');
    });

    it('has a description', () => {
      expect(createRecipeTool.description).toBeTruthy();
    });
  });

  describe('successful creation', () => {
    it('creates a recipe and returns success', async () => {
      const result = await createRecipeTool.handler(validArgs);

      expect(result.isError).toBeUndefined();
      const body = JSON.parse(result.content[0].text);
      expect(body.success).toBe(true);
      expect(body.message).toContain('created');
      expect(body.recipe.id).toBe('recipe123');
      expect(body.recipe.name).toBe('Chocolate Chip Cookies');
    });

    it('marks the recipe as viewed after creation', async () => {
      await createRecipeTool.handler(validArgs);

      expect(mockMarkRecipeAsViewed).toHaveBeenCalledWith('recipe123');
    });

    it('marks the recipe as viewed after createRecipe resolves', async () => {
      const callOrder: string[] = [];
      mockCreateRecipe.mockImplementation(async () => {
        callOrder.push('createRecipe');
        return createdRecipe;
      });
      mockMarkRecipeAsViewed.mockImplementation(async () => {
        callOrder.push('markRecipeAsViewed');
      });

      await createRecipeTool.handler(validArgs);

      expect(callOrder).toEqual(['createRecipe', 'markRecipeAsViewed']);
    });

    it('includes the browser URL in the response', async () => {
      const result = await createRecipeTool.handler(validArgs);

      const body = JSON.parse(result.content[0].text);
      expect(body.recipe.browserUrl).toContain('recipe123');
    });
  });
});
