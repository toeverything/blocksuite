#!/usr/bin/env sh
pnpm build

cd packages/store || exit 1
pnpm pack
cd ../../

cd packages/blocks || exit 1
pnpm pack
cd ../../

cd packages/editor || exit 1
pnpm pack
cd ../../

mv packages/store/*.tgz packages/blocks/*.tgz packages/editor/*.tgz ./
