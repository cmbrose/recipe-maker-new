#!/bin/bash
set -e

# MySQL Data Export Script
# Exports recipes and menus from MySQL database to JSON files
# Usage: ./scripts/export-mysql-data.sh [--output-dir <path>]

# Default values
OUTPUT_DIR="${EXPORT_OUTPUT_DIR:-./data-export}"
MYSQL_HOST="${MYSQL_HOST:-localhost}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_DATABASE="${MYSQL_DATABASE:-recipe_maker_production}"
MYSQL_USER="${MYSQL_USER}"
MYSQL_PASSWORD="${MYSQL_PASSWORD}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --host)
      MYSQL_HOST="$2"
      shift 2
      ;;
    --port)
      MYSQL_PORT="$2"
      shift 2
      ;;
    --database)
      MYSQL_DATABASE="$2"
      shift 2
      ;;
    --user)
      MYSQL_USER="$2"
      shift 2
      ;;
    --password)
      MYSQL_PASSWORD="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --output-dir <path>    Output directory for exported data (default: ./data-export)"
      echo "  --host <hostname>      MySQL host (default: localhost)"
      echo "  --port <port>          MySQL port (default: 3306)"
      echo "  --database <name>      MySQL database name (default: recipe_maker_production)"
      echo "  --user <username>      MySQL username (required)"
      echo "  --password <password>  MySQL password (required)"
      echo "  --help                 Show this help message"
      echo ""
      echo "Environment variables:"
      echo "  EXPORT_OUTPUT_DIR      Alternative to --output-dir"
      echo "  MYSQL_HOST             Alternative to --host"
      echo "  MYSQL_PORT             Alternative to --port"
      echo "  MYSQL_DATABASE         Alternative to --database"
      echo "  MYSQL_USER             Alternative to --user"
      echo "  MYSQL_PASSWORD         Alternative to --password"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}=== MySQL Data Export Script ===${NC}"
echo "Host: $MYSQL_HOST:$MYSQL_PORT"
echo "Database: $MYSQL_DATABASE"
echo "Output Directory: $OUTPUT_DIR"
echo ""

# Check if mysql client is installed
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}Error: mysql client is not installed${NC}"
    echo "Install with: apt-get install mysql-client (Ubuntu/Debian)"
    echo "           or: brew install mysql-client (macOS)"
    exit 1
fi

# Check credentials
if [ -z "$MYSQL_USER" ]; then
    echo -e "${RED}Error: MySQL username not provided${NC}"
    echo "Use --user <username> or set MYSQL_USER environment variable"
    exit 1
fi

if [ -z "$MYSQL_PASSWORD" ]; then
    echo -e "${RED}Error: MySQL password not provided${NC}"
    echo "Use --password <password> or set MYSQL_PASSWORD environment variable"
    exit 1
fi

# Test MySQL connection
echo -e "${YELLOW}Testing MySQL connection...${NC}"
if ! mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SELECT 1" &> /dev/null; then
    echo -e "${RED}Failed to connect to MySQL database${NC}"
    echo "Please check your credentials and connection settings"
    exit 1
fi
echo -e "${GREEN}✓ MySQL connection successful${NC}"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Export recipes
echo -e "${YELLOW}Exporting recipes...${NC}"
mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" \
    --batch --silent --raw \
    -e "SELECT 
            id,
            name,
            prep_time as prepTime,
            cook_time as cookTime,
            total_time as totalTime,
            servings,
            ingredients,
            directions,
            preview_url as previewUrl,
            source,
            source_kind as sourceKind,
            tags,
            notes,
            last_viewed as lastViewed,
            created_at as createdAt,
            updated_at as updatedAt
        FROM recipes
        ORDER BY id" \
    | awk '
        BEGIN { 
            FS="\t"
            print "["
            first=1
        }
        NR > 1 {
            if (first == 0) print ","
            first = 0
            printf "  {\n"
            printf "    \"id\": %s,\n", $1
            printf "    \"name\": \"%s\",\n", gensub(/"/, "\\\"", "g", $2)
            printf "    \"prepTime\": %s,\n", ($3 == "NULL" ? "null" : $3)
            printf "    \"cookTime\": %s,\n", ($4 == "NULL" ? "null" : $4)
            printf "    \"totalTime\": %s,\n", ($5 == "NULL" ? "null" : $5)
            printf "    \"servings\": %s,\n", ($6 == "NULL" ? "null" : $6)
            printf "    \"ingredients\": %s,\n", ($7 == "NULL" ? "null" : $7)
            printf "    \"directions\": %s,\n", ($8 == "NULL" ? "null" : $8)
            printf "    \"previewUrl\": %s,\n", ($9 == "NULL" ? "null" : "\"" $9 "\"")
            printf "    \"source\": %s,\n", ($10 == "NULL" ? "null" : "\"" $10 "\"")
            printf "    \"sourceKind\": \"%s\",\n", $11
            printf "    \"tags\": %s,\n", ($12 == "NULL" ? "[]" : $12)
            printf "    \"notes\": %s,\n", ($13 == "NULL" ? "[]" : $13)
            printf "    \"lastViewed\": %s,\n", ($14 == "NULL" ? "null" : "\"" $14 "\"")
            printf "    \"createdAt\": \"%s\",\n", $15
            printf "    \"updatedAt\": \"%s\"\n", $16
            printf "  }"
        }
        END { print "\n]" }
    ' > "$OUTPUT_DIR/recipes.json"

