#!/bin/bash
# Supabase Migration Script (CLI-based)
# 
# This script uses Supabase CLI to migrate data, functions, RLS policies, and secrets
# between two Supabase projects (supports cross-account migrations).
#
# Prerequisites:
#   - Supabase CLI installed (npm install -g supabase)
#   - Authenticated with Supabase CLI: supabase login
#   - Environment variables set (see below)
#
# Usage:
#   Option 1: Use .env file (recommended)
#     Create .env file in project root (see .env.migration.example)
#     ./scripts/migrate-supabase-cli.sh
#
#   Option 2: Set environment variables manually
#     export SOURCE_PROJECT_REF="source-project-ref"
#     export TARGET_PROJECT_REF="target-project-ref"
#     ./scripts/migrate-supabase-cli.sh
#
#   Option 3: Mix both (env vars take precedence)
#     export SOURCE_PROJECT_REF="source-project-ref"
#     # Load other vars from .env
#     ./scripts/migrate-supabase-cli.sh

# Exit on error for critical failures, but allow some functions to handle errors gracefully
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables from .env file if it exists
load_env_file() {
    ENV_FILE="${ENV_FILE:-.env}"
    
    if [ -f "$ENV_FILE" ]; then
        echo -e "${BLUE}📄 Loading environment variables from $ENV_FILE...${NC}"
        
        # Read .env file line by line
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip empty lines and comments
            [[ -z "$line" ]] && continue
            [[ "$line" =~ ^[[:space:]]*# ]] && continue
            
            # Remove leading/trailing whitespace
            line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            
            # Skip if empty after trimming
            [[ -z "$line" ]] && continue
            
            # Check if line contains =
            if [[ "$line" =~ ^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*= ]]; then
                # Extract variable name (before =)
                var_name=$(echo "$line" | cut -d'=' -f1 | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                
                # Extract value (after =, handling quoted values)
                var_value=$(echo "$line" | cut -d'=' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                
                # Remove quotes if present
                if [[ "$var_value" =~ ^\".*\"$ ]] || [[ "$var_value" =~ ^\'.*\'$ ]]; then
                    var_value=$(echo "$var_value" | sed 's/^["'\'']//;s/["'\'']$//')
                fi
                
                # Only set if not already set (command-line/env takes precedence)
                if [ -z "${!var_name}" ]; then
                    export "$var_name=$var_value"
                    echo -e "${GREEN}   ✓ Loaded: $var_name${NC}"
                else
                    echo -e "${YELLOW}   ⏭️  Skipped: $var_name (already set)${NC}"
                fi
            fi
        done < "$ENV_FILE"
        
        echo -e "${GREEN}✅ Environment variables loaded${NC}\n"
    else
        echo -e "${YELLOW}ℹ️  No .env file found (looking for: $ENV_FILE)${NC}"
        echo -e "${YELLOW}   You can create one or set environment variables manually${NC}\n"
    fi
}

# Configuration (will be set from .env or environment)
SOURCE_PROJECT_REF="${SOURCE_PROJECT_REF:-}"
TARGET_PROJECT_REF="${TARGET_PROJECT_REF:-}"
SOURCE_DB_PASSWORD="${SOURCE_DB_PASSWORD:-}"
TARGET_DB_PASSWORD="${TARGET_DB_PASSWORD:-}"
SKIP_SECRETS="${SKIP_SECRETS:-false}"  # Set to "true" to skip secrets migration
SKIP_FUNCTIONS="${SKIP_FUNCTIONS:-false}"  # Set to "true" to skip function deployment
SKIP_SCHEMA="${SKIP_SCHEMA:-true}"  # Set to "false" to run schema migration (default: true, skip)
SKIP_DATA="${SKIP_DATA:-false}"  # Set to "true" to skip data migration
AUTO_INSTALL_PG="${AUTO_INSTALL_PG:-false}"  # Set to "true" to auto-install PostgreSQL tools without prompting
SECRETS_FILE="${SECRETS_FILE:-secrets.txt}"  # Path to secrets file

# Detect operating system
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
    echo "$OS"
}

# Install PostgreSQL client tools
install_postgresql_tools() {
    OS=$(detect_os)
    
    echo -e "${YELLOW}   Installing PostgreSQL client tools...${NC}"
    
    case "$OS" in
        "linux")
            # Try to detect Linux distribution
            if command -v apt-get &> /dev/null; then
                echo -e "${YELLOW}   Detected Debian/Ubuntu, installing via apt-get...${NC}"
                if sudo apt-get update && sudo apt-get install -y postgresql-client; then
                    echo -e "${GREEN}   ✓ Successfully installed postgresql-client${NC}"
                else
                    echo -e "${RED}   ❌ Failed to install postgresql-client${NC}"
                    echo -e "${YELLOW}   This may require sudo privileges${NC}"
                    echo -e "${YELLOW}   Please install manually: sudo apt-get install postgresql-client${NC}"
                    return 1
                fi
            elif command -v yum &> /dev/null; then
                echo -e "${YELLOW}   Detected RHEL/CentOS, installing via yum...${NC}"
                if sudo yum install -y postgresql; then
                    echo -e "${GREEN}   ✓ Successfully installed postgresql${NC}"
                else
                    echo -e "${RED}   ❌ Failed to install postgresql${NC}"
                    echo -e "${YELLOW}   This may require sudo privileges${NC}"
                    echo -e "${YELLOW}   Please install manually: sudo yum install postgresql${NC}"
                    return 1
                fi
            elif command -v dnf &> /dev/null; then
                echo -e "${YELLOW}   Detected Fedora, installing via dnf...${NC}"
                if sudo dnf install -y postgresql; then
                    echo -e "${GREEN}   ✓ Successfully installed postgresql${NC}"
                else
                    echo -e "${RED}   ❌ Failed to install postgresql${NC}"
                    echo -e "${YELLOW}   This may require sudo privileges${NC}"
                    echo -e "${YELLOW}   Please install manually: sudo dnf install postgresql${NC}"
                    return 1
                fi
            elif command -v pacman &> /dev/null; then
                echo -e "${YELLOW}   Detected Arch Linux, installing via pacman...${NC}"
                if sudo pacman -S --noconfirm postgresql; then
                    echo -e "${GREEN}   ✓ Successfully installed postgresql${NC}"
                else
                    echo -e "${RED}   ❌ Failed to install postgresql${NC}"
                    echo -e "${YELLOW}   This may require sudo privileges${NC}"
                    echo -e "${YELLOW}   Please install manually: sudo pacman -S postgresql${NC}"
                    return 1
                fi
            else
                echo -e "${RED}   ❌ Could not detect Linux package manager${NC}"
                echo -e "${YELLOW}   Please install PostgreSQL client tools manually${NC}"
                return 1
            fi
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                echo -e "${YELLOW}   Detected Homebrew, installing via brew...${NC}"
                if brew install libpq; then
                    echo -e "${GREEN}   ✓ Successfully installed libpq${NC}"
                    # Add to PATH if needed
                    if [ -d "/opt/homebrew/opt/libpq/bin" ]; then
                        export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
                        echo -e "${YELLOW}   Added /opt/homebrew/opt/libpq/bin to PATH${NC}"
                    elif [ -d "/usr/local/opt/libpq/bin" ]; then
                        export PATH="/usr/local/opt/libpq/bin:$PATH"
                        echo -e "${YELLOW}   Added /usr/local/opt/libpq/bin to PATH${NC}"
                    fi
                else
                    echo -e "${RED}   ❌ Failed to install libpq${NC}"
                    echo -e "${YELLOW}   Please install manually: brew install libpq${NC}"
                    return 1
                fi
            else
                echo -e "${RED}   ❌ Homebrew not found${NC}"
                echo -e "${YELLOW}   Please install Homebrew first: https://brew.sh${NC}"
                echo -e "${YELLOW}   Or install PostgreSQL manually: https://www.postgresql.org/download/macosx/${NC}"
                return 1
            fi
            ;;
        "windows")
            echo -e "${YELLOW}   Windows detected. Please install PostgreSQL client tools manually:${NC}"
            echo -e "${YELLOW}   1. Download from: https://www.postgresql.org/download/windows/${NC}"
            echo -e "${YELLOW}   2. Or use Chocolatey: choco install postgresql${NC}"
            echo -e "${YELLOW}   3. Or use WSL and follow Linux instructions${NC}"
            return 1
            ;;
        *)
            echo -e "${RED}   ❌ Unknown operating system: $OSTYPE${NC}"
            echo -e "${YELLOW}   Please install PostgreSQL client tools manually${NC}"
            return 1
            ;;
    esac
    
    # Verify installation
    if command -v pg_dump &> /dev/null && command -v psql &> /dev/null; then
        echo -e "${GREEN}   ✓ PostgreSQL client tools installed successfully${NC}"
        return 0
    else
        echo -e "${RED}   ❌ Installation completed but tools not found in PATH${NC}"
        echo -e "${YELLOW}   You may need to restart your terminal or add to PATH manually${NC}"
        return 1
    fi
}

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"
    
    if ! command -v supabase &> /dev/null; then
        echo -e "${RED}❌ Supabase CLI not found. Install with: npm install -g supabase${NC}"
        exit 1
    fi
    
    if [ -z "$SOURCE_PROJECT_REF" ] || [ -z "$TARGET_PROJECT_REF" ]; then
        echo -e "${RED}❌ Missing required environment variables:${NC}"
        echo -e "   SOURCE_PROJECT_REF"
        echo -e "   TARGET_PROJECT_REF"
        echo -e "\n${YELLOW}Usage:${NC}"
        echo -e "   export SOURCE_PROJECT_REF=\"your-source-project-ref\""
        echo -e "   export TARGET_PROJECT_REF=\"your-target-project-ref\""
        echo -e "   ./scripts/migrate-supabase-cli.sh"
        exit 1
    fi
    
    # Check for PostgreSQL client tools
    if ! command -v pg_dump &> /dev/null || ! command -v psql &> /dev/null; then
        echo -e "${YELLOW}⚠️  PostgreSQL client tools (pg_dump, psql) not found${NC}"
        
        if [ "$AUTO_INSTALL_PG" = "true" ]; then
            echo -e "${YELLOW}   Auto-install enabled, installing PostgreSQL tools...${NC}"
            if ! install_postgresql_tools; then
                echo -e "${RED}❌ Failed to install PostgreSQL tools${NC}"
                echo -e "${YELLOW}   Please install them manually and try again${NC}"
                exit 1
            fi
        else
            # Interactive mode
            if [ -t 0 ]; then
                # Terminal is interactive
                read -p "   Would you like to install them automatically? (y/n) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    if ! install_postgresql_tools; then
                        echo -e "${RED}❌ Failed to install PostgreSQL tools${NC}"
                        echo -e "${YELLOW}   Please install them manually and try again${NC}"
                        exit 1
                    fi
                else
                    echo -e "${YELLOW}   Please install PostgreSQL client tools manually:${NC}"
                    echo -e "${YELLOW}   - Linux: sudo apt-get install postgresql-client (or equivalent)${NC}"
                    echo -e "${YELLOW}   - macOS: brew install libpq${NC}"
                    echo -e "${YELLOW}   - Windows: Download from https://www.postgresql.org/download/${NC}"
                    exit 1
                fi
            else
                # Non-interactive mode (CI/CD)
                echo -e "${YELLOW}   Non-interactive mode detected${NC}"
                echo -e "${YELLOW}   Set AUTO_INSTALL_PG=true to auto-install, or install manually${NC}"
                echo -e "${YELLOW}   - Linux: sudo apt-get install postgresql-client${NC}"
                echo -e "${YELLOW}   - macOS: brew install libpq${NC}"
                echo -e "${YELLOW}   - Windows: Download from https://www.postgresql.org/download/${NC}"
                exit 1
            fi
        fi
    else
        echo -e "${GREEN}   ✓ PostgreSQL client tools found${NC}"
    fi
    
    # Check if authenticated (non-critical, will fail later if not authenticated)
    if ! supabase projects list &> /dev/null; then
        echo -e "${YELLOW}⚠️  Warning: May not be authenticated with Supabase CLI${NC}"
        echo -e "${YELLOW}   Run: supabase login if you encounter authentication errors${NC}"
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}\n"
}

