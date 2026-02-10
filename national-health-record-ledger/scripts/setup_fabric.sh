#!/bin/bash
# ============================================
# MedicalChain - Fabric Network Setup & Deploy
# ============================================
# This script:
# 1. Downloads Fabric binaries (if needed)
# 2. Generates crypto materials
# 3. Creates genesis block & channel tx
# 4. Starts Docker containers
# 5. Creates channel & joins peers
# 6. Packages, installs, approves & commits chaincode
# ============================================

set -e

# --- Configuration ---
CHANNEL_NAME="medchannel"
CHAINCODE_NAME="medrecords"
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE=1
CHAINCODE_PATH="../on-chain/hyperledger/chaincode"
FABRIC_VERSION="2.5.4"
FABRIC_CA_VERSION="1.5.7"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- Directories ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_DIR="$PROJECT_DIR/docker"
BIN_DIR="$PROJECT_DIR/bin"
CONFIG_DIR="$PROJECT_DIR/config"

export PATH="$BIN_DIR:$PATH"

cd "$DOCKER_DIR"

# ============================================
# Step 0: Check / Download Fabric Binaries
# ============================================
step0_download_binaries() {
    log_info "Step 0: Checking Fabric binaries..."

    if [ -f "$BIN_DIR/cryptogen" ] && [ -f "$BIN_DIR/configtxgen" ] && [ -f "$BIN_DIR/peer" ]; then
        log_ok "Fabric binaries already exist in $BIN_DIR"
        return
    fi

    log_info "Downloading Fabric binaries v${FABRIC_VERSION}..."
    mkdir -p "$BIN_DIR"

    cd /tmp
    curl -sSL https://bit.ly/2ysbOFE | bash -s -- ${FABRIC_VERSION} ${FABRIC_CA_VERSION} -d -s

    cp /tmp/fabric-samples/bin/* "$BIN_DIR/" 2>/dev/null || true

    # Alternative: direct download
    if [ ! -f "$BIN_DIR/peer" ]; then
        log_info "Trying direct download..."
        ARCH=$(uname -m)
        if [ "$ARCH" = "x86_64" ]; then
            ARCH="amd64"
        elif [ "$ARCH" = "aarch64" ]; then
            ARCH="arm64"
        fi

        FABRIC_URL="https://github.com/hyperledger/fabric/releases/download/v${FABRIC_VERSION}/hyperledger-fabric-linux-${ARCH}-${FABRIC_VERSION}.tar.gz"
        curl -sSL "$FABRIC_URL" | tar xz -C "$PROJECT_DIR"

        CA_URL="https://github.com/hyperledger/fabric-ca/releases/download/v${FABRIC_CA_VERSION}/hyperledger-fabric-ca-linux-${ARCH}-${FABRIC_CA_VERSION}.tar.gz"
        curl -sSL "$CA_URL" | tar xz -C "$PROJECT_DIR"
    fi

    cd "$DOCKER_DIR"

    if [ -f "$BIN_DIR/peer" ]; then
        log_ok "Fabric binaries downloaded successfully"
        peer version
    else
        log_error "Failed to download Fabric binaries!"
        log_info "Please download manually from: https://github.com/hyperledger/fabric/releases"
        exit 1
    fi
}

# ============================================
# Step 1: Generate Crypto Materials
# ============================================
step1_generate_crypto() {
    log_info "Step 1: Generating crypto materials..."

    # Clean old crypto
    rm -rf crypto-config
    mkdir -p crypto-config

    cryptogen generate --config=crypto-config.yaml --output=crypto-config

    if [ -d "crypto-config/peerOrganizations" ]; then
        log_ok "Crypto materials generated successfully"
    else
        log_error "Failed to generate crypto materials!"
        exit 1
    fi
}

# ============================================
# Step 2: Generate Genesis Block & Channel TX
# ============================================
step2_generate_artifacts() {
    log_info "Step 2: Generating channel artifacts..."

    rm -rf channel-artifacts
    mkdir -p channel-artifacts

    export FABRIC_CFG_PATH="$DOCKER_DIR"

    # Genesis block
    configtxgen -profile MedChainOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block
    log_ok "Genesis block created"

    # Channel transaction
    configtxgen -profile MedChainChannel -outputCreateChannelTx ./channel-artifacts/${CHANNEL_NAME}.tx -channelID ${CHANNEL_NAME}
    log_ok "Channel TX created"

    # Anchor peer updates
    configtxgen -profile MedChainChannel -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx -channelID ${CHANNEL_NAME} -asOrg Org1MSP
    configtxgen -profile MedChainChannel -outputAnchorPeersUpdate ./channel-artifacts/Org2MSPanchors.tx -channelID ${CHANNEL_NAME} -asOrg Org2MSP
    log_ok "Anchor peer updates created"
}

# ============================================
# Step 3: Start Docker Containers
# ============================================
step3_start_containers() {
    log_info "Step 3: Starting Docker containers..."

    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    docker network prune -f 2>/dev/null || true

    # Start Fabric containers only (not postgres/ganache)
    docker-compose up -d orderer.example.com peer0.org1.example.com peer0.org2.example.com ca.org1.example.com ca.org2.example.com

    # Wait for containers
    log_info "Waiting for containers to start..."
    sleep 5

    # Check if containers are running
    if docker ps | grep -q "medchain-orderer"; then
        log_ok "Orderer is running"
    else
        log_error "Orderer failed to start!"
        docker logs medchain-orderer 2>&1 | tail -20
        exit 1
    fi

    if docker ps | grep -q "medchain-peer-org1"; then
        log_ok "Peer Org1 is running"
    else
        log_error "Peer Org1 failed to start!"
        docker logs medchain-peer-org1 2>&1 | tail -20
        exit 1
    fi

    if docker ps | grep -q "medchain-peer-org2"; then
        log_ok "Peer Org2 is running"
    else
        log_error "Peer Org2 failed to start!"
        docker logs medchain-peer-org2 2>&1 | tail -20
        exit 1
    fi
}

# ============================================
# Step 4: Create Channel & Join Peers
# ============================================
step4_create_channel() {
    log_info "Step 4: Creating channel '${CHANNEL_NAME}'..."

    # Set FABRIC_CFG_PATH to config dir (contains core.yaml for peer CLI)
    export FABRIC_CFG_PATH="$CONFIG_DIR"

    # Environment for Org1 peer
    export CORE_PEER_TLS_ENABLED=false
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_MSPCONFIGPATH="$DOCKER_DIR/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    export CORE_PEER_ADDRESS=localhost:7051
    export ORDERER_ADDRESS=localhost:7050

    # Create channel
    peer channel create \
        -o ${ORDERER_ADDRESS} \
        -c ${CHANNEL_NAME} \
        -f ./channel-artifacts/${CHANNEL_NAME}.tx \
        --outputBlock ./channel-artifacts/${CHANNEL_NAME}.block

    log_ok "Channel '${CHANNEL_NAME}' created"

    # Join Org1 peer
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block
    log_ok "Peer Org1 joined channel"

    # Update anchor peer for Org1
    peer channel update \
        -o ${ORDERER_ADDRESS} \
        -c ${CHANNEL_NAME} \
        -f ./channel-artifacts/Org1MSPanchors.tx
    log_ok "Org1 anchor peer updated"

    # Switch to Org2 peer
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_MSPCONFIGPATH="$DOCKER_DIR/crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"
    export CORE_PEER_ADDRESS=localhost:9051

    # Join Org2 peer
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block
    log_ok "Peer Org2 joined channel"

    # Update anchor peer for Org2
    peer channel update \
        -o ${ORDERER_ADDRESS} \
        -c ${CHANNEL_NAME} \
        -f ./channel-artifacts/Org2MSPanchors.tx
    log_ok "Org2 anchor peer updated"
}

# ============================================
# Step 5: Deploy Chaincode
# ============================================
step5_deploy_chaincode() {
    log_info "Step 5: Deploying chaincode '${CHAINCODE_NAME}'..."

    export FABRIC_CFG_PATH="$CONFIG_DIR"
    export CORE_PEER_TLS_ENABLED=false
    CHAINCODE_FULL_PATH="$(cd "$PROJECT_DIR/on-chain/hyperledger/chaincode" && pwd)"

    # --- Package ---
    log_info "5a. Packaging chaincode..."

    # Build Go chaincode first
    cd "$CHAINCODE_FULL_PATH"
    GO111MODULE=on go mod vendor 2>/dev/null || GO111MODULE=on go mod download
    cd "$DOCKER_DIR"

    peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz \
        --path "$CHAINCODE_FULL_PATH" \
        --lang golang \
        --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}

    log_ok "Chaincode packaged"

    # --- Install on Org1 ---
    log_info "5b. Installing on Org1..."
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_MSPCONFIGPATH="$DOCKER_DIR/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    export CORE_PEER_ADDRESS=localhost:7051

    peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz
    log_ok "Chaincode installed on Org1"

    # Get Package ID
    PACKAGE_ID=$(peer lifecycle chaincode queryinstalled --output json | python3 -c "
import sys, json
data = json.load(sys.stdin)
for cc in data.get('installed_chaincodes', []):
    if cc['label'] == '${CHAINCODE_NAME}_${CHAINCODE_VERSION}':
        print(cc['package_id'])
        break
")

    if [ -z "$PACKAGE_ID" ]; then
        log_error "Could not get Package ID!"
        exit 1
    fi
    log_ok "Package ID: $PACKAGE_ID"

    # --- Install on Org2 ---
    log_info "5c. Installing on Org2..."
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_MSPCONFIGPATH="$DOCKER_DIR/crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"
    export CORE_PEER_ADDRESS=localhost:9051

    peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz
    log_ok "Chaincode installed on Org2"

    # --- Approve for Org1 ---
    log_info "5d. Approving for Org1..."
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_MSPCONFIGPATH="$DOCKER_DIR/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    export CORE_PEER_ADDRESS=localhost:7051

    peer lifecycle chaincode approveformyorg \
        -o localhost:7050 \
        --channelID ${CHANNEL_NAME} \
        --name ${CHAINCODE_NAME} \
        --version ${CHAINCODE_VERSION} \
        --package-id ${PACKAGE_ID} \
        --sequence ${CHAINCODE_SEQUENCE} \
        --init-required=false

    log_ok "Chaincode approved for Org1"

    # --- Approve for Org2 ---
    log_info "5e. Approving for Org2..."
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_MSPCONFIGPATH="$DOCKER_DIR/crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"
    export CORE_PEER_ADDRESS=localhost:9051

    peer lifecycle chaincode approveformyorg \
        -o localhost:7050 \
        --channelID ${CHANNEL_NAME} \
        --name ${CHAINCODE_NAME} \
        --version ${CHAINCODE_VERSION} \
        --package-id ${PACKAGE_ID} \
        --sequence ${CHAINCODE_SEQUENCE} \
        --init-required=false

    log_ok "Chaincode approved for Org2"

    # --- Check Commit Readiness ---
    log_info "5f. Checking commit readiness..."
    peer lifecycle chaincode checkcommitreadiness \
        --channelID ${CHANNEL_NAME} \
        --name ${CHAINCODE_NAME} \
        --version ${CHAINCODE_VERSION} \
        --sequence ${CHAINCODE_SEQUENCE} \
        --init-required=false

    # --- Commit ---
    log_info "5g. Committing chaincode..."
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_MSPCONFIGPATH="$DOCKER_DIR/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    export CORE_PEER_ADDRESS=localhost:7051

    peer lifecycle chaincode commit \
        -o localhost:7050 \
        --channelID ${CHANNEL_NAME} \
        --name ${CHAINCODE_NAME} \
        --version ${CHAINCODE_VERSION} \
        --sequence ${CHAINCODE_SEQUENCE} \
        --init-required=false \
        --peerAddresses localhost:7051 \
        --peerAddresses localhost:9051

    log_ok "Chaincode committed!"

    # --- Verify ---
    log_info "5h. Verifying deployment..."
    peer lifecycle chaincode querycommitted --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME}

    log_ok "Chaincode '${CHAINCODE_NAME}' deployed successfully!"
}

# ============================================
# Step 6: Test Chaincode Invocation
# ============================================
step6_test_chaincode() {
    log_info "Step 6: Testing chaincode..."

    export FABRIC_CFG_PATH="$CONFIG_DIR"
    export CORE_PEER_TLS_ENABLED=false
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_MSPCONFIGPATH="$DOCKER_DIR/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    export CORE_PEER_ADDRESS=localhost:7051

    # Init Ledger
    peer chaincode invoke \
        -o localhost:7050 \
        -C ${CHANNEL_NAME} \
        -n ${CHAINCODE_NAME} \
        --peerAddresses localhost:7051 \
        --peerAddresses localhost:9051 \
        -c '{"function":"InitLedger","Args":[]}'

    sleep 2

    # Create a test record
    peer chaincode invoke \
        -o localhost:7050 \
        -C ${CHANNEL_NAME} \
        -n ${CHAINCODE_NAME} \
        --peerAddresses localhost:7051 \
        --peerAddresses localhost:9051 \
        -c '{"function":"CreateMetadata","Args":["REC001","PAT001","RS-A","postgres://medchain/records/1","abc123hash","General Checkup"]}'

    sleep 2

    # Query the record
    peer chaincode query \
        -C ${CHANNEL_NAME} \
        -n ${CHAINCODE_NAME} \
        -c '{"function":"ReadMetadata","Args":["REC001"]}'

    log_ok "Chaincode test completed!"
}

# ============================================
# Step 7: Generate Connection Profile
# ============================================
step7_generate_connection_profile() {
    log_info "Step 7: Generating connection profile..."

    API_DIR="$PROJECT_DIR/off-chain/api-gateway"

    # Get crypto material paths
    ORG1_CA_CERT=$(ls "$DOCKER_DIR/crypto-config/peerOrganizations/org1.example.com/ca/"*-cert.pem 2>/dev/null | head -1)
    ORDERER_CA_CERT=$(ls "$DOCKER_DIR/crypto-config/ordererOrganizations/example.com/ca/"*-cert.pem 2>/dev/null | head -1)

    ORG1_CA_CERT_CONTENT=""
    ORDERER_CA_CERT_CONTENT=""

    if [ -f "$ORG1_CA_CERT" ]; then
        ORG1_CA_CERT_CONTENT=$(cat "$ORG1_CA_CERT" | sed ':a;N;$!ba;s/\n/\\n/g')
    fi
    if [ -f "$ORDERER_CA_CERT" ]; then
        ORDERER_CA_CERT_CONTENT=$(cat "$ORDERER_CA_CERT" | sed ':a;N;$!ba;s/\n/\\n/g')
    fi

    cat > "$API_DIR/connection-org1.json" << CONNEOF
{
    "name": "medchain-network-org1",
    "version": "1.0.0",
    "client": {
        "organization": "Org1",
        "connection": {
            "timeout": {
                "peer": { "endorser": "300" },
                "orderer": "300"
            }
        }
    },
    "organizations": {
        "Org1": {
            "mspid": "Org1MSP",
            "peers": ["peer0.org1.example.com"],
            "certificateAuthorities": ["ca.org1.example.com"]
        },
        "Org2": {
            "mspid": "Org2MSP",
            "peers": ["peer0.org2.example.com"],
            "certificateAuthorities": ["ca.org2.example.com"]
        }
    },
    "peers": {
        "peer0.org1.example.com": {
            "url": "grpc://localhost:7051",
            "grpcOptions": {
                "ssl-target-name-override": "peer0.org1.example.com",
                "hostnameOverride": "peer0.org1.example.com"
            }
        },
        "peer0.org2.example.com": {
            "url": "grpc://localhost:9051",
            "grpcOptions": {
                "ssl-target-name-override": "peer0.org2.example.com",
                "hostnameOverride": "peer0.org2.example.com"
            }
        }
    },
    "certificateAuthorities": {
        "ca.org1.example.com": {
            "url": "http://localhost:7054",
            "caName": "ca-org1",
            "httpOptions": { "verify": false }
        },
        "ca.org2.example.com": {
            "url": "http://localhost:8054",
            "caName": "ca-org2",
            "httpOptions": { "verify": false }
        }
    },
    "orderers": {
        "orderer.example.com": {
            "url": "grpc://localhost:7050",
            "grpcOptions": {
                "ssl-target-name-override": "orderer.example.com",
                "hostnameOverride": "orderer.example.com"
            }
        }
    },
    "channels": {
        "medchannel": {
            "orderers": ["orderer.example.com"],
            "peers": {
                "peer0.org1.example.com": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": true
                },
                "peer0.org2.example.com": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": true
                }
            }
        }
    }
}
CONNEOF

    log_ok "Connection profile generated at: $API_DIR/connection-org1.json"
}

# ============================================
# Step 8: Enroll Admin & Register App User
# ============================================
step8_enroll_user() {
    log_info "Step 8: Setting up wallet identity for API Gateway..."

    API_DIR="$PROJECT_DIR/off-chain/api-gateway"
    WALLET_DIR="$API_DIR/wallet"
    mkdir -p "$WALLET_DIR"

    # Copy admin identity from crypto materials to wallet
    ADMIN_CERT="$DOCKER_DIR/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem"
    ADMIN_KEY_DIR="$DOCKER_DIR/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore"
    ADMIN_KEY=$(ls "$ADMIN_KEY_DIR/"* 2>/dev/null | head -1)

    if [ -f "$ADMIN_CERT" ] && [ -f "$ADMIN_KEY" ]; then
        # Create wallet identity file
        CERT_CONTENT=$(cat "$ADMIN_CERT" | sed ':a;N;$!ba;s/\n/\\n/g')
        KEY_CONTENT=$(cat "$ADMIN_KEY" | sed ':a;N;$!ba;s/\n/\\n/g')

        # Create identity for 'appUser' using admin cert (for dev purposes)
        cat > "$WALLET_DIR/appUser.id" << WALLETEOF
{
    "credentials": {
        "certificate": "${CERT_CONTENT}",
        "privateKey": "${KEY_CONTENT}"
    },
    "mspId": "Org1MSP",
    "type": "X.509",
    "version": 1
}
WALLETEOF

        log_ok "Wallet identity 'appUser' created at: $WALLET_DIR/appUser.id"
    else
        log_error "Admin cert/key not found! Cannot create wallet identity."
        log_warn "Cert path: $ADMIN_CERT"
        log_warn "Key dir: $ADMIN_KEY_DIR"
    fi
}

# ============================================
# MAIN
# ============================================
main() {
    echo ""
    echo "========================================"
    echo "  MedicalChain - Fabric Network Setup"
    echo "========================================"
    echo ""

    step0_download_binaries
    step1_generate_crypto
    step2_generate_artifacts
    step3_start_containers
    step4_create_channel
    step5_deploy_chaincode
    step6_test_chaincode
    step7_generate_connection_profile
    step8_enroll_user

    echo ""
    echo "========================================"
    echo -e "  ${GREEN}✅ SETUP COMPLETE!${NC}"
    echo "========================================"
    echo ""
    echo "  Channel:   ${CHANNEL_NAME}"
    echo "  Chaincode: ${CHAINCODE_NAME}"
    echo "  Orderer:   localhost:7050"
    echo "  Peer Org1: localhost:7051"
    echo "  Peer Org2: localhost:9051"
    echo "  CA Org1:   localhost:7054"
    echo "  CA Org2:   localhost:8054"
    echo ""
    echo "  Connection Profile: off-chain/api-gateway/connection-org1.json"
    echo "  Wallet:            off-chain/api-gateway/wallet/"
    echo ""
    echo "  Next: Start the API Gateway with 'npm run dev'"
    echo "========================================"
}

# Run specific step or all
if [ -n "$1" ]; then
    case $1 in
        0|binaries) step0_download_binaries ;;
        1|crypto) step1_generate_crypto ;;
        2|artifacts) step2_generate_artifacts ;;
        3|start) step3_start_containers ;;
        4|channel) step4_create_channel ;;
        5|deploy) step5_deploy_chaincode ;;
        6|test) step6_test_chaincode ;;
        7|profile) step7_generate_connection_profile ;;
        8|enroll) step8_enroll_user ;;
        *) echo "Usage: $0 [0-8|binaries|crypto|artifacts|start|channel|deploy|test|profile|enroll]" ;;
    esac
else
    main
fi
