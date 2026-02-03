#!/bin/bash
# Script to deploy Chaincode to Fabric
# Requires the fabric-samples test network or similar setup

echo "Deploying Chaincode..."
echo "1. Packaging Chaincode..."
peer lifecycle chaincode package medchain.tar.gz --path ../on-chain/hyperledger/chaincode --lang go --label medchain_1.0

echo "2. Installing Chaincode..."
peer lifecycle chaincode install medchain.tar.gz

echo "3. Approving Chaincode..."
# (Simplified command, requires correct env vars for Orderer/Peer)
peer lifecycle chaincode approveformyorg -o localhost:7050 --channelID mychannel --name medchain --version 1.0 --package-id $PACKAGE_ID --sequence 1 --waitForEvent

echo "4. Committing Chaincode..."
peer lifecycle chaincode commit -o localhost:7050 --channelID mychannel --name medchain --version 1.0 --sequence 1

echo "Done. Chaincode is live on channel 'mychannel'."