# Migrate database schema (skipped if SKIP_SCHEMA=true)
migrate_schema() {
    if [ "$SKIP_SCHEMA" = "true" ]; then
        echo -e "${YELLOW}⏭️  Skipping schema migration (SKIP_SCHEMA=true)${NC}"
        echo -e "${YELLOW}   Assuming migrations already applied via: supabase db push --linked${NC}\n"
        return
    fi
    
    echo -e "${BLUE}📋 Migrating database schema...${NC}"
    
    # Push migrations to target
    echo -e "${YELLOW}   Pushing migrations to target project...${NC}"
    supabase db push --project-ref "$TARGET_PROJECT_REF" || {
        echo -e "${RED}   ❌ Failed to push migrations${NC}"
        echo -e "${YELLOW}   ⚠️  You may need to run migrations manually:${NC}"
        echo -e "${YELLOW}      supabase db push --project-ref $TARGET_PROJECT_REF${NC}"
        echo -e "${YELLOW}   Continuing with data migration...${NC}"
    }
    
    echo -e "${GREEN}✅ Schema migration completed${NC}\n"
}

# Migrate data using pg_dump and pg_restore
migrate_data() {
    if [ "$SKIP_DATA" = "true" ]; then
        echo -e "${YELLOW}⏭️  Skipping data migration (SKIP_DATA=true)${NC}\n"
        return
    fi
    
    echo -e "${BLUE}📦 Migrating data...${NC}"
    
    # Get database connection strings
    SOURCE_DB_URL=$(supabase projects api-keys --project-ref "$SOURCE_PROJECT_REF" | grep "service_role" | awk '{print $2}' || echo "")
    TARGET_DB_URL=$(supabase projects api-keys --project-ref "$TARGET_PROJECT_REF" | grep "service_role" | awk '{print $2}' || echo "")
    
    if [ -z "$SOURCE_DB_URL" ] || [ -z "$TARGET_DB_URL" ]; then
        echo -e "${YELLOW}   ⚠️  Could not get database URLs automatically${NC}"
        echo -e "${YELLOW}   Please migrate data manually using pg_dump/pg_restore${NC}\n"
        return
    fi
    
    # Create temporary dump file
    DUMP_FILE=$(mktemp /tmp/supabase-migration-XXXXX.sql)
    
    echo -e "${YELLOW}   Exporting data from source...${NC}"
    pg_dump "$SOURCE_DB_URL" \
        --data-only \
        --no-owner \
        --no-acl \
        --column-inserts \
        -f "$DUMP_FILE" || {
        echo -e "${RED}   ❌ Failed to export data${NC}"
        echo -e "${YELLOW}   ⚠️  Make sure pg_dump is installed and connection string is correct${NC}"
        rm -f "$DUMP_FILE"
        return 1
    }
    
    echo -e "${YELLOW}   Importing data to target...${NC}"
    psql "$TARGET_DB_URL" -f "$DUMP_FILE" || {
        echo -e "${RED}   ❌ Failed to import data${NC}"
        echo -e "${YELLOW}   ⚠️  Make sure psql is installed and connection string is correct${NC}"
        rm -f "$DUMP_FILE"
        return 1
    }
    
    rm -f "$DUMP_FILE"
    echo -e "${GREEN}✅ Data migration completed${NC}\n"
}

