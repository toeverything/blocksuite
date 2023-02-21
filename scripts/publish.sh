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

for package in "${packages[@]}"
do
  cd "packages/$package"
  pnpm build

  if [ "$NIGHTLY" = "true" ]; then
    npm publish --tag nightly
  else
    npm publish
  fi

  cd ../../
done
