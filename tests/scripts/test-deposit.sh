#!/bin/bash

# Test deposit endpoint
# First, get a valid token by signing in

echo "Testing deposit endpoint..."
echo ""

# Sign in to get token
echo "1. Signing in..."
SIGNIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "siddharth@quickpe.com",
    "password": "password123"
  }')

echo "Signin response: $SIGNIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo $SIGNIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token"
    exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."
echo ""

# Test deposit
echo "2. Testing deposit..."
DEPOSIT_RESPONSE=$(curl -s -X POST http://localhost:5001/api/v1/account/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 1000}' \
  -w "\nHTTP_CODE:%{http_code}")

echo "Deposit response:"
echo "$DEPOSIT_RESPONSE"
echo ""

# Check if successful
if echo "$DEPOSIT_RESPONSE" | grep -q "HTTP_CODE:200"; then
    echo "✅ Deposit successful!"
else
    echo "❌ Deposit failed!"
    echo ""
    echo "Full response:"
    echo "$DEPOSIT_RESPONSE"
fi
