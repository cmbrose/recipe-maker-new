#!/bin/bash
set -e

# Cosmos DB Data Import Script
# Imports recipes and menus from JSON files into Cosmos DB via Prisma
# Usage: ./scripts/import-cosmos-data.sh [--input-dir <path>]

# Default values
INPUT_DIR="${IMPORT_INPUT_DIR:-./data-export}"
PRISMA_DIR="${PRISMA_DIR:-./}"
DRY_RUN="${DRY_RUN:-false}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --input-dir)
      INPUT_DIR="$2"
      shift 2
      ;;
    --prisma-dir)
      PRISMA_DIR="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --input-dir <path>     Input directory with exported data (default: ./data-export)"
      echo "  --prisma-dir <path>    Directory containing Prisma schema (default: .)"
      echo "  --dry-run              Validate data without importing"
      echo "  --help                 Show this help message"
      echo ""
      echo "Environment variables:"
      echo "  IMPORT_INPUT_DIR       Alternative to --input-dir"
      echo "  PRISMA_DIR             Alternative to --prisma-dir"
      echo "  DRY_RUN                Set to 'true' for dry run"
      echo "  COSMOS_DB_CONNECTION_STRING  Required for import"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}=== Cosmos DB Data Import Script ===${NC}"
echo "Input Directory: $INPUT_DIR"
echo "Prisma Directory: $PRISMA_DIR"
echo "Dry Run: $DRY_RUN"
echo ""

# Check if input files exist
if [ ! -f "$INPUT_DIR/recipes.json" ]; then
    echo -e "${RED}Error: recipes.json not found in $INPUT_DIR${NC}"
    echo "Run export-mysql-data.sh first to generate the data"
    exit 1
fi

if [ ! -f "$INPUT_DIR/menus.json" ]; then
    echo -e "${RED}Error: menus.json not found in $INPUT_DIR${NC}"
    echo "Run export-mysql-data.sh first to generate the data"
    exit 1
fi

if [ ! -f "$INPUT_DIR/metadata.json" ]; then
    echo -e "${YELLOW}Warning: metadata.json not found, continuing without it${NC}"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

# Check if jq is installed for JSON processing
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed${NC}"
    echo "Install with: apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
    exit 1
fi

# Validate JSON files
echo -e "${YELLOW}Validating input files...${NC}"
if ! jq empty "$INPUT_DIR/recipes.json" 2>/dev/null; then
    echo -e "${RED}Error: recipes.json is not valid JSON${NC}"
    exit 1
fi
echo -e "${GREEN}✓ recipes.json is valid${NC}"

if ! jq empty "$INPUT_DIR/menus.json" 2>/dev/null; then
    echo -e "${RED}Error: menus.json is not valid JSON${NC}"
    exit 1
fi
echo -e "${GREEN}✓ menus.json is valid${NC}"

RECIPE_COUNT=$(jq '. | length' "$INPUT_DIR/recipes.json")
MENU_COUNT=$(jq '. | length' "$INPUT_DIR/menus.json")
echo -e "${BLUE}Found $RECIPE_COUNT recipes and $MENU_COUNT menus to import${NC}"
echo ""

if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}Dry run mode - no data will be imported${NC}"
    echo ""
    echo "Sample Recipe:"
    jq '.[0] | {id, name, tags, sourceKind}' "$INPUT_DIR/recipes.json"
    echo ""
    echo "Sample Menu:"
    jq '.[0] | {id, name, recipeIds}' "$INPUT_DIR/menus.json"
    echo ""
    echo -e "${GREEN}Validation complete. Run without --dry-run to import.${NC}"
    exit 0
fi

# Check Cosmos DB connection
if [ -z "$COSMOS_DB_CONNECTION_STRING" ]; then
    echo -e "${RED}Error: COSMOS_DB_CONNECTION_STRING not set${NC}"
    echo "Set it in your .env file or as an environment variable"
    exit 1
fi

# Check if Prisma directory exists
if [ ! -d "$PRISMA_DIR" ]; then
    echo -e "${RED}Error: Prisma directory not found: $PRISMA_DIR${NC}"
    exit 1
fi

# Create import script
echo -e "${YELLOW}Creating Node.js import script...${NC}"
IMPORT_SCRIPT="$INPUT_DIR/import-to-cosmos.mjs"

cat > "$IMPORT_SCRIPT" << 'EOF'
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';

const prisma = new PrismaClient();

