#!/usr/bin/env -S npx tsx

/**
 * MySQL Data Export Script (TypeScript)
 * Exports recipes and menus from MySQL database to JSON files using Prisma
 * Usage: ./scripts/fix-data-export.ts [--directory <path>]
 */

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

// Color codes for output
const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  nc: '\x1b[0m', // No Color
};

function log(message: string, color: keyof typeof colors = 'nc') {
  console.log(`${colors[color]}${message}${colors.nc}`);
}

interface ExportOptions {
  directory: string;
}

function parseArgs(): ExportOptions {
  const args = process.argv.slice(2);
  let directory = process.env.EXPORT_OUTPUT_DIR || './data-export';

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--directory':
        directory = args[++i];
        break;
      case '--help':
        console.log('Usage: ts-node scripts/export-mysql-data.ts [OPTIONS]');
        console.log('');
        console.log('Options:');
        console.log('  --directory <path>     Output directory for exported data (default: ./data-export)');
        console.log('  --help                 Show this help message');
        console.log('');
        console.log('Environment variables:');
        console.log('  EXPORT_OUTPUT_DIR      Alternative to --directory');
        process.exit(0);
      default:
        log(`Unknown option: ${args[i]}`, 'red');
        console.log('Use --help for usage information');
        process.exit(1);
    }
  }

  return { directory };
}

async function main() {
  log('=== MySQL Data Export Script ===', 'green');
  console.log('');

  const options = parseArgs();
  console.log(`Output Directory: ${options.directory}`);
  console.log('');

  try {
    const recipesFile = path.join(options.directory, 'recipes.json');
    const recipesJson = await fs.readFile(recipesFile, 'utf-8');
    const recipes = JSON.parse(recipesJson);

    const cleanedRecipes = [];
    for (const recipe of recipes) {
      console.log('Processing recipe ID:', recipe.id);
      cleanedRecipes.push({
        ...recipe,
        id: String(recipe.id),
        tags: Array.isArray(recipe.tags) ? recipe.tags : fixSqlArray(recipe.tags),
        notes: Array.isArray(recipe.notes) ? recipe.notes : fixSqlArray(recipe.notes),
        directions: Array.isArray(recipe.directions) ? recipe.directions : JSON.parse(recipe.directions),
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : JSON.parse(recipe.ingredients),
      });
    }

    await fs.writeFile(recipesFile.replace('.json', '.fixed.json'), JSON.stringify(cleanedRecipes, null, 2), 'utf-8');
    log(`✓ Exported ${recipes.length} recipes to ${recipesFile}`, 'green');

    const menusFile = path.join(options.directory, 'menus.json');
    const menusJson = await fs.readFile(menusFile, 'utf-8');
    const menus = JSON.parse(menusJson);

    const cleanedMenus = menus.map((menu: any) => ({
        ...menu,
        // Fix: Ensure recipes is an array
        recipes: Array.isArray(menu.recipeIds) ? menu.recipeIds : fixSqlArray(menu.recipeIds),
    }));

    await fs.writeFile(menusFile.replace('.json', '.fixed.json'), JSON.stringify(cleanedMenus, null, 2), 'utf-8');
    log(`✓ Exported ${menus.length} menus to ${menusFile}`, 'green');

    console.log('');

  } catch (error) {
    log('Error during export:', 'red');
    console.error(error);
    process.exit(1);
  }
}

function fixSqlArray(str: string): string[] {
    // "---\n- GrandmaBrose\n- bars\n" to ["GrandmaBrose", "bars"]
    return str
      ?.split('\n')
      .filter(line => line.startsWith('- '))
      .map(line => line.slice(2).trim()) ?? [];
}

main();
