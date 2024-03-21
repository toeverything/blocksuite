#!/bin/bash

# Never set eux here otherwise it will break the CI

# ALL_PACKAGES
packages=(
  "framework/block-std"
  "framework/global"
  "framework/store"
  "framework/inline"
  "framework/sync"
  "blocks"
  # "docs" # NOT PUBLISHING
  "presets"
  # "playground" # NOT PUBLISHING
)

npm config set '//registry.npmjs.org/:_authToken' "${NPM_TOKEN}"

pnpm build:packages

for package in "${packages[@]}"
do
  cd "packages/$package"

  if [ "$CANARY" = "true" ]; then
    pnpm publish --no-git-checks --tag canary
  else
    pnpm publish
  fi

  if [[ $package == framework/* ]]; then
    cd ../../../
  else
    cd ../../
  fi
done
