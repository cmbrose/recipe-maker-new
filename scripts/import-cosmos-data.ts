#!/usr/bin/env -S npx tsx

/**
 * Cosmos DB Import Script (TypeScript)
 * Imports recipes and menus from JSON files to Cosmos DB (MongoDB API)
 * Usage: ./scripts/import-cosmos-data.ts [--data-dir <path>] [--dry-run]
 */

import { promises as fs } from 'fs';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';

// Color codes for output
const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  cyan: '\x1b[0;36m',
  nc: '\x1b[0m', // No Color
};

function log(message: string, color: keyof typeof colors = 'nc') {
  console.log(`${colors[color]}${message}${colors.nc}`);
}

interface ImportOptions {
  dataDir: string;
  dryRun: boolean;
  batchSize: number;
}

interface Recipe {
  id: number;
  name: string;
  prepTime?: string | null;
  cookTime?: string | null;
  totalTime?: string | null;
  servings?: string | null;
  ingredients: string | any[];
  directions: string | string[];
  previewUrl?: string | null;
  source?: string | null;
  sourceKind?: string | null;
  tags: string | string[];
  notes: string | string[];
  lastViewed?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface Menu {
  id: number;
  name: string;
  recipes?: string | string[];
  recipeIds?: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  let dataDir = process.env.DATA_DIR || './data-export';
  let dryRun = false;
  let batchSize = 10;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--data-dir':
      case '--directory':
        dataDir = args[++i];
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--batch-size':
        batchSize = parseInt(args[++i], 10);
        break;
      case '--help':
        console.log('Usage: ./scripts/import-cosmos-data.ts [OPTIONS]');
        console.log('');
        console.log('Options:');
        console.log('  --data-dir <path>      Data directory with JSON files (default: ./data-export)');
        console.log('  --dry-run              Validate data without importing');
        console.log('  --batch-size <n>       Progress display interval (default: 10)');
        console.log('  --help                 Show this help message');
        console.log('');
        console.log('Environment variables:');
        console.log('  COSMOS_DB_CONNECTION_STRING  MongoDB connection string (required)');
        console.log('  DATA_DIR                     Alternative to --data-dir');
        process.exit(0);
      default:
        log(`Unknown option: ${args[i]}`, 'red');
        console.log('Use --help for usage information');
        process.exit(1);
    }
  }

  return { dataDir, dryRun, batchSize };
}

// Parse YAML-like arrays from MySQL export format
function parseYamlArray(str: string): string[] {
  if (!str || typeof str !== 'string') return [];
  
  // Handle format: "---\n- item1\n- item2\n"
  return str
    .split('\n')
    .filter(line => line.trim().startsWith('- '))
    .map(line => line.replace(/^-\s*/, '').trim())
    .filter(item => item.length > 0);
}

// Transform recipe for Cosmos DB
function transformRecipe(recipe: Recipe): any {
  // Parse JSON strings if needed
  const ingredients = typeof recipe.ingredients === 'string' 
    ? JSON.parse(recipe.ingredients)
    : recipe.ingredients;
  
  const directions = typeof recipe.directions === 'string'
    ? JSON.parse(recipe.directions)
    : recipe.directions;
  
  // Handle tags (might be YAML array or already parsed)
  const tags = typeof recipe.tags === 'string'
    ? parseYamlArray(recipe.tags)
    : Array.isArray(recipe.tags) ? recipe.tags : [];
  
  // Handle notes (might be YAML array or already parsed)
  const notes = typeof recipe.notes === 'string'
    ? parseYamlArray(recipe.notes)
    : Array.isArray(recipe.notes) ? recipe.notes : [];

  return {
    _id: new ObjectId(), // Generate a new MongoDB ObjectId
    legacyId: recipe.id, // Keep the original integer ID for reference/migration
    name: recipe.name,
    prepTime: recipe.prepTime || null,
    cookTime: recipe.cookTime || null,
    totalTime: recipe.totalTime || null,
    servings: recipe.servings || null,
    ingredients,
    directions,
    previewUrl: recipe.previewUrl || null,
    source: recipe.source || null,
    sourceKind: recipe.sourceKind || null,
    tags,
    notes,
    lastViewed: recipe.lastViewed ? new Date(recipe.lastViewed) : null,
    createdAt: recipe.createdAt ? new Date(recipe.createdAt) : new Date(),
    updatedAt: recipe.updatedAt ? new Date(recipe.updatedAt) : new Date(),
  };
}

// Transform menu for Cosmos DB
function transformMenu(menu: Menu, recipeIdMap: Map<number, ObjectId>): any {
  // Handle recipe IDs (might be YAML array or already parsed)
  let legacyRecipeIds: string[] = [];
  
  if (menu.recipeIds && Array.isArray(menu.recipeIds)) {
    legacyRecipeIds = menu.recipeIds;
  } else if (menu.recipes) {
    if (typeof menu.recipes === 'string') {
      legacyRecipeIds = parseYamlArray(menu.recipes);
    } else if (Array.isArray(menu.recipes)) {
      legacyRecipeIds = menu.recipes;
    }
  }

  // Convert legacy recipe IDs to new ObjectIds
  const recipeIds = legacyRecipeIds
    .map(id => recipeIdMap.get(parseInt(id)))
    .filter((id): id is ObjectId => id !== undefined)
    .map(id => id.toString());

  return {
    _id: new ObjectId(), // Generate a new MongoDB ObjectId
    legacyId: menu.id, // Keep the original integer ID for reference
    name: menu.name,
    recipeIds,
    createdAt: menu.createdAt ? new Date(menu.createdAt) : new Date(),
    updatedAt: menu.updatedAt ? new Date(menu.updatedAt) : new Date(),
  };
}

