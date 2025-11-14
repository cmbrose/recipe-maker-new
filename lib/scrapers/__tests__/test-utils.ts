import { readFileSync } from 'fs';
import { join } from 'path';
import type { RecipeScraperResult } from '@/types/scraper';
import type { IngredientGroup } from '@/types/recipe';

/**
 * Expected recipe data for test cases
 */
export interface ExpectedRecipeData {
    name: string;
    prepTime?: string;
    cookTime?: string;
    totalTime?: string;
    servings?: string;
    ingredients: Array<{
        name?: string;
        ingredients: string[];
    }>;
    directions: string[];
    previewUrl?: {
        shouldBeDefined: boolean;
        shouldContain?: string[];
    };
}

/**
 * Test configuration for a scraper
 */
export interface ScraperTestConfig {
    scraperName: string;
    scraperFunction: (html: string) => Promise<RecipeScraperResult>;
    testCases: Array<{
        name: string;
        htmlFile: string; // Path relative to test/html/[scraperName]/
        expected: ExpectedRecipeData;
    }>;
    errorCases?: Array<{
        name: string;
        html: string;
        expectedError: string | RegExp;
    }>;
}

/**
 * Helper to create ingredient groups more easily
 */
export function createIngredientGroup(ingredients: string[], name?: string): IngredientGroup {
    return { name, ingredients };
}

/**
 * Helper to create expected recipe data with sensible defaults
 */
export function createExpectedRecipe(data: {
    name: string;
    ingredients: IngredientGroup[];
    directions: string[];
    prepTime?: string;
    cookTime?: string;
    totalTime?: string;
    servings?: string;
    previewUrl?: {
        shouldBeDefined?: boolean;
        shouldContain?: string[];
    };
}): ExpectedRecipeData {
    return {
        name: data.name,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        totalTime: data.totalTime,
        servings: data.servings,
        ingredients: data.ingredients.map(group => ({
            name: group.name,
            ingredients: group.ingredients
        })),
        directions: data.directions,
        previewUrl: data.previewUrl ? {
            shouldBeDefined: data.previewUrl.shouldBeDefined ?? true,
            shouldContain: data.previewUrl.shouldContain
        } : undefined
    };
}

/**
 * Common error test cases that can be reused across scrapers
 */
export const commonErrorCases = {
    missingName: {
        name: 'should throw error for missing name',
        html: '<html><body><div>No recipe here</div></body></html>',
        expectedError: /name not found/i
    },
    emptyHtml: {
        name: 'should throw error for empty HTML',
        html: '',
        expectedError: /name not found/i
    },
    malformedHtml: {
        name: 'should throw error for malformed HTML',
        html: '<html><head><title>Not a recipe</title></head></html>',
        expectedError: /name not found/i
    }
};

/**
 * Load HTML test file for a scraper
 */
export function loadTestHtml(scraperName: string, filename: string): string {
    const htmlPath = join(__dirname, `html/${scraperName}/${filename}`);
    return readFileSync(htmlPath, 'utf-8');
}

/**
 * Generic test runner for recipe scrapers
 */
export function runScraperTests(config: ScraperTestConfig): void {
    describe(`${config.scraperName} Scraper`, () => {
        config.testCases.forEach(testCase => {
            describe(testCase.name, () => {
                let html: string;
                let result: RecipeScraperResult;

                beforeAll(async () => {
                    html = loadTestHtml(config.scraperName, testCase.htmlFile);
                    result = await config.scraperFunction(html);
                });

                it('should scrape the recipe name correctly', () => {
                    expect(result.name).toBe(testCase.expected.name);
                });

                if (testCase.expected.prepTime) {
                    it('should scrape prep time correctly', () => {
                        expect(result.prepTime).toBe(testCase.expected.prepTime);
                    });
                }

                if (testCase.expected.cookTime) {
                    it('should scrape cook time correctly', () => {
                        expect(result.cookTime).toBe(testCase.expected.cookTime);
                    });
                }

                if (testCase.expected.totalTime) {
                    it('should scrape total time correctly', () => {
                        expect(result.totalTime).toBe(testCase.expected.totalTime);
                    });
                }

                if (testCase.expected.servings) {
                    it('should scrape servings correctly', () => {
                        expect(result.servings).toBe(testCase.expected.servings);
                    });
                }

                it('should scrape ingredients correctly', () => {
                    expect(result.ingredients).toHaveLength(testCase.expected.ingredients.length);

                    testCase.expected.ingredients.forEach((expectedGroup, groupIndex) => {
                        const actualGroup = result.ingredients[groupIndex];

                        if (expectedGroup.name) {
                            expect(actualGroup.name).toBe(expectedGroup.name);
                        }

                        expect(actualGroup.ingredients).toHaveLength(expectedGroup.ingredients.length);

                        expectedGroup.ingredients.forEach((expectedIngredient, ingredientIndex) => {
                            expect(actualGroup.ingredients[ingredientIndex]).toBe(expectedIngredient);
                        });
                    });
                });

                it('should scrape directions correctly', () => {
                    expect(result.directions).toHaveLength(testCase.expected.directions.length);

                    testCase.expected.directions.forEach((expectedDirection, index) => {
                        expect(result.directions[index]).toBe(expectedDirection);
                    });
                });

                if (testCase.expected.previewUrl) {
                    it('should scrape preview image URL correctly', () => {
                        if (testCase.expected.previewUrl?.shouldBeDefined) {
                            expect(result.previewUrl).toBeDefined();

                            if (testCase.expected.previewUrl.shouldContain) {
                                testCase.expected.previewUrl.shouldContain.forEach(fragment => {
                                    expect(result.previewUrl).toContain(fragment);
                                });
                            }
                        } else {
                            expect(result.previewUrl).toBeUndefined();
                        }
                    });
                }

                it('should return a complete recipe object', () => {
                    expect(result).toMatchObject({
                        name: expect.any(String),
                        ingredients: expect.arrayContaining([
                            expect.objectContaining({
                                ingredients: expect.any(Array),
                            }),
                        ]),
                        directions: expect.any(Array),
                    });

                    // Check optional fields if they're expected
                    if (testCase.expected.prepTime) {
                        expect(result.prepTime).toEqual(expect.any(String));
                    }
                    if (testCase.expected.cookTime) {
                        expect(result.cookTime).toEqual(expect.any(String));
                    }
                    if (testCase.expected.totalTime) {
                        expect(result.totalTime).toEqual(expect.any(String));
                    }
                    if (testCase.expected.servings) {
                        expect(result.servings).toEqual(expect.any(String));
                    }
                    if (testCase.expected.previewUrl?.shouldBeDefined) {
                        expect(result.previewUrl).toEqual(expect.any(String));
                    }
                });
            });
        });

        // Run error test cases if provided
        if (config.errorCases && config.errorCases.length > 0) {
            describe('Error Cases', () => {
                config.errorCases!.forEach(errorCase => {
                    it(errorCase.name, async () => {
                        await expect(config.scraperFunction(errorCase.html)).rejects.toThrow(errorCase.expectedError);
                    });
                });
            });
        }
    });
}