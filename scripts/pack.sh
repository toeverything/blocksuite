pnpm build

cd packages/store
pnpm pack
cd ../../

cd packages/blocks
pnpm pack
cd ../../

cd packages/editor
pnpm pack
cd ../../

mv packages/store/*.tgz packages/blocks/*.tgz packages/editor/*.tgz ./
