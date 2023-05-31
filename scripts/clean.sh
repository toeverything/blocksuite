#!/bin/bash

# ALL_PACKAGES
packages=(
  "blocks"
  "docs"
  "editor"
  "global"
  "phasor"
  "playground"
  "store"
  "virgo"
  "connector"
  "lit"
)

for package in "${packages[@]}"
do
  rm -rf "packages/$package/dist"
done
