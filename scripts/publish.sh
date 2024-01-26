#!/bin/bash

# Never set eux here otherwise it will break the CI

# ALL_PACKAGES
packages=(
  "framework/block-std"
  "framework/global"
  "framework/lit"
  "framework/store"
  "framework/inline"
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

  if [ "$NIGHTLY" = "true" ]; then
    pnpm publish --no-git-checks --tag nightly
  else
    pnpm publish
  fi

  if [[ $package == framework/* ]]; then
    cd ../../../
  else
    cd ../../
  fi
done
