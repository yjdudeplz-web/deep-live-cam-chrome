#!/bin/bash
# Run all tests for Deep-Live-Cam Chrome Extension

set -e

echo "========================================="
echo "🧪 Running Deep-Live-Cam Tests"
echo "========================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

PASS=0
FAIL=0

run_test() {
    echo ""
    echo "📋 Running $1..."
    if node "$2"; then
        echo -e "${GREEN}✅ $1 passed${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌ $1 failed${NC}"
        FAIL=$((FAIL + 1))
    fi
}

# Run all tests
run_test "Manifest Tests" "tests/test_manifest.js"
run_test "Face Swap Engine Tests" "tests/test_face_swap_engine.js"
run_test "Integration Tests" "tests/test_integration.js"

# Summary
echo ""
echo "========================================="
echo "📊 Test Results"
echo "========================================="
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
