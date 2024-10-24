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

- feat(blocks): add more html transformer apis (#8573)
- feat(blocks): support more markdown transformer api (#8564)
- feat(blocks): add abort controller to peekviewservice (#8558)
- feat: add docLinkMiddleware for linked doc export (#8553)

## Fix

- fix: mind map dragging issue (#8563)
- fix(database): can't use horizontal scrollbar (#8576)
- fix: note width is less than minimum width after resize and arrange (#8550)
- fix: newly created note alignments cannot be stored persistently (#8551)
- fix: inline range calculation not expected (#8552)
- fix(database): avoid filter bar flickering (#8562)
- fix(database): drag and drop block into database block (#8561)
- fix(blocks): split paragraphs based on newlines (#8556)
- fix(database): incorrect delete row logic (#8544)
- fix: note height less than minimum height (#8542)

## Chore

- chore: add changelog generating script (#8582)
- chore: optimize zip transformer api (#8580)
- chore: adjust attachment click events, like image, to support opening in peek view (#8579)
- chore: remove useless import (#8571)

## Refactor

- refactor: convert built-in component to widget (#8577)
- refactor: migrating legacy tools (#8471)
- refactor: edgeless tool manager (#8438)
- refactor(playground): organize export and import menu items into submenus in the debug menu (#8557)
- refactor: combine unsafeCSS and cssVar (#8545)

## Perf

- perf(edgeless): use css var to place collaboration cursors-n-selections on board zoom change (#8543)
