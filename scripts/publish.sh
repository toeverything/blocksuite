#!/bin/bash

# ALL_PACKAGES
packages=(
  "blocks"
  "block-std"
  # "docs" # NOT PUBLISHED
  "editor"
  "global"
  # "playground" # NOT PUBLISHED
  "store"
  "virgo"
  "lit"
)

npm config set '//registry.npmjs.org/:_authToken' "${NPM_TOKEN}"

pnpm build:editor

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
