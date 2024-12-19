---
'@blocksuite/affine': patch
'@blocksuite/affine-block-embed': patch
'@blocksuite/affine-block-list': patch
'@blocksuite/affine-block-paragraph': patch
'@blocksuite/affine-block-surface': patch
'@blocksuite/affine-components': patch
'@blocksuite/data-view': patch
'@blocksuite/affine-model': patch
'@blocksuite/affine-shared': patch
'@blocksuite/affine-widget-scroll-anchoring': patch
'@blocksuite/blocks': patch
'@blocksuite/docs': patch
'@blocksuite/block-std': patch
'@blocksuite/global': patch
'@blocksuite/inline': patch
'@blocksuite/store': patch
'@blocksuite/sync': patch
'@blocksuite/presets': patch
---

Improves edgeless viewport stability

## Feat

- feat(database): add AddDatabase event tracking to slash menu (#9015)

## Fix

- fix: should show title alias first (#9005)

## Chore

- chore(blocks): add event tracking for attachment upload (#9008)
- chore(blocks): reuse attachment upload method (#9007)

## Refactor

- refactor(std): optimize gfx viewport cache fields (#9014)

## Perf

- perf(edgeless): reduce redundant dom query per render (#9016)
