/**
 * Tests for the update_recipe MCP tool
 */

import { updateRecipeTool } from '../tools/update-recipe';
import type { Recipe } from '@/types/recipe';

// Mock the recipe service
jest.mock('@/lib/services/recipe-service', () => ({
  getRecipe: jest.fn(),
  updateRecipe: jest.fn(),
}));

import { getRecipe, updateRecipe } from '@/lib/services/recipe-service';

const mockGetRecipe = getRecipe as jest.MockedFunction<typeof getRecipe>;
const mockUpdateRecipe = updateRecipe as jest.MockedFunction<typeof updateRecipe>;

const existingRecipe: Recipe = {
  id: 'recipe123',
  name: 'Test Recipe',
  prepTime: '10 mins',
  cookTime: '20 mins',
  totalTime: '30 mins',
  servings: '4 servings',
  ingredients: [
    { name: 'Main', ingredients: ['1 cup flour', '2 eggs'] },
    { name: 'Sauce', ingredients: ['1 tbsp butter'] },
  ],
  directions: ['Mix flour and eggs', 'Add butter', 'Bake 20 mins'],
  previewUrl: undefined,
  source: undefined,
  sourceKind: 'manual',
  tags: ['dinner', 'quick'],
  notes: ['Great with pasta'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetRecipe.mockResolvedValue(existingRecipe);
  mockUpdateRecipe.mockImplementation(async (input) => ({
    ...existingRecipe,
    ...input,
    updatedAt: new Date('2024-01-03'),
  }));
});

