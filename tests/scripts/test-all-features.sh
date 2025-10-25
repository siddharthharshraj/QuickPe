#!/bin/bash

# Comprehensive Feature Test Script for QuickPe
# Tests all critical features and reports results

echo "🚀 QuickPe Comprehensive Feature Test"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_code=$5
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d':' -f2)
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (Expected $expected_code, got $http_code)"
        echo "Response: $(echo "$response" | grep -v "HTTP_CODE")"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Step 1: Sign in to get token
echo "Step 1: Authentication"
echo "----------------------"
SIGNIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "siddharth@quickpe.com",
    "password": "password123"
  }')

TOKEN=$(echo $SIGNIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Authentication failed - cannot proceed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Authentication successful${NC}"
echo ""

# Step 2: Test all features
echo "Step 2: Feature Tests"
echo "---------------------"

# 1. Add Money
test_endpoint "Add Money (Deposit)" "POST" \
    "http://localhost:5001/api/v1/account/deposit" \
    '{"amount": 100}' \
    "200"

# 2. Get Balance
test_endpoint "Get Balance" "GET" \
    "http://localhost:5001/api/v1/account/balance" \
    "" \
    "200"

# 3. Transaction History
test_endpoint "Transaction History" "GET" \
    "http://localhost:5001/api/v1/account/transactions?limit=10" \
    "" \
    "200"

# 4. Audit Trails
test_endpoint "Audit Trails" "GET" \
    "http://localhost:5001/api/v1/audit" \
    "" \
    "200"

# 5. Audit Trail Stats
test_endpoint "Audit Trail Stats" "GET" \
    "http://localhost:5001/api/v1/audit/stats" \
    "" \
    "200"

# 6. My Audit Logs
test_endpoint "My Audit Logs" "GET" \
    "http://localhost:5001/api/v1/audit/my-logs?limit=5" \
    "" \
    "200"

# 7. Notifications
test_endpoint "Get Notifications" "GET" \
    "http://localhost:5001/api/v1/notifications" \
    "" \
    "200"

# 8. Analytics Overview
test_endpoint "Analytics Overview" "GET" \
    "http://localhost:5001/api/v1/analytics/overview" \
    "" \
    "200"

# 9. Analytics Transactions
test_endpoint "Analytics Transactions" "GET" \
    "http://localhost:5001/api/v1/analytics/transactions" \
    "" \
    "200"

# 10. User Search (for send money)
test_endpoint "User Search" "GET" \
    "http://localhost:5001/api/v1/user/search?query=john" \
    "" \
    "200"

# 11. User Profile
test_endpoint "User Profile" "GET" \
    "http://localhost:5001/api/v1/user/profile" \
    "" \
    "200"

echo ""
echo "Step 3: PDF Download Tests"
echo "---------------------------"

# 12. Download Audit Trail PDF
echo -n "Testing Audit Trail PDF Download... "
audit_pdf_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X GET "http://localhost:5001/api/v1/audit/download-trail" \
    -H "Authorization: Bearer $TOKEN" \
    -o /tmp/audit_trail.pdf)

audit_pdf_code=$(echo "$audit_pdf_response" | grep "HTTP_CODE" | cut -d':' -f2)
if [ "$audit_pdf_code" = "200" ] && [ -f /tmp/audit_trail.pdf ]; then
    file_size=$(wc -c < /tmp/audit_trail.pdf)
    if [ $file_size -gt 100 ]; then
        echo -e "${GREEN}✅ PASSED${NC} (PDF size: $file_size bytes)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC} (PDF too small: $file_size bytes)"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${RED}❌ FAILED${NC} (HTTP $audit_pdf_code)"
    FAILED=$((FAILED + 1))
fi

# 13. Download Analytics PDF
echo -n "Testing Analytics PDF Download... "
analytics_pdf_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X GET "http://localhost:5001/api/v1/analytics/export?format=pdf" \
    -H "Authorization: Bearer $TOKEN" \
    -o /tmp/analytics.pdf)

analytics_pdf_code=$(echo "$analytics_pdf_response" | grep "HTTP_CODE" | cut -d':' -f2)
if [ "$analytics_pdf_code" = "200" ] && [ -f /tmp/analytics.pdf ]; then
    file_size=$(wc -c < /tmp/analytics.pdf)
    if [ $file_size -gt 100 ]; then
        echo -e "${GREEN}✅ PASSED${NC} (PDF size: $file_size bytes)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC} (PDF too small: $file_size bytes)"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${RED}❌ FAILED${NC} (HTTP $analytics_pdf_code)"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "======================================"
echo "Test Results Summary"
echo "======================================"
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please check the output above.${NC}"
    exit 1
fi
