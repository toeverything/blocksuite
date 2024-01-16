#!/bin/bash

# Never set eux here otherwise it will break the CI

# ALL_PACKAGES
packages=(
  "blocks"
  # "docs" # NOT PUBLISHED
  "presets"
  "global"
  # "playground" # NOT PUBLISHED
  "store"
  "inline"
  "lit"
  "block-std"
)

replace() {
  mv package-modified.json package.json

  CURRENT_VERSION="0.11.0"
  IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
  MINOR=$((MINOR + 1))
  VERSION="$MAJOR.$MINOR.$PATCH"

  # https://github.com/toeverything/set-build-version
  pnpm version "$VERSION-nightly-$BUILD_VERSION" --no-git-tag-version  --no-commit-hooks
}

for package in "${packages[@]}"
do
  cd "packages/$package"
  jq ".name = \"@blocksuite/${package}\"" package.json > package-modified.json
  replace
  cd ../../
done