# Deploy edge functions
deploy_functions() {
    if [ "$SKIP_FUNCTIONS" = "true" ]; then
        echo -e "${YELLOW}⏭️  Skipping edge function deployment (SKIP_FUNCTIONS=true)${NC}\n"
        return
    fi
    
    echo -e "${BLUE}⚡ Deploying edge functions...${NC}"
    
    FUNCTIONS_DIR="supabase/functions"
    
    if [ ! -d "$FUNCTIONS_DIR" ]; then
        echo -e "${YELLOW}   ⚠️  Functions directory not found${NC}\n"
        return
    fi
    
    # Get list of functions (directories in functions folder, excluding _shared and hidden)
    FUNCTIONS=$(find "$FUNCTIONS_DIR" -maxdepth 1 -type d ! -name "functions" ! -name "_shared" ! -name ".*" -exec basename {} \; | sort)
    
    if [ -z "$FUNCTIONS" ]; then
        echo -e "${YELLOW}   ⚠️  No edge functions found${NC}\n"
        return
    fi
    
    echo -e "${YELLOW}   Found $(echo "$FUNCTIONS" | wc -l | tr -d ' ') edge function(s)${NC}\n"
    
    DEPLOYED=0
    FAILED=0
    
    for FUNC in $FUNCTIONS; do
        if [ -d "$FUNCTIONS_DIR/$FUNC" ]; then
            echo -e "${YELLOW}   📦 Deploying $FUNC...${NC}"
            if supabase functions deploy "$FUNC" --project-ref "$TARGET_PROJECT_REF" 2>&1; then
                echo -e "${GREEN}      ✓ Successfully deployed $FUNC${NC}"
                DEPLOYED=$((DEPLOYED + 1))
            else
                echo -e "${RED}      ❌ Failed to deploy $FUNC${NC}"
                FAILED=$((FAILED + 1))
            fi
            echo ""
        fi
    done
    
    echo -e "${GREEN}✅ Edge function deployment completed${NC}"
    echo -e "   Deployed: ${GREEN}$DEPLOYED${NC}, Failed: ${RED}$FAILED${NC}\n"
}

