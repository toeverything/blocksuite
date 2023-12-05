#!/bin/bash

set -eu -o pipefail

# ALL_PACKAGES
packages=(
  "blocks-std"
  "blocks"
  "docs"
  "presets"
  "global"
  "lit"
  "playground"
  "store"
  "virgo"
)

for package in "${packages[@]}"
do
  rm -rf "packages/$package/dist" "packages/$package/tsconfig.tsbuildinfo" "test-results"
done
