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

- feat(blocks): add dbid/rowid to peek view (#8614)
- feat(blocks): auto scroll block into view when keyboard tool opened (#8609)
- feat(database): support sorting functionality (#8583)

## Fix

- fix: use notification service to toast code copy result (#8613)
- fix(blocks): del selected in paste handler not paste middleware (#8575)
- fix(edgeless): edit behavior in edgeless text (#8607)
- fix(blocks): can not toggle text style in empty paragraph (#8606)
- fix: the type of VirtualKeyboard type is missing when build (#8605)
- fix(edgeless): toolbar resize observer is executed after element disconnect (#8603)

## Chore

- chore: Lock file maintenance (#8612)
- chore: bump up all non-major dependencies (#8596)
- chore(blocks): add feature flag for keyboard toolbar (#8598)
- chore(blocks): disable database search in mobile (#8599)

## Refactor

- refactor(edgeless): rewrite surface middleware builder (#8618)
- refactor(blocks): extract some common logics to commands (#8604)
- refactor(database): menu ui (#8608)