async function main() {
  log('\n=== Cosmos DB Import Script ===', 'green');
  console.log('');

  const options = parseArgs();
  
  log(`Data Directory: ${options.dataDir}`, 'cyan');
  if (options.dryRun) {
    log('DRY RUN MODE - No data will be imported', 'yellow');
  }
  console.log('');

  // Check for connection string
  const connectionString = process.env.COSMOS_DB_CONNECTION_STRING;
  if (!connectionString) {
    log('Error: COSMOS_DB_CONNECTION_STRING environment variable not set', 'red');
    log('Please set it in your .env file or environment', 'yellow');
    process.exit(1);
  }

  // Read recipes
  const recipesFile = path.join(options.dataDir, 'recipes.json');
  try {
    await fs.access(recipesFile);
  } catch {
    log(`Error: Recipes file not found: ${recipesFile}`, 'red');
    process.exit(1);
  }

  log(`Reading recipes from ${recipesFile}...`, 'cyan');
  const recipesJson = JSON.parse(await fs.readFile(recipesFile, 'utf-8')) as Recipe[];
  log(`Found ${recipesJson.length} recipes`, 'green');

  // Read menus
  const menusFile = path.join(options.dataDir, 'menus.json');
  try {
    await fs.access(menusFile);
  } catch {
    log(`Error: Menus file not found: ${menusFile}`, 'red');
    process.exit(1);
  }

  log(`Reading menus from ${menusFile}...`, 'cyan');
  const menusJson = JSON.parse(await fs.readFile(menusFile, 'utf-8')) as Menu[];
  log(`Found ${menusJson.length} menus`, 'green');
  console.log('');

  // Transform data
  log('Transforming recipe data...', 'cyan');
  const recipes = recipesJson.map(transformRecipe);

  // Build a map of legacy recipe IDs to new ObjectIds
  const recipeIdMap = new Map<number, ObjectId>();
  recipes.forEach((recipe, index) => {
    recipeIdMap.set(recipesJson[index].id, recipe._id);
  });

  log('Transforming menu data...', 'cyan');
  const menus = menusJson.map(menu => transformMenu(menu, recipeIdMap));
  console.log('');

  if (options.dryRun) {
    log('=== DRY RUN COMPLETE ===', 'yellow');
    log('Data validation successful!', 'green');
    log('Ready to import:', 'cyan');
    log(`  - ${recipes.length} recipes`, 'cyan');
    log(`  - ${menus.length} menus`, 'cyan');
    log('\nRun without --dry-run to perform actual import', 'yellow');
    return;
  }

  // Connect to MongoDB
  log('Connecting to Cosmos DB...', 'cyan');
  const client = new MongoClient(connectionString);
  
  try {
    await client.connect();
    log('Connected successfully!', 'green');
    console.log('');

    const db = client.db();
    const recipesCollection = db.collection('Recipe');
    const menusCollection = db.collection('Menu');

    // Import recipes
    log('=== Importing Recipes ===', 'green');
    let recipeCount = 0;
    let recipeErrors = 0;

    for (const recipe of recipes) {
      try {
        await recipesCollection.insertOne(recipe);
        recipeCount++;

        if (recipeCount % options.batchSize === 0) {
          log(`Imported ${recipeCount} / ${recipes.length} recipes...`, 'cyan');
        }
      } catch (error) {
        recipeErrors++;
        log(`Failed to import recipe ${recipe.legacyId}: ${error}`, 'yellow');
      }
    }

    log(`✓ Imported ${recipeCount} recipes`, 'green');
    if (recipeErrors > 0) {
      log(`${recipeErrors} recipes failed to import`, 'yellow');
    }
    console.log('');

    // Import menus
    log('=== Importing Menus ===', 'green');
    let menuCount = 0;
    let menuErrors = 0;

    for (const menu of menus) {
      try {
        await menusCollection.insertOne(menu);
        menuCount++;

        if (menuCount % options.batchSize === 0) {
          log(`Imported ${menuCount} / ${menus.length} menus...`, 'cyan');
        }
      } catch (error) {
        menuErrors++;
        log(`Failed to import menu ${menu.legacyId}: ${error}`, 'yellow');
      }
    }

    log(`✓ Imported ${menuCount} menus`, 'green');
    if (menuErrors > 0) {
      log(`${menuErrors} menus failed to import`, 'yellow');
    }
    console.log('');

    // Summary
    log('=== Import Complete ===', 'green');
    log('Successfully imported:', 'cyan');
    log(`  - ${recipeCount} / ${recipes.length} recipes`, 'cyan');
    log(`  - ${menuCount} / ${menus.length} menus`, 'cyan');

    if (recipeErrors > 0 || menuErrors > 0) {
      console.log('');
      log('Errors:', 'yellow');
      log(`  - ${recipeErrors} recipe failures`, 'yellow');
      log(`  - ${menuErrors} menu failures`, 'yellow');
      process.exit(1);
    }

    console.log('');
    log('✓ All data imported successfully!', 'green');

  } catch (error) {
    log('Error during import:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
    log('Connection closed', 'cyan');
  }
}

main();
