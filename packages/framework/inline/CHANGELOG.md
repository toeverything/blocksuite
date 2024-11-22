# @blocksuite/inline

## 0.18.0

### Minor Changes

- 9daa1f3: ## Feat

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

### Patch Changes

- Updated dependencies [9daa1f3]
  - @blocksuite/global@0.18.0

## 0.17.33

### Patch Changes

- c65c3ee: ## Feat

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

- Updated dependencies [c65c3ee]
  - @blocksuite/global@0.17.33

## 0.17.32

### Patch Changes

- 7bc83ab: ## Fix

  - fix: mind map text layout (#8737)

- Updated dependencies [7bc83ab]
  - @blocksuite/global@0.17.32

## 0.17.31

### Patch Changes

- 8ab2800: patch more fix

  ## Fix

  - fix(database): lock the group while editing (#8741)
  - fix(inline): double click in empty line (#8740)
  - fix(inline): triple click in v-line (#8739)
  - fix(database): root block might not exist in AFFiNE (#8738)

  ## Refactor

  - refactor: mind map drag (#8716)

- Updated dependencies [8ab2800]
  - @blocksuite/global@0.17.31

## 0.17.30

### Patch Changes

- 5c327c8: ## Fix

  - fix(database): title linked-doc convert logic (#8734)
  - fix(blocks): pdf embed view overflow (#8733)

- Updated dependencies [5c327c8]
  - @blocksuite/global@0.17.30

## 0.17.29

### Patch Changes

- 9cc49ff: ## Feat

  - feat(database): support sorting for linked doc (#8715)

  ## Fix

  - fix(blocks): init collapsed state of list (#8727)
  - fix(blocks): outline header sorting button tooltip (#8730)
  - fix(database): date-picker styles (#8728)
  - fix(blocks): only split paragraphs based on newlines (#8702)
  - fix(edgeless): disable list and paragraph padding in edgeless text (#8723)
  - fix(blocks): surface ref viewport element undefined (#8722)
  - fix(blocks): show keyboard when at menu is triggered by keyboard toolbar (#8721)
  - fix(database): linked doc convert logic (#8714)
  - fix(database): improve the display logic of the row menu button (#8713)

  ## Chore

  - chore: configurable visibility of reference node popup (#8711)
  - chore(blocks): disable dragging in mobile (#8724)

- Updated dependencies [9cc49ff]
  - @blocksuite/global@0.17.29

## 0.17.28

### Patch Changes

- 5ef420d: ## Feat

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

- Updated dependencies [5ef420d]
  - @blocksuite/global@0.17.28

## 0.17.27

### Patch Changes

- f70b950: fix: color of canvas element under embed dark theme whiteboard is wrong (#8677)

  ## Fix

  - fix: color of canvas element under embed dark theme whiteboard is wrong (#8677)
  - fix(edgeless): tool controller potential problem (#8675)
  - fix: typeError: f.\_def.innerType.shape[e] is undefined (#8676)
  - fix: whiteboard is first loaded, size of the linked doc card is scaled to wrong size (#8674)

- Updated dependencies [f70b950]
  - @blocksuite/global@0.17.27

## 0.17.26

### Patch Changes

- cfa436e: ## Feat

  - feat: add pdf viewer to playground (#8650)
  - feat: add view toggle menu to toolbar of attachment block (#8660)
  - feat: attachment embedded view supports configurable (#8658)

  ## Fix

  - fix: tidy up after multiple images uploaded (#8671)
  - fix: unable to add caption for linked document of embedded view (#8670)
  - fix(blocks): code block should update highlight when theme changed (#8669)
  - fix(edgeless): allow right click of tool controller (#8652)
  - fix(database): short name of tag type (#8665)
  - fix: the content of formula should contain spaces (#8647)
  - fix: import notion database with title (#8661)
  - fix(page): bookmark block selected style (#8656)
  - fix(edgeless): switching shape style and color, the preview does not change in time (#8655)
  - fix(blocks): size of icons are not consistent in keyboard toolbar (#8653)
  - fix: use host instead of offsetParent (#8651)

  ## Refactor

  - refactor(database): filter ui (#8611)

  ## Ci

  - ci: renovate pr title lint (#8666)

- Updated dependencies [cfa436e]
  - @blocksuite/global@0.17.26

## 0.17.25

### Patch Changes

- 4d0bd4c: fix(blocks): reset keyboard toolbar after blur (#8646)

  ## Fix

  - fix(blocks): reset keyboard toolbar after blur (#8646)
  - fix: scale note and edgeless-text when resize and align elements (#8642)
  - fix(edgeless): can not insert link when no selection (#8644)
  - fix(database): prevent 0 in number cells from getting rendered as an empty string (#8629)

  ## Refactor

  - refactor(blocks): provide position controll config for keyboard toolbar (#8645)

- Updated dependencies [4d0bd4c]
  - @blocksuite/global@0.17.25

## 0.17.24

### Patch Changes

- 5e23d07: fix(edgeless): failed to add link in edgeless text (#8589)

  ## Feat

  - feat(blocks): add callback control to AI panel hide and toggle (#8639)

  ## Fix

  - fix(edgeless): failed to add link in edgeless text (#8589)
  - fix: add data-theme on surface ref component (#8638)
  - fix(edgeless): stop pointer event propagation from latex editor menu (#8633)
  - fix: use html theme observer result as default app theme value (#8635)
  - fix(blocks): incorrect mobile keyboard toolbar when scroll (#8634)

  ## Chore

  - chore: release patch version (#8636)

- 39a840a: ## Fix

  - fix(edgeless): stop pointer event propagation from latex editor menu (#8633)
  - fix: use html theme observer result as default app theme value (#8635)
  - fix(blocks): incorrect mobile keyboard toolbar when scroll (#8634)

- Updated dependencies [5e23d07]
- Updated dependencies [39a840a]
  - @blocksuite/global@0.17.24

## 0.17.23

### Patch Changes

- dc63724: ## Feat

  - feat: support edgeless theme (#8624)

  ## Fix

  - fix(inline): get text format from left delta by default when it is collapsed (#8615)

- Updated dependencies [dc63724]
  - @blocksuite/global@0.17.23

## 0.17.22

### Patch Changes

- ba9613a: ## Feat

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

- Updated dependencies [ba9613a]
  - @blocksuite/global@0.17.22

## 0.17.21

### Patch Changes

- 24db578: ## Feat

  - feat(blocks): mobile keyboard toolbar widget (#8585)
  - feat: add mobile detection and virtual keyboard support (#8584)
  - feat(blocks): handle event only when nav.clipboard is available (#8587)
  - feat: add new dnd (#8524)

  ## Fix

  - fix(edgeless): delete at the start of edgeless text (#8574)

  ## Chore

  - chore: organize edgeless spec exports (#8595)
  - chore: Lock file maintenance (#8569)

  ## Refactor

  - refactor(blocks): extract insert inline latex to command (#8594)
  - refactor(blocks): remove hover state after button pressed in mobile (#8586)

- Updated dependencies [24db578]
  - @blocksuite/global@0.17.21

## 0.17.20

### Patch Changes

- 99d69d5: ## Feat

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

- Updated dependencies [99d69d5]
  - @blocksuite/global@0.17.20

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
  - @blocksuite/global@0.17.19

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
  - @blocksuite/global@0.17.18

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
  - @blocksuite/global@0.17.17

## 0.17.16

### Patch Changes

- ce9a242: Fix bugs and improve experience:

  - fix slash menu and @ menu issues with IME [#8444](https://github.com/toeverything/blocksuite/pull/8444)
  - improve trigger way of latex editor [#8445](https://github.com/toeverything/blocksuite/pull/8445)
  - support in-app link jump [#8499](https://github.com/toeverything/blocksuite/pull/8449)
  - some ui improvements [#8446](https://github.com/toeverything/blocksuite/pull/8446), [#8450](https://github.com/toeverything/blocksuite/pull/8450)

- Updated dependencies [ce9a242]
  - @blocksuite/global@0.17.16

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
  - @blocksuite/global@0.17.15

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
  - @blocksuite/global@0.17.14

## 0.17.13

### Patch Changes

- 9de68e3: Update mindmap uitls export
- Updated dependencies [9de68e3]
  - @blocksuite/global@0.17.13

## 0.17.12

### Patch Changes

- c334c91: - fix(database): remove image column
  - fix: frame preview should update correctly after mode switched
  - refactor: move with-disposable and signal-watcher to global package
  - fix(edgeless): failed to alt clone move frame when it contains container element
  - fix: wrong size limit config
- Updated dependencies [c334c91]
  - @blocksuite/global@0.17.12

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
  - @blocksuite/global@0.17.11

## 0.17.10

### Patch Changes

- e0d0016: - Fix database performance issue
  - Fix frame panel display issue
  - Fix editor settings for color with transparency
  - Fix portal in modals
  - Fix group selection rendering delay
  - Remove unused and duplicated code
  - Improve frame model
  - Improve ParseDocUrl service
  - Support custom max zoom
- Updated dependencies [e0d0016]
  - @blocksuite/global@0.17.10

## 0.17.9

### Patch Changes

- 5f29800: - Fix latex issues
  - Fix inline embed gap
  - Fix edgeless text color
  - Fix outline panel note status
  - Improve mindmap
  - Add sideEffects: false to all packages
  - Add parse url service
  - Add ref node slots extension
- Updated dependencies [5f29800]
  - @blocksuite/global@0.17.9

## 0.17.8

### Patch Changes

- 2f7dbe9: - feat(database): easy access to property visibility
  - fix: mind map issues
  - feat(database): supports switching view types
  - fix(blocks): should use cardStyle for rendering
  - test: add mini-mindmap test
  - feat(database): full width POC
- Updated dependencies [2f7dbe9]
  - @blocksuite/global@0.17.8

## 0.17.7

### Patch Changes

- 5ab06c3: - Peek view as extension
  - Editor settings as extension
  - Edit props store as extension
  - Notifications as extension
  - Fix mini mindmap get service error
  - Fix generating placeholder style
  - Fix brush menu settings
  - Fix brush element line width
  - Fix edgeless preview pointer events
  - Fix latex editor focus shake
- Updated dependencies [5ab06c3]
  - @blocksuite/global@0.17.7

## 0.17.6

### Patch Changes

- d8d5656: - Fix latex block export
  - Fix rich text reference config export
  - Fix mindmap export dependency error
  - Fix toast position
  - Fix frame remember settings
  - Database statistic improvements
  - Add keymap extension
- Updated dependencies [d8d5656]
  - @blocksuite/global@0.17.6

## 0.17.5

### Patch Changes

- debf65c: - Fix latex export
  - Fix add group in database kanban view
  - Fix presentation mode `Esc` key
  - Fix url parse and paste for block reference
  - Frame improvement
  - Database checkbox statistics improvement
  - Inline extensions
  - Mindmap remember last settings
- Updated dependencies [debf65c]
  - @blocksuite/global@0.17.5

## 0.17.4

### Patch Changes

- 9978a71: Create git tag
- Updated dependencies [9978a71]
  - @blocksuite/global@0.17.4

## 0.17.3

### Patch Changes

- be60caf: Generate git tag
- Updated dependencies [be60caf]
  - @blocksuite/global@0.17.3

## 0.17.2

### Patch Changes

- 5543e32: Fix missing export in dataview
- Updated dependencies [5543e32]
  - @blocksuite/global@0.17.2

## 0.17.1

### Patch Changes

- 21b5d47: BlockSuite 0.17.1

  Add @blocksuite/data-view package.
  Make font loader an extension.
  Frame improvement.
  Fix missing xywh when copy/paste mind map.
  Fix connector label text.

- Updated dependencies [21b5d47]
  - @blocksuite/global@0.17.1

## 0.17.0

### Minor Changes

- 767180a: BlockSuite 0.17.0

  ## New features:

  - Add lock/unlock feature for frame.
  - Add inline latex and latex block.
  - Block level reference support.
  - DI and Universal extension API.
  - Mindmap import.

  ## Improvements:

  - Focus & Blur status for multiple editors.
  - Mindmap polish.
  - Database issue fix.
  - Performance improvement.
  - Notion import improvement.
  - A bunch of bug fixes.
  - Better project structure.

### Patch Changes

- Updated dependencies [767180a]
  - @blocksuite/global@0.17.0
