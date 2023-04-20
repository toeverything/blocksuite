#!/bin/bash

# ALL_PACKAGES
packages=(
  "blocks"
  # "docs" # NOT PUBLISHED
  "editor"
  "global"
  "phasor"
  # "playground" # NOT PUBLISHED
  "store"
  "virgo"
  "connector"
)

replace() {
  mv package-modified.json package.json

  VERSION=0.0.0

  pnpm version "$VERSION-$BUILD_VERSION-nightly" --no-git-tag-version  --no-commit-hooks
}

for package in "${packages[@]}"
do
  cd "packages/$package"
  jq ".name = \"@blocksuite/${package}\"" package.json > package-modified.json
  replace
  cd ../../
done
