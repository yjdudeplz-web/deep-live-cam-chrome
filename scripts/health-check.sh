#!/bin/bash
# Health Check Script for Deep-Live-Cam Chrome Extension

set -e

echo "========================================="
echo "🏥 Deep-Live-Cam Health Check"
echo "========================================="
echo ""

PASS=0
FAIL=0

check() {
    echo -n "Checking $1... "
    if eval "$2" > /dev/null 2>&1; then
        echo "✅"
        PASS=$((PASS + 1))
    else
        echo "❌"
        FAIL=$((FAIL + 1))
    fi
}

# Check file structure
echo "📁 File Structure:"
check "manifest.json exists" "test -f chrome-extension/manifest.json"
check "service-worker.js exists" "test -f chrome-extension/service-worker.js"
check "popup.html exists" "test -f chrome-extension/popup.html"
check "popup.js exists" "test -f chrome-extension/popup.js"
check "content-script.js exists" "test -f chrome-extension/content-script.js"

# Check manifest version
echo ""
echo "📋 Manifest Validation:"
check "Manifest is V3" "grep -q '\"manifest_version\": 3' chrome-extension/manifest.json"
check "Has proper name" "grep -q 'Deep-Live-Cam' chrome-extension/manifest.json"
check "Has version" "grep -q '\"version\"' chrome-extension/manifest.json"

# Check scripts
echo ""
echo "🛠️ Scripts:"
check "service-worker.js exists" "test -f chrome-extension/service-worker.js"
check "popup.js exists" "test -f chrome-extension/popup.js"

# Check tests
echo ""
echo "🧪 Tests:"
check "Test runner exists" "test -f tests/run-all.sh"
check "Manifest tests exist" "test -f tests/test_manifest.js"
check "Engine tests exist" "test -f tests/test_face_swap_engine.js"

# Check docs
echo ""
echo "📚 Documentation:"
check "README exists" "test -f README.md"
check "TROUBLESHOOTING exists" "test -f docs/TROUBLESHOOTING.md"
check "FAQ exists" "test -f docs/FAQ.md"

# Summary
echo ""
echo "========================================="
echo "📊 Health Check Summary"
echo "========================================="
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "✅ All health checks passed!"
    exit 0
else
    echo "❌ Some checks failed"
    exit 1
fi
