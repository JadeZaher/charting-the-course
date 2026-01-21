#!/bin/bash
# Script to update all edge functions to use new env var names
# Replaces SUPABASE_URL/SUPABASE_ANON_KEY with createSupabaseClient()

FUNCTIONS_DIR="supabase/functions"

# Find all index.ts files
find "$FUNCTIONS_DIR" -name "index.ts" -type f | while read -r file; do
    # Skip _shared directory
    if [[ "$file" == *"/_shared/"* ]]; then
        continue
    fi
    
    # Check if file uses old pattern
    if grep -q "SUPABASE_URL\|SUPABASE_ANON_KEY" "$file"; then
        echo "Updating: $file"
        
        # Create backup
        cp "$file" "$file.bak"
        
        # Replace import statement
        sed -i 's/import { createClient } from "https:\/\/esm.sh\/@supabase\/supabase-js@2.39.3";/\/\/ Removed - using createSupabaseClient from auth.ts/g' "$file"
        
        # Update imports from auth.ts to include createSupabaseClient
        if grep -q 'from "../../_shared/auth.ts"' "$file"; then
            sed -i 's/from "..\/..\/_shared\/auth.ts"/from "..\/..\/_shared\/auth.ts"\nimport { createSupabaseClient } from "..\/..\/_shared\/auth.ts";/g' "$file"
            # Fix duplicate import
            sed -i '/import { createSupabaseClient } from "..\/..\/_shared\/auth.ts";/N;/import { createSupabaseClient } from "..\/..\/_shared\/auth.ts";\nimport { createSupabaseClient } from "..\/..\/_shared\/auth.ts";/d' "$file"
        fi
        if grep -q 'from "..\/_shared\/auth.ts"' "$file"; then
            sed -i 's/from "..\/_shared\/auth.ts"/from "..\/_shared\/auth.ts"\nimport { createSupabaseClient } from "..\/_shared\/auth.ts";/g' "$file"
        fi
        
        # Replace the client initialization pattern
        sed -i '/const supabaseUrl = Deno\.env\.get("SUPABASE_URL")!;/d' "$file"
        sed -i '/const supabaseAnonKey = Deno\.env\.get("SUPABASE_ANON_KEY")!;/d' "$file"
        sed -i 's/const supabase = createClient(supabaseUrl, supabaseAnonKey);/const supabase = createSupabaseClient();/g' "$file"
        
        # Clean up duplicate imports
        # This is a simple approach - manual cleanup may be needed
        
        echo "  ✓ Updated"
    fi
done

echo "Done! Please review changes and remove .bak files when satisfied."

