#!/bin/bash

# ALL_PACKAGES
packages=(
  "blocks"
  "editor"
  "global"
  "phasor"
  "playground"
  "react"
  "store"
  "virgo"
)

for package in "${packages[@]}"
do
  rm -rf "packages/$package/dist"
done
