---
'@blocksuite/affine': minor
'@blocksuite/affine-block-embed': minor
'@blocksuite/affine-block-list': minor
'@blocksuite/affine-block-paragraph': minor
'@blocksuite/affine-block-surface': minor
'@blocksuite/affine-components': minor
'@blocksuite/data-view': minor
'@blocksuite/affine-model': minor
'@blocksuite/affine-shared': minor
'@blocksuite/affine-widget-scroll-anchoring': minor
'@blocksuite/blocks': minor
'@blocksuite/docs': minor
'@blocksuite/block-std': minor
'@blocksuite/global': minor
'@blocksuite/inline': minor
'@blocksuite/store': minor
'@blocksuite/sync': minor
'@blocksuite/presets': minor
---

## Feat

- feat(blocks): markdown adapter reference serialization and deserialization (#8782)
- feat(blocks): add lazy loading to image and iframe (#8773)

## Fix

- fix(edgeless): missing reference info during edgeless card conversion (#8790)
- fix(blocks): linked popover styles (#8789)
- fix(blocks): add abortional to getMenus (#8786)
- fix(blocks): incorrect viewport of embed linked doc with edgeless mode (#8785)
- fix(database): crash in edgeless on mobile safari (#8784)
- fix(blocks): signify at menu config items (#8780)
- fix(database): update title on composition end (#8781)
- fix(database): kanban/table drag and drop (#8778)
- fix(database): prevent the default behavior of arrow keys when a progress cell is focused (#8777)
- fix(blocks): update at menu popover styles (#8774)
- fix(edgeless): frame overlay is not updated during dragging a new frame (#8771)

## Chore

- chore(blocks): bump theme (#8783)
- chore: organize gfx model (#8766)

## Refactor

- refactor(database): make Table View compatible with mobile devices (#8787)
- refactor(edgeless): remove legacy surface ref renderer (#8759)
- refactor: unify container and group (#8772)
- refactor(database): table ui (#8779)
- refactor(database): link cell icon (#8776)
- refactor(database): use Trait to manage the functionality of Views (#8775)
- refactor(database): column move (#8726)