RECIPE_COUNT=$(mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" \
    --batch --silent -e "SELECT COUNT(*) FROM recipes")

echo -e "${GREEN}✓ Exported $RECIPE_COUNT recipes to $OUTPUT_DIR/recipes.json${NC}"
echo ""

# Export menus
echo -e "${YELLOW}Exporting menus...${NC}"
mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" \
    --batch --silent --raw \
    -e "SELECT 
            id,
            name,
            recipes as recipeIds,
            created_at as createdAt,
            updated_at as updatedAt
        FROM menus
        ORDER BY id" \
    | awk '
        BEGIN { 
            FS="\t"
            print "["
            first=1
        }
        NR > 1 {
            if (first == 0) print ","
            first = 0
            printf "  {\n"
            printf "    \"id\": %s,\n", $1
            printf "    \"name\": \"%s\",\n", gensub(/"/, "\\\"", "g", $2)
            printf "    \"recipeIds\": %s,\n", ($3 == "NULL" ? "[]" : $3)
            printf "    \"createdAt\": \"%s\",\n", $4
            printf "    \"updatedAt\": \"%s\"\n", $5
            printf "  }"
        }
        END { print "\n]" }
    ' > "$OUTPUT_DIR/menus.json"

MENU_COUNT=$(mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" \
    --batch --silent -e "SELECT COUNT(*) FROM menus")

echo -e "${GREEN}✓ Exported $MENU_COUNT menus to $OUTPUT_DIR/menus.json${NC}"
echo ""

# Create metadata file
echo -e "${YELLOW}Creating metadata file...${NC}"
cat > "$OUTPUT_DIR/metadata.json" << EOF
{
  "exportDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "sourceDatabase": "$MYSQL_DATABASE",
  "sourceHost": "$MYSQL_HOST:$MYSQL_PORT",
  "recipeCount": $RECIPE_COUNT,
  "menuCount": $MENU_COUNT,
  "version": "1.0"
}
EOF
echo -e "${GREEN}✓ Metadata saved to $OUTPUT_DIR/metadata.json${NC}"
echo ""

# Validate JSON files
echo -e "${YELLOW}Validating exported JSON...${NC}"
if command -v jq &> /dev/null; then
    if jq empty "$OUTPUT_DIR/recipes.json" 2>/dev/null; then
        echo -e "${GREEN}✓ recipes.json is valid JSON${NC}"
    else
        echo -e "${RED}✗ recipes.json has invalid JSON${NC}"
    fi
    
    if jq empty "$OUTPUT_DIR/menus.json" 2>/dev/null; then
        echo -e "${GREEN}✓ menus.json is valid JSON${NC}"
    else
        echo -e "${RED}✗ menus.json has invalid JSON${NC}"
    fi
else
    echo -e "${YELLOW}⚠ jq not installed, skipping JSON validation${NC}"
    echo "Install with: apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
fi
echo ""

# Display summary
echo -e "${GREEN}=== Export Complete ===${NC}"
echo ""
echo "Export Summary:"
echo "  Recipes: $RECIPE_COUNT"
echo "  Menus: $MENU_COUNT"
echo "  Output Directory: $OUTPUT_DIR"
echo ""
echo "Exported Files:"
echo "  - $OUTPUT_DIR/recipes.json"
echo "  - $OUTPUT_DIR/menus.json"
echo "  - $OUTPUT_DIR/metadata.json"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review the exported data:"
echo "   ${BLUE}cat $OUTPUT_DIR/metadata.json${NC}"
echo "   ${BLUE}jq '.[0]' $OUTPUT_DIR/recipes.json${NC}  # View first recipe"
echo ""
echo "2. Import to Cosmos DB:"
echo "   ${BLUE}./scripts/import-cosmos-data.sh --input-dir $OUTPUT_DIR${NC}"
echo ""
echo -e "${GREEN}Export completed successfully!${NC}"