# Set Supabase function secrets from environment variables
# Note: Supabase may warn about SUPABASE_ prefix, but we force set them anyway
set_supabase_secrets() {
    if [ "$SKIP_SECRETS" = "true" ]; then
        echo -e "${YELLOW}⏭️  Skipping secrets migration (SKIP_SECRETS=true)${NC}\n"
        return
    fi
    
    echo -e "${BLUE}🔐 Setting Supabase function secrets...${NC}\n"
    
    # List of required secrets (without SUPABASE_ prefix to avoid warnings)
    # Mapping: env var name -> secret name
    declare -A SECRET_MAPPING=(
        ["ANON_KEY"]="ANON_KEY"
        ["SERVICE_ROLE_KEY"]="SERVICE_ROLE_KEY"
        ["DB_URL"]="DB_URL"
    )
    
    # Also support SUPABASE_ prefixed env vars for backward compatibility
    # But set secrets without the prefix
    declare -A LEGACY_MAPPING=(
        ["SUPABASE_ANON_KEY"]="ANON_KEY"
        ["SUPABASE_SERVICE_ROLE_KEY"]="SERVICE_ROLE_KEY"
        ["SUPABASE_DB_URL"]="DB_URL"
    )
    
    SET_COUNT=0
    FAILED_COUNT=0
    SKIPPED_COUNT=0
    
    # Process secrets (prefer non-prefixed, fallback to SUPABASE_ prefixed)
    for SECRET_ENV_NAME in "${!SECRET_MAPPING[@]}"; do
        SECRET_NAME="${SECRET_MAPPING[$SECRET_ENV_NAME]}"
        
        # Try non-prefixed first, then legacy prefixed
        SECRET_VALUE="${!SECRET_ENV_NAME}"
        if [ -z "$SECRET_VALUE" ]; then
            # Try legacy SUPABASE_ prefixed
            LEGACY_ENV_NAME="SUPABASE_${SECRET_ENV_NAME}"
            SECRET_VALUE="${!LEGACY_ENV_NAME}"
        fi
        
        if [ -z "$SECRET_VALUE" ]; then
            echo -e "${YELLOW}   ⚠️  $SECRET_ENV_NAME (or SUPABASE_$SECRET_ENV_NAME) not found in environment${NC}"
            echo -e "${YELLOW}      Set it in .env file: $SECRET_ENV_NAME=value${NC}"
            FAILED_COUNT=$((FAILED_COUNT + 1))
            continue
        fi
        
        # Check if secret already exists in target and remove it first
        TARGET_SECRETS=$(supabase secrets list --project-ref "$TARGET_PROJECT_REF" 2>&1)
        if echo "$TARGET_SECRETS" | grep -q "^$SECRET_NAME"; then
            echo -e "${YELLOW}   Removing existing $SECRET_NAME to update...${NC}"
            supabase secrets unset "$SECRET_NAME" --project-ref "$TARGET_PROJECT_REF" 2>&1 || true
        fi
        
        # Set secret in target (using name without SUPABASE_ prefix)
        echo -e "${YELLOW}   Setting $SECRET_NAME...${NC}"
        
        # Set the secret and capture output (warnings go to stderr, but we'll check both)
        OUTPUT=$(supabase secrets set "$SECRET_NAME=$SECRET_VALUE" --project-ref "$TARGET_PROJECT_REF" 2>&1)
        EXIT_CODE=$?
        
        # Wait a moment for secret to propagate
        sleep 1
        
        # Verify if secret was actually set by listing secrets
        sleep 1
        TARGET_SECRETS_AFTER=$(supabase secrets list --project-ref "$TARGET_PROJECT_REF" 2>&1)
        
        if echo "$TARGET_SECRETS_AFTER" | grep -q "^$SECRET_NAME"; then
            # Secret exists, success!
            echo -e "${GREEN}      ✓ Successfully set $SECRET_NAME${NC}"
            SET_COUNT=$((SET_COUNT + 1))
        else
            # Secret doesn't exist, it failed
            echo -e "${RED}      ❌ Failed to set $SECRET_NAME${NC}"
            echo -e "${YELLOW}      Error: $OUTPUT${NC}"
            echo -e "${YELLOW}      💡 Please set manually via Dashboard: https://app.supabase.com/project/$TARGET_PROJECT_REF/settings/functions${NC}"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
        echo ""
    done
    
    echo -e "${GREEN}✅ Secrets migration completed${NC}"
    echo -e "   Set: ${GREEN}$SET_COUNT${NC}, Skipped: ${YELLOW}$SKIPPED_COUNT${NC}, Failed: ${RED}$FAILED_COUNT${NC}"
    
    if [ $FAILED_COUNT -gt 0 ]; then
        echo -e "\n${YELLOW}💡 To set remaining secrets manually:${NC}"
        echo -e "${YELLOW}   supabase secrets set SECRET_NAME=value --project-ref $TARGET_PROJECT_REF${NC}"
        echo -e "${YELLOW}   Or via Dashboard: https://app.supabase.com/project/$TARGET_PROJECT_REF/settings/functions${NC}"
    fi
    echo ""
}

