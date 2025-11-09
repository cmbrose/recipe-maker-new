#!/usr/bin/env ts-node

/**
 * MySQL Data Export Script (TypeScript)
 * Exports recipes and menus from MySQL database to JSON files using Prisma
 * Usage: ts-node scripts/export-mysql-data.ts [--output-dir <path>]
 */

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
  outputDir: string;
}

function parseArgs(): ExportOptions {
  const args = process.argv.slice(2);
  let outputDir = process.env.EXPORT_OUTPUT_DIR || './data-export';

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--output-dir':
        outputDir = args[++i];
        break;
      case '--help':
        console.log('Usage: ts-node scripts/export-mysql-data.ts [OPTIONS]');
        console.log('');
        console.log('Options:');
        console.log('  --output-dir <path>    Output directory for exported data (default: ./data-export)');
        console.log('  --help                 Show this help message');
        console.log('');
        console.log('Environment variables:');
        console.log('  EXPORT_OUTPUT_DIR      Alternative to --output-dir');
        console.log('  DATABASE_URL           MySQL connection string (required)');
        process.exit(0);
      default:
        log(`Unknown option: ${args[i]}`, 'red');
        console.log('Use --help for usage information');
        process.exit(1);
    }
  }

  return { outputDir };
}

async function main() {
  log('=== MySQL Data Export Script ===', 'green');
  console.log('');

  const options = parseArgs();
  console.log(`Output Directory: ${options.outputDir}`);
  console.log('');

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    log('Error: DATABASE_URL environment variable not set', 'red');
    console.log('Please set DATABASE_URL to your MySQL connection string');
    console.log('Example: export DATABASE_URL="mysql://user:pass@host:3306/database"');
    process.exit(1);
  }

  // Generate Prisma Client for MySQL
  log('Generating Prisma Client for MySQL...', 'yellow');
  try {
    await execAsync('npx prisma generate --schema=prisma/schema.mysql.prisma', {
      cwd: path.join(__dirname, '..'),
    });
    log('✓ Prisma Client generated', 'green');
  } catch (error) {
    log('Error generating Prisma Client:', 'red');
    console.error(error);
    process.exit(1);
  }
  console.log('');

  // Import the generated Prisma Client dynamically
  log('Connecting to MySQL database...', 'yellow');
  const { PrismaClient } = await import('../node_modules/.prisma/client-mysql/index.js');
  
  // Add SSL parameters to accept self-signed certificates
  let dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.includes('sslaccept')) {
    const separator = dbUrl.includes('?') ? '&' : '?';
    dbUrl = `${dbUrl}${separator}sslaccept=strict`;
  }
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  try {
    // Test connection
    await prisma.$connect();
    log('✓ MySQL connection successful', 'green');
    console.log('');

    // Create output directory
    await fs.mkdir(options.outputDir, { recursive: true });

    // Export recipes
    log('Exporting recipes...', 'yellow');
    const recipes = await prisma.recipe.findMany({
      orderBy: { id: 'asc' },
    });

    // Clean up any null JSON fields to empty arrays
    const cleanedRecipes = recipes.map((recipe: any) => ({
      ...recipe,
      ingredients: recipe.ingredients || [],
      directions: recipe.directions || [],
      tags: recipe.tags || [],
      notes: recipe.notes || [],
    }));

    const recipesFile = path.join(options.outputDir, 'recipes.json');
    await fs.writeFile(recipesFile, JSON.stringify(cleanedRecipes, null, 2), 'utf-8');
    log(`✓ Exported ${recipes.length} recipes to ${recipesFile}`, 'green');
    console.log('');

    // Export menus
    log('Exporting menus...', 'yellow');
    const menus = await prisma.menu.findMany({
      orderBy: { id: 'asc' },
    });

    // Clean up any null JSON fields to empty arrays
    const cleanedMenus = menus.map((menu: any) => ({
      ...menu,
      recipes: menu.recipes || [],
    }));

    const menusFile = path.join(options.outputDir, 'menus.json');
    await fs.writeFile(menusFile, JSON.stringify(cleanedMenus, null, 2), 'utf-8');
    log(`✓ Exported ${menus.length} menus to ${menusFile}`, 'green');
    console.log('');

    // Create metadata file
    log('Creating metadata file...', 'yellow');
    const metadata = {
      exportDate: new Date().toISOString(),
      sourceDatabase: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'unknown',
      recipeCount: recipes.length,
      menuCount: menus.length,
      version: '1.0',
    };

    const metadataFile = path.join(options.outputDir, 'metadata.json');
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2), 'utf-8');
    log(`✓ Metadata saved to ${metadataFile}`, 'green');
    console.log('');

    // Display summary
    log('=== Export Complete ===', 'green');
    console.log('');
    console.log('Export Summary:');
    console.log(`  Recipes: ${recipes.length}`);
    console.log(`  Menus: ${menus.length}`);
    console.log(`  Output Directory: ${options.outputDir}`);
    console.log('');
    console.log('Exported Files:');
    console.log(`  - ${recipesFile}`);
    console.log(`  - ${menusFile}`);
    console.log(`  - ${metadataFile}`);
    console.log('');
    log('Next Steps:', 'yellow');
    console.log('1. Review the exported data:');
    console.log(`   ${colors.blue}cat ${metadataFile}${colors.nc}`);
    console.log(`   ${colors.blue}jq '.[0]' ${recipesFile}${colors.nc}  # View first recipe`);
    console.log('');
    console.log('2. Import to Cosmos DB:');
    console.log(`   ${colors.blue}./scripts/import-cosmos-data.sh --input-dir ${options.outputDir}${colors.nc}`);
    console.log('');
    log('Export completed successfully!', 'green');

  } catch (error) {
    log('Error during export:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
