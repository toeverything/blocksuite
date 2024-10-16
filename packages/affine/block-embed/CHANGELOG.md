# @blocksuite/affine-block-embed

## 0.17.19

### Patch Changes

- b69b00e: ---

  '@blocksuite/affine-block-list': patch
  '@blocksuite/affine-block-paragraph': patch
  '@blocksuite/affine-block-surface': patch
  '@blocksuite/affine-components': patch
  '@blocksuite/data-view': patch
  '@blocksuite/affine-model': patch
  '@blocksuite/affine-shared': patch
  '@blocksuite/blocks': patch
  '@blocksuite/docs': patch
  '@blocksuite/block-std': patch
  '@blocksuite/global': patch
  '@blocksuite/inline': patch
  '@blocksuite/store': patch
  '@blocksuite/sync': patch
  '@blocksuite/presets': patch

  ***

  [feat: markdown adapter with latex](https://github.com/toeverything/blocksuite/pull/8503)

  [feat: support notion block equation html import](https://github.com/toeverything/blocksuite/pull/8504)

  [feat: support edgeless tidy up](https://github.com/toeverything/blocksuite/pull/8516)

  [feat: support notion callout block to blocksuite quote block](https://github.com/toeverything/blocksuite/pull/8523)

  [feat(playground): add import notion zip entry](https://github.com/toeverything/blocksuite/pull/8527)

  [fix(blocks): auto focus latex block](https://github.com/toeverything/blocksuite/pull/8505)

  [fix: enhance button layout with icon alignment](https://github.com/toeverything/blocksuite/pull/8508)

  [fix(edgeless): ime will crash edgeless text width](https://github.com/toeverything/blocksuite/pull/8506)

  [fix(edgeless): edgeless text is deleted when first block is empty](https://github.com/toeverything/blocksuite/pull/8512)

  [fix: notion html quote block import](https://github.com/toeverything/blocksuite/pull/8515)

  [fix: yjs warning](https://github.com/toeverything/blocksuite/pull/8519)

  [fix(blocks): real nested list on html export](https://github.com/toeverything/blocksuite/pull/8511)

  [fix(edgeless): cmd a will select element inner frame](https://github.com/toeverything/blocksuite/pull/8517)

  [fix(edgeless): disable contenteditable when edgeless text not in editing state](https://github.com/toeverything/blocksuite/pull/8525)

  [fix: import notion toggle list as toggle bulleted list](https://github.com/toeverything/blocksuite/pull/8528)

  [refactor(database): signals version datasource api](https://github.com/toeverything/blocksuite/pull/8513)

  [refactor(edgeless): element tree manager](https://github.com/toeverything/blocksuite/pull/8239)

  [refactor(blocks): simplify frame manager implementation](https://github.com/toeverything/blocksuite/pull/8507)

  [refactor: update group test utils using container interface](https://github.com/toeverything/blocksuite/pull/8518)

  [refactor: update frame test with container test uitls](https://github.com/toeverything/blocksuite/pull/8520)

  [refactor(database): context-menu ui and ux](https://github.com/toeverything/blocksuite/pull/8467)

  [refactor: move chat block to affine](https://github.com/toeverything/blocksuite/pull/8420)

  [perf: optimize snapshot job handling](https://github.com/toeverything/blocksuite/pull/8428)

  [perf(edgeless): disable shape shadow blur](https://github.com/toeverything/blocksuite/pull/8532)

  [chore: bump up all non-major dependencies](https://github.com/toeverything/blocksuite/pull/8514)

  [chore: Lock file maintenance](https://github.com/toeverything/blocksuite/pull/8510)

  [docs: fix table structure warning](https://github.com/toeverything/blocksuite/pull/8509)

  [docs: edgeless data structure desc](https://github.com/toeverything/blocksuite/pull/8531)

  [docs: update link](https://github.com/toeverything/blocksuite/pull/8533)

- Updated dependencies [b69b00e]
  - @blocksuite/affine-block-surface@0.17.19
  - @blocksuite/affine-components@0.17.19
  - @blocksuite/affine-model@0.17.19
  - @blocksuite/affine-shared@0.17.19
  - @blocksuite/block-std@0.17.19
  - @blocksuite/global@0.17.19
  - @blocksuite/inline@0.17.19
  - @blocksuite/store@0.17.19

## 0.17.18

### Patch Changes

- 9f70715: Bug Fixes:

  - fix(blocks): can not search in at menu with IME. [#8481](https://github.com/toeverything/blocksuite/pull/8481)
  - fix(std): dispatcher pointerUp calls twice. [#8485](https://github.com/toeverything/blocksuite/pull/8485)
  - fix(blocks): pasting elements with css inline style. [#8491](https://github.com/toeverything/blocksuite/pull/8491)
  - fix(blocks): hide outline panel toggle button when callback is null. [#8493](https://github.com/toeverything/blocksuite/pull/8493)
  - fix(blocks): pasting twice when span inside h tag. [#8496](https://github.com/toeverything/blocksuite/pull/8496)
  - fix(blocks): image should be displayed when in vertical mode. [#8497](https://github.com/toeverything/blocksuite/pull/8497)
  - fix: press backspace at the start of first line when edgeless text exist. [#8498](https://github.com/toeverything/blocksuite/pull/8498)

- Updated dependencies [9f70715]
  - @blocksuite/affine-block-surface@0.17.18
  - @blocksuite/affine-components@0.17.18
  - @blocksuite/affine-model@0.17.18
  - @blocksuite/affine-shared@0.17.18
  - @blocksuite/block-std@0.17.18
  - @blocksuite/global@0.17.18
  - @blocksuite/inline@0.17.18
  - @blocksuite/store@0.17.18

## 0.17.17

### Patch Changes

- a89c9c1: ## Features

  - feat: selection extension [#8464](https://github.com/toeverything/blocksuite/pull/8464)

  ## Bug Fixes

  - perf(edgeless): reduce refresh of frame overlay [#8476](https://github.com/toeverything/blocksuite/pull/8476)
  - fix(blocks): improve edgeless text block resizing behavior [#8473](https://github.com/toeverything/blocksuite/pull/8473)
  - fix: turn off smooth scaling and cache bounds [#8472](https://github.com/toeverything/blocksuite/pull/8472)
  - fix: add strategy option for portal [#8470](https://github.com/toeverything/blocksuite/pull/8470)
  - fix(blocks): fix slash menu is triggered in ignored blocks [#8469](https://github.com/toeverything/blocksuite/pull/8469)
  - fix(blocks): incorrect width of embed-linked-doc-block in edgeless [#8463](https://github.com/toeverything/blocksuite/pull/8463)
  - fix: improve open link on link popup [#8462](https://github.com/toeverything/blocksuite/pull/8462)
  - fix: do not enable shift-click center peek in edgeless [#8460](https://github.com/toeverything/blocksuite/pull/8460)
  - fix(database): disable database block full-width in edgeless mode [#8461](https://github.com/toeverything/blocksuite/pull/8461)
  - fix: check editable element active more accurately [#8457](https://github.com/toeverything/blocksuite/pull/8457)
  - fix: edgeless image block rotate [#8458](https://github.com/toeverything/blocksuite/pull/8458)
  - fix: outline popup ref area [#8456](https://github.com/toeverything/blocksuite/pull/8456)

- Updated dependencies [a89c9c1]
  - @blocksuite/affine-block-surface@0.17.17
  - @blocksuite/affine-components@0.17.17
  - @blocksuite/affine-model@0.17.17
  - @blocksuite/affine-shared@0.17.17
  - @blocksuite/block-std@0.17.17
  - @blocksuite/global@0.17.17
  - @blocksuite/inline@0.17.17
  - @blocksuite/store@0.17.17

## 0.17.16

### Patch Changes

- ce9a242: Fix bugs and improve experience:

  - fix slash menu and @ menu issues with IME [#8444](https://github.com/toeverything/blocksuite/pull/8444)
  - improve trigger way of latex editor [#8445](https://github.com/toeverything/blocksuite/pull/8445)
  - support in-app link jump [#8499](https://github.com/toeverything/blocksuite/pull/8449)
  - some ui improvements [#8446](https://github.com/toeverything/blocksuite/pull/8446), [#8450](https://github.com/toeverything/blocksuite/pull/8450)

- Updated dependencies [ce9a242]
  - @blocksuite/affine-block-surface@0.17.16
  - @blocksuite/affine-components@0.17.16
  - @blocksuite/affine-model@0.17.16
  - @blocksuite/affine-shared@0.17.16
  - @blocksuite/block-std@0.17.16
  - @blocksuite/global@0.17.16
  - @blocksuite/inline@0.17.16
  - @blocksuite/store@0.17.16

## 0.17.15

### Patch Changes

- 931315f: - Fix: Improved scroll behavior to target elements
  - Fix: Enhanced bookmark and synced document block styles
  - Fix: Resolved issues with PDF printing completion
  - Fix: Prevented LaTeX editor from triggering at the start of a line
  - Fix: Adjusted portal position in blocks
  - Fix: Improved mindmap layout for existing models
  - Feature: Added file type detection for exports
  - Feature: Enhanced block visibility UI in Edgeless mode
  - Refactor: Improved data source API for database
  - Refactor: Ensured new block elements are always on top in Edgeless mode
  - Chore: Upgraded non-major dependencies
  - Chore: Improved ThemeObserver and added tests
- Updated dependencies [931315f]
  - @blocksuite/affine-block-surface@0.17.15
  - @blocksuite/affine-components@0.17.15
  - @blocksuite/affine-model@0.17.15
  - @blocksuite/affine-shared@0.17.15
  - @blocksuite/block-std@0.17.15
  - @blocksuite/global@0.17.15
  - @blocksuite/inline@0.17.15
  - @blocksuite/store@0.17.15

## 0.17.14

### Patch Changes

- 163cb11: - Provide an all-in-one package for Affine.
  - Fix duplication occurs when card view is switched to embed view.
  - Improve linked block status detection.
  - Separate user extensions and internal extensions in std.
  - Fix add note feature in database.
  - Fix pasting multiple times when span nested in p.
  - Refactor range sync.
- Updated dependencies [163cb11]
  - @blocksuite/affine-block-surface@0.17.14
  - @blocksuite/affine-components@0.17.14
  - @blocksuite/affine-model@0.17.14
  - @blocksuite/affine-shared@0.17.14
  - @blocksuite/block-std@0.17.14
  - @blocksuite/global@0.17.14
  - @blocksuite/inline@0.17.14
  - @blocksuite/store@0.17.14

## 0.17.13

### Patch Changes

- 9de68e3: Update mindmap uitls export
- Updated dependencies [9de68e3]
  - @blocksuite/affine-block-surface@0.17.13
  - @blocksuite/affine-components@0.17.13
  - @blocksuite/affine-model@0.17.13
  - @blocksuite/affine-shared@0.17.13
  - @blocksuite/block-std@0.17.13
  - @blocksuite/global@0.17.13
  - @blocksuite/inline@0.17.13
  - @blocksuite/store@0.17.13

## 0.17.12

### Patch Changes

- c334c91: - fix(database): remove image column
  - fix: frame preview should update correctly after mode switched
  - refactor: move with-disposable and signal-watcher to global package
  - fix(edgeless): failed to alt clone move frame when it contains container element
  - fix: wrong size limit config
- Updated dependencies [c334c91]
  - @blocksuite/affine-block-surface@0.17.12
  - @blocksuite/affine-components@0.17.12
  - @blocksuite/affine-model@0.17.12
  - @blocksuite/affine-shared@0.17.12
  - @blocksuite/block-std@0.17.12
  - @blocksuite/global@0.17.12
  - @blocksuite/inline@0.17.12
  - @blocksuite/store@0.17.12

## 0.17.11

### Patch Changes

- 1052ebd: - Refactor drag handle widget
  - Split embed blocks to `@blocksuite/affine-block-embed`
  - Fix latex selected state in edgeless mode
  - Fix unclear naming
  - Fix prototype pollution
  - Fix portal interaction in affine modal
  - Fix paste linked block on edgeless
  - Add scroll anchoring widget
  - Add highlight selection
- Updated dependencies [1052ebd]
  - @blocksuite/affine-block-surface@0.17.11
  - @blocksuite/affine-components@0.17.11
  - @blocksuite/affine-model@0.17.11
  - @blocksuite/affine-shared@0.17.11
  - @blocksuite/block-std@0.17.11
  - @blocksuite/global@0.17.11
  - @blocksuite/inline@0.17.11
  - @blocksuite/store@0.17.11
