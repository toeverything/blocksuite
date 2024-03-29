#!/bin/bash

ENV_PATH="./.env"

echo "Generating ECDSA key pair..."
keys=$(npx 0ecdsa-generate-keypair --name auth)

publicKey=$(echo "$keys" | grep "AUTH_PUBLIC_KEY" | sed 's/AUTH_PUBLIC_KEY=//')
privateKey=$(echo "$keys" | grep "AUTH_PRIVATE_KEY" | sed 's/AUTH_PRIVATE_KEY=//')

if [ -z "$publicKey" ] || [ -z "$privateKey" ]; then
    echo "Failed to generate or extract the keys."
    exit 1
fi

if [ -f "$ENV_PATH" ]; then
    if sed --version 2>&1 | grep -q "GNU"; then
        # GNU sed
        sed -i "s/AUTH_PUBLIC_KEY=.*/AUTH_PUBLIC_KEY=$publicKey/" $ENV_PATH
        sed -i "s/AUTH_PRIVATE_KEY=.*/AUTH_PRIVATE_KEY=$privateKey/" $ENV_PATH
    else
        # BSD sed
        sed -i '' "s/AUTH_PUBLIC_KEY=.*/AUTH_PUBLIC_KEY=$publicKey/" $ENV_PATH
        sed -i '' "s/AUTH_PRIVATE_KEY=.*/AUTH_PRIVATE_KEY=$privateKey/" $ENV_PATH
    fi
    echo "Updated .env with new ECDSA key pair."
else
    echo ".env file does not exist."
fi