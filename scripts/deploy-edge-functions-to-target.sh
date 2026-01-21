#!/bin/bash
# Deploy Edge Functions to Target Supabase Project
# 
# This script deploys all edge functions from the source to target Supabase project.
# It uses Supabase CLI to deploy functions.
#
# Prerequisites:
#   - Supabase CLI installed (npm install -g supabase)
#   - Authenticated with Supabase CLI: supabase login
#   - TARGET_PROJECT_REF environment variable set
#
# Usage:
#   export TARGET_PROJECT_REF="target-project-ref"
#   chmod +x scripts/deploy-edge-functions-to-target.sh
#   ./scripts/deploy-edge-functions-to-target.sh

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TARGET_PROJECT_REF="${TARGET_PROJECT_REF:-}"

if [ -z "$TARGET_PROJECT_REF" ]; then
    echo -e "${RED}❌ Error: TARGET_PROJECT_REF is required${NC}"
    echo -e "${YELLOW}Usage: export TARGET_PROJECT_REF=\"your-target-project-ref\"${NC}"
    echo -e "${YELLOW}Then run: ./scripts/deploy-edge-functions-to-target.sh${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Deploying Edge Functions to Target Supabase Project${NC}"
echo -e "${BLUE}   Target: ${GREEN}$TARGET_PROJECT_REF${NC}\n"

# Change to supabase directory
cd "$(dirname "$0")/../supabase" || exit 1

# List of edge functions to deploy (excluding _shared and deno.json)
FUNCTIONS=(
    "achievements/calculate-achievements"
    "achievements/get-levels"
    "achievements/get-user-achievements"
    "admin/manage-users"
    "badges/create-badge"
    "badges/delete-badge"
    "badges/get-user-badges"
    "badges/list-badges"
    "badges/update-badge"
    "profile/create-share-link"
    "profile/get-private-profile"
    "profile/get-public-profile"
    "profile/update-enhanced-profile"
    "quiz/assign-users"
    "quiz/bulk-assign"
    "quiz/create-quiz"
    "quiz/delete-progress"
    "quiz/delete-quiz"
    "quiz/duplicate-quiz"
    "quiz/get-assigned-quizzes"
    "quiz/get-progress"
    "quiz/get-quiz"
    "quiz/get-quiz-assignments"
    "quiz/get-quiz-result"
    "quiz/get-user-results"
    "quiz/get-visible-quizzes"
    "quiz/import-surveyjs"
    "quiz/publish-quiz"
    "quiz/remove-assignment"
    "quiz/save-progress"
    "quiz/submit-answers"
    "quiz/submit-with-tags"
    "quiz/update-quiz"
    "quiz/update-visibility"
)

DEPLOYED=0
FAILED=0
FAILED_FUNCTIONS=()

echo -e "${BLUE}📦 Deploying ${#FUNCTIONS[@]} edge functions...${NC}\n"

for func in "${FUNCTIONS[@]}"; do
    echo -e "${YELLOW}   Deploying: ${func}...${NC}"
    
    if supabase functions deploy "$func" --project-ref "$TARGET_PROJECT_REF" --no-verify-jwt 2>&1 | tee /tmp/deploy-output.log; then
        echo -e "${GREEN}      ✓ Successfully deployed ${func}${NC}"
        DEPLOYED=$((DEPLOYED + 1))
    else
        echo -e "${RED}      ❌ Failed to deploy ${func}${NC}"
        FAILED=$((FAILED + 1))
        FAILED_FUNCTIONS+=("$func")
    fi
    echo ""
done

echo -e "${GREEN}✅ Edge function deployment completed${NC}"
echo -e "   Deployed: ${GREEN}$DEPLOYED${NC}, Failed: ${RED}$FAILED${NC}\n"

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Failed to deploy the following functions:${NC}"
    for func in "${FAILED_FUNCTIONS[@]}"; do
        echo -e "${RED}   - $func${NC}"
    done
    echo ""
    echo -e "${YELLOW}💡 Troubleshooting:${NC}"
    echo -e "${YELLOW}   1. Check that you're authenticated: supabase login${NC}"
    echo -e "${YELLOW}   2. Verify TARGET_PROJECT_REF is correct${NC}"
    echo -e "${YELLOW}   3. Check function code for errors${NC}"
    echo -e "${YELLOW}   4. Review deployment logs above${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 All edge functions deployed successfully!${NC}"
echo -e "${BLUE}   Next steps:${NC}"
echo -e "${BLUE}   1. Set edge function secrets (if needed)${NC}"
echo -e "${BLUE}   2. Test edge functions from frontend${NC}"
echo -e "${BLUE}   3. Monitor function logs in Supabase dashboard${NC}"

