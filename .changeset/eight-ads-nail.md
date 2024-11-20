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

## Feat

- feat: add pdf style to attachment (#8752)
- feat(playground): optimize heavy whiteboard content positioning (#8746)

## Fix

- fix(edgeless): frame title should be render on the top and clickable (#8755)
- fix(database): use copy logic when creating a linked doc (#8640)
- fix(store): remove page from draft model (#8760)
- fix(edgeless): container should not contain itself (#8758)
- fix(edgeless): new frame should be on the bottom layer (#8756)
- fix(edgeless): only clear surface selection when switching tool (#8753)
- fix(edgeless): connector clone (#8747)

## Chore

- chore(blocks): remove trigger key '、' from slash menu (#8768)
- chore(blocks): adjust and remove some actions from keyboard-toolbar (#8767)
- chore: lock file maintenance (#8659)
- chore: bump icons (#8761)

## Refactor

- refactor(edgeless): avoid accumulated updates in batch drag (#8763)

## Perf

- perf(edgeless): optimize selection frame rate (#8751)
