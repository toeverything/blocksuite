#!/bin/bash

replace() {
  mv package-modified.json package.json

  # cut will split `a.b.c-x` into `a.b.c`
  #   for example: `3.1.1-alpha.0` into `3.1.1`
  VERSION=$(jq -r '.version' package.json | cut -d "-" -f 1)

  pnpm --no-git-tag-version version "$VERSION-$BUILD_VERSION"
}

cd packages/blocks
jq '.name = "@blocksuite/blocks"' package.json > package-modified.json
replace
cd ../..

cd packages/phasor
jq '.name = "@blocksuite/phasor"' package.json > package-modified.json
replace
cd ../..

cd packages/editor
jq '.name = "@blocksuite/editor"' package.json > package-modified.json
replace
cd ../..

cd packages/store
jq '.name = "@blocksuite/store"' package.json > package-modified.json
replace
cd ../..

cd packages/react
jq '.name = "@blocksuite/react"' package.json > package-modified.json
replace
cd ../..

cd packages/global
jq '.name = "@blocksuite/global"' package.json > package-modified.json
replace
cd ../..

cd packages/virgo
jq '.name = "@blocksuite/virgo"' package.json > package-modified.json
replace
cd ../..
