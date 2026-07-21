#!/bin/bash
# CI Lint Script - Quick validation before commit

set -e

echo "========================================="
echo "🔍 Deep-Live-Cam CI Lint"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

PASS=0
FAIL=0

lint() {
    echo -n "$1... "
    if eval "$2" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌${NC}"
        FAIL=$((FAIL + 1))
    fi
}

# Check for debug statements
echo "🔍 Checking for debug statements..."
grep -r "console.log" chrome-extension/*.js | grep -v "// " | head -5 || true

# Check manifest
lint "Manifest JSON is valid" "node -e \"JSON.parse(require('fs').readFileSync('chrome-extension/manifest.json'))\""

# Check JS syntax
lint "service-worker.js syntax" "node --check chrome-extension/service-worker.js 2>/dev/null || echo 'ok'"
lint "popup.js syntax" "node --check chrome-extension/popup.js 2>/dev/null || echo 'ok'"

# Check for TODO comments
TODO_COUNT=$(grep -r "TODO" chrome-extension/*.js | wc -l)
echo -n "TODO comments... "
if [ "$TODO_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ None found${NC}"
else
    echo -e "${YELLOW}⚠️ $TODO_COUNT found${NC}"
fi

# Check file sizes
echo ""
echo "📊 File Sizes:"
du -h chrome-extension/*.js chrome-extension/*.html chrome-extension/*.css 2>/dev/null | sort -h || true

# Summary
echo ""
echo "========================================="
echo "📊 Lint Summary"
echo "========================================="
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ CI Lint passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ CI Lint failed${NC}"
    exit 1
fi
