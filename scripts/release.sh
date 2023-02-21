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
  npm publish
  cd ../../
done
