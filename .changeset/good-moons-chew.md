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

Edgeless perf improvement, linked doc aliases support and fixes

## Feat

- feat: linked doc supports aliases (#8806)
- feat(playground): add preview view for html adapter panel (#8871)
- feat(blocks): add html block adapter for embed link block (#8874)
- feat(blocks): show input directly after the user clicks ask ai (#8872)

## Fix

- fix(edgeless): incorrect presentation order (#8840)
- fix(std): pan and pinch events were calculate relative to only one finger (#8870)
- fix(edgeless): large frame crash on ios safari (#8877)
- fix(std): shadowless element should inject styles in parent node (#8861)
- fix(blocks): linked popover style issue (#8875)
- fix(database): sum shows too many digits after decimal point (#8833)

## Refactor

- refactor: hast utils (#8873)
- refactor: migrate html adapter to extension (#8868)
