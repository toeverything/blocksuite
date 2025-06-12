## Check in 
eval `ssh-agent -s`
ssh-add --apple-use-keychain ~/.ssh/id_ed25519

## How to prepare locally?
yarn install

## How to run locally?
yarn dev

## How to build locally?
NODE_OPTIONS="--max-old-space-size=4096" yarn workspace @blocksuite/playground build