async function main() {
  const inputDir = process.argv[2] || './data-export';
  
  console.log('Loading data files...');
  const recipes = JSON.parse(await readFile(`${inputDir}/recipes.json`, 'utf-8'));
  const menus = JSON.parse(await readFile(`${inputDir}/menus.json`, 'utf-8'));
  
  console.log(`Loaded ${recipes.length} recipes and ${menus.length} menus`);
  console.log('');
  
  // Import recipes
  console.log('Importing recipes...');
  let recipeImported = 0;
  let recipeErrors = 0;
  
  for (const recipe of recipes) {
    try {
      // Transform data to match Prisma schema
      const recipeData = {
        name: recipe.name,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        totalTime: recipe.totalTime,
        servings: recipe.servings,
        ingredients: recipe.ingredients || [],
        directions: recipe.directions || [],
        previewUrl: recipe.previewUrl,
        source: recipe.source,
        sourceKind: recipe.sourceKind || 'manual',
        tags: recipe.tags || [],
        notes: recipe.notes || [],
        lastViewed: recipe.lastViewed ? new Date(recipe.lastViewed) : null,
        createdAt: new Date(recipe.createdAt),
        updatedAt: new Date(recipe.updatedAt),
      };
      
      await prisma.recipe.create({
        data: recipeData
      });
      
      recipeImported++;
      if (recipeImported % 10 === 0) {
        console.log(`  Imported ${recipeImported}/${recipes.length} recipes...`);
      }
    } catch (error) {
      console.error(`  ✗ Error importing recipe "${recipe.name}":`, error.message);
      recipeErrors++;
    }
  }
  
  console.log(`✓ Imported ${recipeImported} recipes (${recipeErrors} errors)`);
  console.log('');
  
  // Build recipe ID mapping (old MySQL ID -> new Cosmos ID)
  console.log('Building recipe ID mapping...');
  const allRecipes = await prisma.recipe.findMany({
    select: { id: true, name: true, createdAt: true }
  });
  
  // Map by name and createdAt for matching
  const recipeIdMap = new Map();
  for (const oldRecipe of recipes) {
    const match = allRecipes.find(r => 
      r.name === oldRecipe.name && 
      new Date(r.createdAt).getTime() === new Date(oldRecipe.createdAt).getTime()
    );
    if (match) {
      recipeIdMap.set(String(oldRecipe.id), match.id);
    }
  }
  console.log(`✓ Mapped ${recipeIdMap.size} recipe IDs`);
  console.log('');
  
  // Import menus
  console.log('Importing menus...');
  let menuImported = 0;
  let menuErrors = 0;
  
  for (const menu of menus) {
    try {
      // Transform recipe IDs from MySQL to Cosmos
      const oldRecipeIds = menu.recipeIds || [];
      const newRecipeIds = oldRecipeIds
        .map(id => recipeIdMap.get(String(id)))
        .filter(id => id !== undefined);
      
      if (oldRecipeIds.length > 0 && newRecipeIds.length !== oldRecipeIds.length) {
        console.warn(`  ⚠ Menu "${menu.name}" has ${oldRecipeIds.length - newRecipeIds.length} unmapped recipe IDs`);
      }
      
      const menuData = {
        name: menu.name,
        recipeIds: newRecipeIds,
        createdAt: new Date(menu.createdAt),
        updatedAt: new Date(menu.updatedAt),
      };
      
      await prisma.menu.create({
        data: menuData
      });
      
      menuImported++;
    } catch (error) {
      console.error(`  ✗ Error importing menu "${menu.name}":`, error.message);
      menuErrors++;
    }
  }
  
  console.log(`✓ Imported ${menuImported} menus (${menuErrors} errors)`);
  console.log('');
  
  // Summary
  console.log('=== Import Summary ===');
  console.log(`Recipes: ${recipeImported}/${recipes.length} imported (${recipeErrors} errors)`);
  console.log(`Menus: ${menuImported}/${menus.length} imported (${menuErrors} errors)`);
  
  if (recipeErrors > 0 || menuErrors > 0) {
    console.log('');
    console.log('⚠ Some records failed to import. Check the errors above.');
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('');
    console.log('✓ Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error during import:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

echo -e "${GREEN}✓ Import script created${NC}"
echo ""

# Run the import
echo -e "${YELLOW}Starting import to Cosmos DB...${NC}"
echo ""

cd "$PRISMA_DIR"
node "$IMPORT_SCRIPT" "$INPUT_DIR"
IMPORT_EXIT_CODE=$?

cd - > /dev/null

if [ $IMPORT_EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=== Import Complete ===${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Verify the data in Cosmos DB:"
    echo "   ${BLUE}cd $PRISMA_DIR && pnpm db:studio${NC}"
    echo ""
    echo "2. Test the application with the imported data:"
    echo "   ${BLUE}cd $PRISMA_DIR && pnpm dev${NC}"
    echo ""
    echo "3. If everything looks good, you can decommission the MySQL database"
    echo ""
    echo -e "${GREEN}Import completed successfully!${NC}"
else
    echo ""
    echo -e "${RED}Import failed with errors. Please check the output above.${NC}"
    exit 1
fi