describe('update_recipe tool', () => {
  describe('tool metadata', () => {
    it('has the correct name', () => {
      expect(updateRecipeTool.name).toBe('update_recipe');
    });

    it('has a description', () => {
      expect(updateRecipeTool.description).toBeTruthy();
    });
  });

  describe('not found', () => {
    it('returns an error when the recipe does not exist', async () => {
      mockGetRecipe.mockResolvedValue(null);

      const result = await updateRecipeTool.handler({ id: 'nonexistent' });

      expect(result.isError).toBe(true);
      const body = JSON.parse(result.content[0].text);
      expect(body.error).toContain('not found');
      expect(mockUpdateRecipe).not.toHaveBeenCalled();
    });
  });

  describe('scalar field updates', () => {
    it('updates only the provided scalar fields', async () => {
      await updateRecipeTool.handler({ id: 'recipe123', name: 'New Name', servings: '6 servings' });

      const callArg = mockUpdateRecipe.mock.calls[0][0];
      expect(callArg.name).toBe('New Name');
      expect(callArg.servings).toBe('6 servings');
      // Unchanged scalar fields should not be in the update
      expect(callArg.prepTime).toBeUndefined();
    });

    it('returns success with recipe info on update', async () => {
      const result = await updateRecipeTool.handler({ id: 'recipe123', name: 'New Name' });

      expect(result.isError).toBeUndefined();
      const body = JSON.parse(result.content[0].text);
      expect(body.success).toBe(true);
      expect(body.message).toContain('updated');
    });
  });

  describe('array field - full replacement', () => {
    it('replaces directions when a full array is provided', async () => {
      const newDirections = ['Step one', 'Step two'];
      await updateRecipeTool.handler({ id: 'recipe123', directions: newDirections });

      const callArg = mockUpdateRecipe.mock.calls[0][0];
      expect(callArg.directions).toEqual(newDirections);
    });

    it('replaces tags when a full array is provided', async () => {
      const newTags = ['lunch', 'healthy'];
      await updateRecipeTool.handler({ id: 'recipe123', tags: newTags });

      const callArg = mockUpdateRecipe.mock.calls[0][0];
      expect(callArg.tags).toEqual(newTags);
    });

    it('replaces ingredients when a full array is provided', async () => {
      const newIngredients = [{ name: 'Base', ingredients: ['salt', 'pepper'] }];
      await updateRecipeTool.handler({ id: 'recipe123', ingredients: newIngredients });

      const callArg = mockUpdateRecipe.mock.calls[0][0];
      expect(callArg.ingredients).toEqual(newIngredients);
    });

    it('replaces notes when a full array is provided', async () => {
      const newNotes = ['Serve warm'];
      await updateRecipeTool.handler({ id: 'recipe123', notes: newNotes });

      const callArg = mockUpdateRecipe.mock.calls[0][0];
      expect(callArg.notes).toEqual(newNotes);
    });
  });

  describe('array field - individual item updates', () => {
    it('updates individual directions by index', async () => {
      await updateRecipeTool.handler({
        id: 'recipe123',
        directionUpdates: [{ index: 1, value: 'Updated step 2' }],
      });

      const callArg = mockUpdateRecipe.mock.calls[0][0];
      expect(callArg.directions).toEqual([
        'Mix flour and eggs',
        'Updated step 2',
        'Bake 20 mins',
      ]);
    });

    it('updates individual tags by index', async () => {
      await updateRecipeTool.handler({
        id: 'recipe123',
        tagUpdates: [{ index: 0, value: 'lunch' }],
      });

      const callArg = mockUpdateRecipe.mock.calls[0][0];
      expect(callArg.tags).toEqual(['lunch', 'quick']);
    });

    it('updates individual notes by index', async () => {
      await updateRecipeTool.handler({
        id: 'recipe123',
        noteUpdates: [{ index: 0, value: 'Updated note' }],
      });

      const callArg = mockUpdateRecipe.mock.calls[0][0];
      expect(callArg.notes).toEqual(['Updated note']);
    });

    it('updates individual ingredient groups by index', async () => {
      const newGroup = { name: 'New Group', ingredients: ['1 tsp salt'] };
      await updateRecipeTool.handler({
        id: 'recipe123',
        ingredientUpdates: [{ index: 0, value: newGroup }],
      });

      const callArg = mockUpdateRecipe.mock.calls[0][0];
      expect(callArg.ingredients[0]).toEqual(newGroup);
      expect(callArg.ingredients[1]).toEqual(existingRecipe.ingredients[1]);
    });

    it('applies multiple individual updates', async () => {
      await updateRecipeTool.handler({
        id: 'recipe123',
        directionUpdates: [
          { index: 0, value: 'New step 1' },
          { index: 2, value: 'New step 3' },
        ],
      });

      const callArg = mockUpdateRecipe.mock.calls[0][0];
      expect(callArg.directions).toEqual(['New step 1', 'Add butter', 'New step 3']);
    });
  });

  describe('array field - full replacement then individual update', () => {
    it('applies full replacement first, then individual updates on top', async () => {
      await updateRecipeTool.handler({
        id: 'recipe123',
        directions: ['A', 'B', 'C'],
        directionUpdates: [{ index: 1, value: 'X' }],
      });

      const callArg = mockUpdateRecipe.mock.calls[0][0];
      expect(callArg.directions).toEqual(['A', 'X', 'C']);
    });
  });

  describe('array field - no changes preserves existing', () => {
    it('preserves existing array values when no array args are provided', async () => {
      await updateRecipeTool.handler({ id: 'recipe123', name: 'Only name changed' });

      const callArg = mockUpdateRecipe.mock.calls[0][0];
      expect(callArg.directions).toEqual(existingRecipe.directions);
      expect(callArg.tags).toEqual(existingRecipe.tags);
      expect(callArg.notes).toEqual(existingRecipe.notes);
      expect(callArg.ingredients).toEqual(existingRecipe.ingredients);
    });
  });

  describe('out of bounds index', () => {
    it('returns an error for an out-of-bounds direction update index', async () => {
      const result = await updateRecipeTool.handler({
        id: 'recipe123',
        directionUpdates: [{ index: 99, value: 'oops' }],
      });

      expect(result.isError).toBe(true);
      const body = JSON.parse(result.content[0].text);
      expect(body.error).toContain('out of bounds');
    });
  });
});
