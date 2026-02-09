#!/bin/bash

# ============================================================
# Hyperledger Explorer Setup Script for MedicalChain
# 
# This script:
# 1. Checks if Fabric network is running
# 2. Creates necessary directories
# 3. Starts Explorer with Docker Compose
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$SCRIPT_DIR/../docker"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Hyperledger Explorer Setup for MedicalChain                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check Docker
echo "🔍 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker."
    exit 1
fi
echo "✅ Docker is running"

# Check if Fabric network exists
echo ""
echo "🔍 Checking Fabric network..."
if ! docker network ls | grep -q "medchain-network"; then
    echo "⚠️  medchain-network not found. Creating network..."
    docker network create docker_medchain-network 2>/dev/null || true
fi

# Check if Fabric containers are running
echo ""
echo "🔍 Checking Fabric containers..."
FABRIC_RUNNING=false
if docker ps | grep -q "medchain-orderer"; then
    echo "✅ Fabric orderer is running"
    FABRIC_RUNNING=true
else
    echo "⚠️  Fabric orderer is NOT running"
fi

if docker ps | grep -q "medchain-peer"; then
    echo "✅ Fabric peers are running"
    FABRIC_RUNNING=true
else
    echo "⚠️  Fabric peers are NOT running"
fi

if [ "$FABRIC_RUNNING" = false ]; then
    echo ""
    echo "⚠️  WARNING: Fabric network doesn't seem to be running."
    echo "   Explorer will start but may not show any data until Fabric is up."
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Check crypto materials
echo ""
echo "🔍 Checking crypto materials..."
CRYPTO_DIR="$DOCKER_DIR/crypto-config"
if [ ! -d "$CRYPTO_DIR" ]; then
    echo "⚠️  crypto-config directory not found at: $CRYPTO_DIR"
    echo "   Creating placeholder directory..."
    mkdir -p "$CRYPTO_DIR"
    echo "   NOTE: You need to generate crypto materials for Explorer to work properly."
fi

# Start Explorer
echo ""
echo "🚀 Starting Hyperledger Explorer..."
cd "$DOCKER_DIR"

docker-compose -f docker-compose.explorer.yml up -d

echo ""
echo "⏳ Waiting for Explorer to start (30 seconds)..."
sleep 30

# Check if Explorer is running
if docker ps | grep -q "medchain-explorer"; then
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "✅ Hyperledger Explorer is running!"
    echo ""
    echo "   🌐 Open in browser: http://localhost:8080"
    echo ""
    echo "   📋 Login credentials:"
    echo "      Username: exploreradmin"
    echo "      Password: exploreradminpw"
    echo ""
    echo "   📊 You can view:"
    echo "      - Blocks and transactions"
    echo "      - Chaincode information"
    echo "      - Network topology"
    echo "      - Channel details"
    echo "═══════════════════════════════════════════════════════════════"
else
    echo ""
    echo "❌ Explorer failed to start. Check logs with:"
    echo "   docker logs medchain-explorer"
fi
