// Seed script for development data
// Note: This script works with standalone MongoDB (no replica set required)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Check if recipes already exist
  const existingRecipes = await prisma.recipe.count();
  if (existingRecipes > 0) {
    console.log('⚠️  Database already has recipes, skipping seed.');
    console.log('   To reseed, delete all recipes first.');
    return;
  }

  // Create sample recipes (without using transactions)
  console.log('Creating sample recipes...');

  const pancakes = await prisma.recipe.create({
    data: {
      name: 'Fluffy Pancakes',
      prepTime: 10,
      cookTime: 15,
      totalTime: 25,
      servings: 4,
      ingredients: [
        {
          name: 'Dry Ingredients',
          items: [
            '2 cups all-purpose flour',
            '2 tablespoons sugar',
            '2 teaspoons baking powder',
            '1 teaspoon salt',
          ],
        },
        {
          name: 'Wet Ingredients',
          items: [
            '2 cups milk',
            '2 large eggs',
            '4 tablespoons melted butter',
            '1 teaspoon vanilla extract',
          ],
        },
      ],
      directions: [
        { step: 1, text: 'Mix all dry ingredients in a large bowl.' },
        { step: 2, text: 'In another bowl, whisk together milk, eggs, melted butter, and vanilla.' },
        { step: 3, text: 'Pour wet ingredients into dry ingredients and mix until just combined (lumps are okay).' },
        { step: 4, text: 'Heat a griddle or pan over medium heat and lightly grease.' },
        { step: 5, text: 'Pour 1/4 cup batter for each pancake and cook until bubbles form on top.' },
        { step: 6, text: 'Flip and cook until golden brown on both sides.' },
      ],
      previewUrl: '',
      sourceKind: 'manual',
      tags: ['breakfast', 'easy', 'quick'],
      notes: ['Great with maple syrup and fresh berries!'],
    },
  });

  const pasta = await prisma.recipe.create({
    data: {
      name: 'Simple Pasta Aglio e Olio',
      prepTime: 5,
      cookTime: 15,
      totalTime: 20,
      servings: 2,
      ingredients: [
        {
          items: [
            '8 oz spaghetti',
            '6 cloves garlic, thinly sliced',
            '1/2 cup olive oil',
            '1/2 teaspoon red pepper flakes',
            '1/4 cup fresh parsley, chopped',
            'Salt and pepper to taste',
            'Parmesan cheese for serving',
          ],
        },
      ],
      directions: [
        { step: 1, text: 'Cook spaghetti according to package directions. Reserve 1 cup pasta water.' },
        { step: 2, text: 'While pasta cooks, heat olive oil in a large pan over medium heat.' },
        { step: 3, text: 'Add sliced garlic and red pepper flakes. Cook until garlic is golden (about 2 minutes).' },
        { step: 4, text: 'Add drained pasta to the pan with garlic oil.' },
        { step: 5, text: 'Toss pasta with the oil, adding reserved pasta water if needed for consistency.' },
        { step: 6, text: 'Add parsley, salt, and pepper. Toss again and serve with Parmesan.' },
      ],
      previewUrl: '',
      sourceKind: 'manual',
      tags: ['dinner', 'italian', 'quick', 'vegetarian'],
      notes: ['Don\'t brown the garlic or it will taste bitter!'],
    },
  });

  const chickenSoup = await prisma.recipe.create({
    data: {
      name: 'Classic Chicken Soup',
      prepTime: 15,
      cookTime: 45,
      totalTime: 60,
      servings: 6,
      ingredients: [
        {
          items: [
            '2 lbs chicken pieces (bone-in)',
            '8 cups chicken broth',
            '3 carrots, sliced',
            '3 celery stalks, sliced',
            '1 onion, diced',
            '3 cloves garlic, minced',
            '2 bay leaves',
            '1 cup egg noodles',
            '2 tablespoons fresh parsley',
            'Salt and pepper to taste',
          ],
        },
      ],
      directions: [
        { step: 1, text: 'In a large pot, add chicken, broth, carrots, celery, onion, garlic, and bay leaves.' },
        { step: 2, text: 'Bring to a boil, then reduce heat and simmer for 30 minutes.' },
        { step: 3, text: 'Remove chicken pieces and shred the meat, discarding bones and skin.' },
        { step: 4, text: 'Return shredded chicken to the pot.' },
        { step: 5, text: 'Add egg noodles and cook for 8-10 minutes until tender.' },
        { step: 6, text: 'Remove bay leaves, add parsley, and season with salt and pepper.' },
      ],
      previewUrl: '',
      sourceKind: 'manual',
      tags: ['soup', 'comfort-food', 'dinner'],
      notes: ['Perfect for cold days or when feeling under the weather.', 'Can freeze for up to 3 months.'],
    },
  });

  console.log('✅ Created 3 sample recipes');

  // Create sample menus
  console.log('Creating sample menus...');

  const weeknightDinners = await prisma.menu.create({
    data: {
      name: 'Quick Weeknight Dinners',
      recipeIds: [pasta.id],
    },
  });

  const comfortFood = await prisma.menu.create({
    data: {
      name: 'Comfort Food Favorites',
      recipeIds: [pancakes.id, chickenSoup.id],
    },
  });

  console.log('✅ Created 2 sample menus');
  console.log('\n🎉 Seeding complete!');
  console.log('\nYou can now:');
  console.log('  - Run `pnpm db:studio` to view the data');
  console.log('  - Run `pnpm dev` to start the dev server');
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding failed:', e.message);
    console.error('\nCommon issues:');
    console.error('  - MongoDB not running: Run `docker start mongodb`');
    console.error('  - Wrong connection string: Check your .env file');
    console.error('  - Replica set required: Use Azure Cosmos DB or configure MongoDB replica set');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
