#!/bin/bash

# ALL_PACKAGES
packages=(
  "blocks"
  "editor"
  "global"
  "phasor"
  # "playground" # NOT PUBLISHED
  "react"
  "store"
  "virgo"
)

npm config set '//registry.npmjs.org/:_authToken' "${NPM_TOKEN}"

for package in "${packages[@]}"
do
  cd "packages/$package"
  pnpm build

  if [ "$NIGHTLY" = "true" ]; then
    pnpm publish --no-git-checks --tag nightly
  else
    pnpm publish
  fi

  cd ../../
done
