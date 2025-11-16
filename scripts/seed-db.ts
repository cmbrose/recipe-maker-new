#!/usr/bin/env -S npx tsx

/**
 * Database seeding script
 * Adds sample recipes to the database for development and testing
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file BEFORE importing mongo
config({ path: resolve(__dirname, '../.env') });

// Now we can import modules that depend on env vars
import type { Recipe } from '../types/recipe';

const sampleRecipes: Omit<Recipe, 'id'>[] = [
  {
    name: 'Classic Chocolate Chip Cookies',
    prepTime: '15 mins',
    cookTime: '12 mins',
    totalTime: '27 mins',
    servings: '24 cookies',
    ingredients: [
      {
        ingredients: [
          '2 ¼ cups all-purpose flour',
          '1 teaspoon baking soda',
          '1 teaspoon salt',
          '1 cup (2 sticks) butter, softened',
          '¾ cup granulated sugar',
          '¾ cup packed brown sugar',
          '2 large eggs',
          '2 teaspoons vanilla extract',
          '2 cups chocolate chips',
        ],
      },
    ],
    directions: [
      'Preheat oven to 375°F.',
      'Combine flour, baking soda and salt in small bowl.',
      'Beat butter, granulated sugar, brown sugar and vanilla extract in large mixer bowl until creamy. Add eggs, one at a time, beating well after each addition.',
      'Gradually beat in flour mixture. Stir in chocolate chips.',
      'Drop by rounded tablespoon onto ungreased baking sheets.',
      'Bake for 9 to 11 minutes or until golden brown. Cool on baking sheets for 2 minutes; remove to wire racks to cool completely.',
    ],
    previewUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800',
    source: undefined,
    sourceKind: 'manual',
    tags: ['dessert', 'cookies', 'chocolate', 'baking'],
    notes: ['These freeze well for up to 3 months'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Simple Tomato Basil Pasta',
    prepTime: '10 mins',
    cookTime: '15 mins',
    totalTime: '25 mins',
    servings: '4',
    ingredients: [
      {
        ingredients: [
          '1 pound pasta (spaghetti or penne)',
          '2 tablespoons olive oil',
          '4 cloves garlic, minced',
          '1 can (28 oz) crushed tomatoes',
          '1 teaspoon salt',
          '½ teaspoon black pepper',
          '1 teaspoon dried oregano',
          '¼ cup fresh basil, chopped',
          'Parmesan cheese for serving',
        ],
      },
    ],
    directions: [
      'Cook pasta according to package directions. Reserve 1 cup pasta water before draining.',
      'Heat olive oil in a large skillet over medium heat. Add garlic and cook for 1 minute until fragrant.',
      'Add crushed tomatoes, salt, pepper, and oregano. Simmer for 10 minutes.',
      'Add cooked pasta to the sauce and toss to combine. Add reserved pasta water as needed to achieve desired consistency.',
      'Remove from heat and stir in fresh basil.',
      'Serve topped with Parmesan cheese.',
    ],
    previewUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
    source: undefined,
    sourceKind: 'manual',
    tags: ['pasta', 'italian', 'vegetarian', 'quick', 'dinner'],
    notes: ['Can add red pepper flakes for heat', 'Use San Marzano tomatoes for best flavor'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Overnight Oats',
    prepTime: '5 mins',
    cookTime: '0 mins',
    totalTime: '8 hrs 5 mins',
    servings: '1',
    ingredients: [
      {
        ingredients: [
          '½ cup rolled oats',
          '½ cup milk (dairy or non-dairy)',
          '¼ cup Greek yogurt',
          '1 tablespoon chia seeds',
          '1 tablespoon honey or maple syrup',
          '½ teaspoon vanilla extract',
          'Pinch of salt',
        ],
      },
      {
        name: 'Toppings',
        ingredients: [
          'Fresh berries',
          'Sliced banana',
          'Nuts or granola',
          'Nut butter',
        ],
      },
    ],
    directions: [
      'In a jar or container, combine oats, milk, yogurt, chia seeds, honey, vanilla, and salt.',
      'Stir well to combine.',
      'Cover and refrigerate overnight (or at least 4 hours).',
      'In the morning, stir and add your favorite toppings.',
      'Enjoy cold or heat in microwave for 1-2 minutes if desired.',
    ],
    previewUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800',
    source: undefined,
    sourceKind: 'manual',
    tags: ['breakfast', 'healthy', 'meal-prep', 'vegetarian', 'no-cook'],
    notes: ['Prepare multiple jars for the week', 'Lasts 3-4 days in the fridge'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Crispy Chicken Tacos',
    prepTime: '15 mins',
    cookTime: '20 mins',
    totalTime: '35 mins',
    servings: '4',
    ingredients: [
      {
        name: 'For the chicken',
        ingredients: [
          '1 pound chicken breast, diced',
          '2 tablespoons olive oil',
          '1 teaspoon chili powder',
          '1 teaspoon cumin',
          '1 teaspoon paprika',
          '½ teaspoon garlic powder',
          '½ teaspoon salt',
          '¼ teaspoon black pepper',
        ],
      },
      {
        name: 'For serving',
        ingredients: [
          '8 taco shells or tortillas',
          '1 cup shredded lettuce',
          '1 cup diced tomatoes',
          '1 cup shredded cheese',
          '½ cup sour cream',
          '½ cup salsa',
          'Fresh cilantro',
          'Lime wedges',
        ],
      },
    ],
    directions: [
      'In a bowl, toss chicken with olive oil and all spices until evenly coated.',
      'Heat a large skillet over medium-high heat. Add chicken and cook for 8-10 minutes, stirring occasionally, until golden brown and cooked through.',
      'Warm taco shells according to package directions.',
      'Fill each taco shell with seasoned chicken.',
      'Top with lettuce, tomatoes, cheese, sour cream, salsa, and cilantro.',
      'Serve with lime wedges on the side.',
    ],
    previewUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    source: undefined,
    sourceKind: 'manual',
    tags: ['mexican', 'chicken', 'tacos', 'dinner', 'quick'],
    notes: ['Can substitute chicken with ground beef or black beans'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Blueberry Banana Smoothie',
    prepTime: '5 mins',
    cookTime: '0 mins',
    totalTime: '5 mins',
    servings: '2',
    ingredients: [
      {
        ingredients: [
          '2 ripe bananas, frozen',
          '1 cup blueberries (fresh or frozen)',
          '1 cup Greek yogurt',
          '1 cup milk (dairy or non-dairy)',
          '1 tablespoon honey',
          '½ teaspoon vanilla extract',
          '1 cup ice cubes (if using fresh fruit)',
        ],
      },
    ],
    directions: [
      'Add all ingredients to a blender.',
      'Blend on high speed until smooth and creamy, about 1-2 minutes.',
      'Taste and adjust sweetness if needed.',
      'Pour into glasses and serve immediately.',
    ],
    previewUrl: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800',
    source: undefined,
    sourceKind: 'manual',
    tags: ['smoothie', 'breakfast', 'healthy', 'quick', 'vegetarian', 'no-cook'],
    notes: ['Add protein powder for extra protein', 'Can add spinach without changing taste'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Import getDb after env is loaded
    const { getDb } = await import('../lib/db/mongo.js');
    const db = await getDb();
    const recipesCollection = db.collection('Recipe');

    // Clear existing recipes (optional - comment out to keep existing data)
    console.log('Clearing existing recipes...');
    await recipesCollection.deleteMany({});
    console.log('✓ Existing recipes cleared\n');

    // Insert sample recipes
    console.log('Inserting sample recipes...');
    const result = await recipesCollection.insertMany(sampleRecipes);
    
    console.log(`✓ Successfully inserted ${result.insertedCount} recipes:\n`);
    
    for (const recipe of sampleRecipes) {
      console.log(`  • ${recipe.name}`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seed();