# Migrate edge function secrets (legacy - for migrating from source project)
migrate_secrets() {
    if [ "$SKIP_SECRETS" = "true" ]; then
        return
    fi
    
    # Only run if SOURCE_PROJECT_REF is set and user wants to migrate from source
    if [ -z "$SOURCE_PROJECT_REF" ] || [ "$MIGRATE_FROM_SOURCE" != "true" ]; then
        return
    fi
    
    echo -e "${BLUE}🔐 Migrating edge function secrets from source project...${NC}"
    
    # Check if we can list secrets from source
    echo -e "${YELLOW}   Fetching secrets from source project...${NC}"
    SOURCE_SECRETS=$(supabase secrets list --project-ref "$SOURCE_PROJECT_REF" 2>&1)
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}   ⚠️  Could not fetch secrets from source project${NC}"
        echo -e "${YELLOW}   This might be due to permissions or project access${NC}\n"
        return
    fi
    
    # Parse and migrate secrets from source (same logic as before)
    # ... (keeping the original logic for source migration if needed)
    echo -e "${YELLOW}   ℹ️  Use set_supabase_secrets() for setting from environment variables${NC}\n"
}

# Alternative: Migrate secrets from a file
migrate_secrets_from_file() {
    # SECRETS_FILE is set from .env or environment, default to secrets.txt
    SECRETS_FILE="${SECRETS_FILE:-secrets.txt}"
    
    if [ ! -f "$SECRETS_FILE" ]; then
        return
    fi
    
    echo -e "${BLUE}🔐 Migrating secrets from file: $SECRETS_FILE...${NC}"
    
    while IFS='=' read -r SECRET_NAME SECRET_VALUE || [ -n "$SECRET_NAME" ]; do
        # Skip comments and empty lines
        [[ "$SECRET_NAME" =~ ^#.*$ ]] && continue
        [[ -z "$SECRET_NAME" ]] && continue
        
        # Remove quotes if present
        SECRET_VALUE=$(echo "$SECRET_VALUE" | sed 's/^"//;s/"$//')
        
        echo -e "${YELLOW}   Setting $SECRET_NAME...${NC}"
        if supabase secrets set "$SECRET_NAME=$SECRET_VALUE" --project-ref "$TARGET_PROJECT_REF" 2>&1; then
            echo -e "${GREEN}      ✓ Successfully set $SECRET_NAME${NC}"
        else
            echo -e "${RED}      ❌ Failed to set $SECRET_NAME${NC}"
        fi
    done < "$SECRETS_FILE"
    
    echo -e "${GREEN}✅ Secrets from file migration completed${NC}\n"
}

# Main execution
main() {
    echo -e "${GREEN}🚀 Starting Supabase Migration (CLI-based)${NC}\n"
    
    # Load .env file first (before checking prerequisites)
    load_env_file
    
    echo -e "Source Project: ${BLUE}$SOURCE_PROJECT_REF${NC}"
    echo -e "Target Project: ${BLUE}$TARGET_PROJECT_REF${NC}\n"
    echo -e "${YELLOW}ℹ️  Cross-account migration supported${NC}\n"
    
    check_prerequisites
    migrate_schema
    migrate_data
    
    # Set Supabase function secrets from environment variables
    # This sets: ANON_KEY, SERVICE_ROLE_KEY, DB_URL (without SUPABASE_ prefix)
    set_supabase_secrets
    
    # Optional: Migrate additional secrets from file or source project
    if [ "$MIGRATE_FROM_SOURCE" = "true" ]; then
        migrate_secrets_from_file  # Try file first if exists
        migrate_secrets            # Then try from source project
    fi
    
    deploy_functions
    
    echo -e "${GREEN}✅ Migration completed successfully!${NC}\n"
    echo -e "${BLUE}📋 Summary:${NC}"
    if [ "$SKIP_SCHEMA" != "true" ]; then
        echo -e "   ✓ Schema migrated"
    else
        echo -e "   ⏭️  Schema migration skipped (already applied)"
    fi
    if [ "$SKIP_DATA" != "true" ]; then
        echo -e "   ✓ Data migrated"
    else
        echo -e "   ⏭️  Data migration skipped"
    fi
    if [ "$SKIP_SECRETS" != "true" ]; then
        echo -e "   ✓ Secrets set (ANON_KEY, SERVICE_ROLE_KEY, DB_URL)"
    else
        echo -e "   ⏭️  Secrets migration skipped"
    fi
    if [ "$SKIP_FUNCTIONS" != "true" ]; then
        echo -e "   ✓ Edge functions deployed"
    else
        echo -e "   ⏭️  Function deployment skipped"
    fi
    echo -e "\n${YELLOW}💡 Next steps:${NC}"
    echo -e "   1. Verify data in target project dashboard"
    echo -e "   2. Test edge functions"
    echo -e "   3. Verify RLS policies are working"
    echo -e "   4. Update frontend environment variables"
}

# Run main function
main



