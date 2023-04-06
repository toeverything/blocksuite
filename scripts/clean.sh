#!/bin/bash

# ALL_PACKAGES
packages=(
  "blocks"
  "docs"
  "editor"
  "global"
  "phasor"
  "playground"
  "react"
  "store"
  "virgo"
  "connector"
)

for package in "${packages[@]}"
do
  rm -rf "packages/$package/dist"
done
