#!/bin/bash

set -eu -o pipefail

# ALL_PACKAGES
packages=(
  "framework/block-std"
  "framework/global"
  "framework/store"
  "framework/inline"
  "framework/sync"
  "affine/model"
  "affine/shared"
  "affine/components"
  "blocks"
  "docs"
  "presets"
  "playground"
)

for package in "${packages[@]}"
do
  rm -rf "packages/$package/dist" "packages/$package/tsconfig.tsbuildinfo" "test-results" "packages/$package/node_modules/.vite"
done
