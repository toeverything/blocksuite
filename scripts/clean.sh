#!/bin/bash

set -eu -o pipefail

# ALL_PACKAGES
packages=(
  "framework/block-std"
  "framework/global"
  "framework/store"
  "framework/inline"
  "framework/sync" 
  "blocks"
  "docs"
  "presets"
  "playground"
)

for package in "${packages[@]}"
do
  rm -rf "packages/$package/dist" "packages/$package/tsconfig.tsbuildinfo" "test-results"
done
