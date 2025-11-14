# Recipe Scraper Testing Framework

This testing framework provides a generic, extensible way to test recipe scrapers without duplicating test code.

## Quick Start

1. **Create expected recipe data** using the helper functions:

```typescript
// my-scraper-test-data.ts
import { createExpectedRecipe, createIngredientGroup } from './test-utils';

export const myRecipeData = createExpectedRecipe({
  name: 'My Amazing Recipe',
  prepTime: '15 mins',
  cookTime: '30 mins', 
  totalTime: '45 mins',
  servings: '4',
  ingredients: [
    createIngredientGroup([
      '2 cups flour',
      '1 tsp salt'
    ], 'Dry ingredients'), // Optional group name
    createIngredientGroup([
      '1 cup milk',
      '2 eggs'
    ], 'Wet ingredients')
  ],
  directions: [
    'Mix dry ingredients.',
    'Add wet ingredients.',
    'Bake for 30 minutes.'
  ],
  previewUrl: {
    shouldBeDefined: true,
    shouldContain: ['example.com', '.jpg']
  }
});
```

2. **Create your test file**:

```typescript
// my-scraper.test.ts
import { runScraperTests, commonErrorCases } from './test-utils';
import { myScraperFunction } from '../my-scraper';
import { myRecipeData } from './my-scraper-test-data';

runScraperTests({
  scraperName: 'my-scraper', // Must match folder name in html/
  scraperFunction: myScraperFunction,
  testCases: [
    {
      name: 'My Test Recipe', 
      htmlFile: 'my-recipe.html', // In __tests__/html/my-scraper/
      expected: myRecipeData
    }
  ],
  errorCases: [
    commonErrorCases.missingName, // Reusable error tests
    {
      name: 'custom error test',
      html: '<div>bad html</div>',
      expectedError: /custom error/
    }
  ]
});
```

## Adding More Test Cases

To add new test cases for an existing scraper, just add them to the `testCases` array:

```typescript
runScraperTests({
  scraperName: 'allrecipes',
  scraperFunction: scrapeAllRecipes,
  testCases: [
    {
      name: 'Classic Dinner Rolls',
      htmlFile: 'classic-dinner-rolls.html',
      expected: dinnerRollsData
    },
    {
      name: 'Chocolate Cake', // New test case
      htmlFile: 'chocolate-cake.html',
      expected: chocolateCakeData
    }
  ]
});
```

## Features

### Automatic Test Generation
The framework automatically generates tests for:
- Recipe name extraction
- Time fields (prep, cook, total) - only if expected
- Servings - only if expected  
- Ingredient groups with proper validation
- Directions with exact matching
- Preview URLs with custom validation
- Complete recipe object structure

### Helper Functions

- `createExpectedRecipe()` - Creates expected data with sensible defaults
- `createIngredientGroup()` - Creates ingredient groups easily
- `commonErrorCases` - Reusable error test scenarios
- `loadTestHtml()` - Loads HTML test files (used internally)

### Flexible Validation

- **Optional fields**: Only tests fields that are provided in expected data
- **Custom preview URL validation**: Control whether it should exist and what it should contain
- **Grouped ingredients**: Supports named ingredient groups
- **Error testing**: Both common and custom error scenarios

## File Structure

```
lib/scrapers/__tests__/
├── test-utils.ts              # Core testing framework
├── allrecipes.test.ts         # Example scraper test
├── allrecipes-test-data.ts    # Example expected data
├── README.md                  # This documentation
└── html/                      # Test HTML files
    ├── allrecipes/
    │   └── classic-dinner-rolls.html
    ├── budget-bytes/
    │   └── recipe1.html
    └── [scraper-name]/
        └── [test-file].html
```

## Benefits

1. **Less boilerplate**: No more copy-pasting test functions
2. **Consistent testing**: All scrapers tested the same way  
3. **Easy to extend**: Adding new test cases is just data
4. **Maintainable**: Changes to test logic only needed in one place
5. **Type safety**: Full TypeScript support with proper types