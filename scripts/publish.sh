#!/bin/bash

# Never set eux here otherwise it will break the CI

# ALL_PACKAGES
packages=(
  "blocks"
  "block-std"
  # "docs" # NOT PUBLISHED
  "presets"
  "global"
  # "playground" # NOT PUBLISHED
  "store"
  "inline"
  "lit"
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

  cd ../../
done
