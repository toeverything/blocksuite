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

replace() {
  mv package-modified.json package.json

  # cut will split `a.b.c-x` into `a.b.c`
  #   for example: `3.1.1-alpha.0` into `3.1.1`
  VERSION=$(jq -r '.version' package.json | cut -d "-" -f 1)

  pnpm version "$VERSION-$BUILD_VERSION" --no-git-tag-version  --no-commit-hooks
}

for package in "${packages[@]}"
do
  cd "packages/$package"
  jq ".name = \"@blocksuite/${package}\"" package.json > package-modified.json
  replace
  cd ../../
done
