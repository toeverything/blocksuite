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

- feat(blocks): mobile at menu (#8681)
- feat: unify the reference data structure of inline, card and embed (#8689)
- feat(database): add placeholder for filter (#8701)
- feat(database): support for sorting event tracking (#8691)

## Fix

- fix: color of button is actived on color picker (#8685)
- fix: unable to switch to embed view when other pages link with mode (#8688)
- fix: the shape will turn black for a moment when dragging from the toolbar (#8698)
- fix(database): support for pasting linked doc into title cell (#8703)
- fix(database): menu cannot be close when it outside the doc (#8700)
- fix(database): number overflow (#8699)
- fix(database): prevent certain event propagation in the menu input (#8697)
- fix(database): toolbar icon color (#8695)
- fix(database): textarea of the title has unexpected line breaks (#8694)
- fix(database): can't create tag by clicking (#8693)
- fix(database): sorting of checkbox (#8692)
- fix: add paragraph when last block in note is not empty paragraph (#8690)
- fix: improve drag area (#8678)
- fix: edgeless crash on mobile safari (#8680)

## Chore

- chore: lock file maintenance (#8686)

## Refactor

- refactor(blocks): extract computation of selection rect to command (#8705)
- refactor(blocks): render linked doc popover with blocksuite-portal (#8664)
- refactor(blocks): move virutal keyboard controller to affine components (#8663)
- refactor(database): remove sortable.js (#8696)

## Other

- Introducing BlockSuite Guru on Gurubase.io (#8706)
