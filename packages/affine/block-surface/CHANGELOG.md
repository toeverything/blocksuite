# @blocksuite/affine-block-surface

## 0.19.5

### Patch Changes

- d2a3eb7: Release patch version.

  ## Feat

  - feat: add telemetry event for drop linked doc (#9028)
  - feat(blocks): html adapter skip surface block children when doc mode (#9027)
  - feat(blocks): add markdown adapter for surface elements (#9017)

  ## Fix

  - fix: padding of toggle button (#9024)
  - fix(blocks): remove lit dependency from theme service (#9025)
  - fix(blocks): remove lit dependency from theme service (#9023)
  - fix: keyboard controller should attach event on document (#8801)

  ## Chore

  - chore: use surface block flavour in adapter (#9022)
  - chore(playground): bump pdf-viewer v0.1.1 (#9020)

- Updated dependencies [d2a3eb7]
  - @blocksuite/affine-components@0.19.5
  - @blocksuite/affine-model@0.19.5
  - @blocksuite/affine-shared@0.19.5
  - @blocksuite/block-std@0.19.5
  - @blocksuite/global@0.19.5
  - @blocksuite/inline@0.19.5
  - @blocksuite/store@0.19.5

## 0.19.4

### Patch Changes

- 8ae61d6: Improves edgeless viewport stability

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

- Updated dependencies [8ae61d6]
  - @blocksuite/affine-components@0.19.4
  - @blocksuite/affine-model@0.19.4
  - @blocksuite/affine-shared@0.19.4
  - @blocksuite/block-std@0.19.4
  - @blocksuite/global@0.19.4
  - @blocksuite/inline@0.19.4
  - @blocksuite/store@0.19.4

## 0.19.3

### Patch Changes

- 59e0cd6: Release patch version.

  ## Feat

  - feat(edgeless): mind map collapse (#8905)
  - feat(blocks): add plain text adapter for mind map element (#9006)
  - feat(edgeless): add views and event support for canvas elements (#8882)
  - feat(edgeless): improve local element support (#8869)

  ## Fix

  - fix: drag doc from affine to edgeless (#9011)
  - fix: mind map opacity (#9010)
  - fix: should only generate new id when cross doc (#9009)

  ## Perf

  - perf(std): add cache for gfx viewport (#9003)

- Updated dependencies [59e0cd6]
  - @blocksuite/affine-components@0.19.3
  - @blocksuite/affine-model@0.19.3
  - @blocksuite/affine-shared@0.19.3
  - @blocksuite/block-std@0.19.3
  - @blocksuite/global@0.19.3
  - @blocksuite/inline@0.19.3
  - @blocksuite/store@0.19.3

## 0.19.2

### Patch Changes

- bc04f27: ## Feat

  - feat: support heading toggle (#8829)
  - feat(blocks): add surface element plain text adapter (#8977)
  - feat: add doc display meta extension (#8953)

  ## Fix

  - fix(blocks): incorrect image icon in keyboard tool panel (#8998)
  - fix(inline): incorrect caret position in safari when using IME (#8993)
  - fix(blocks): toolbar color should be light when app theme is light and edgeless theme is dark (#8996)
  - fix: dnd in edgeless (#8995)
  - fix: dnd status error (#8994)
  - fix(blocks): the width of the card view is not fully filled (#8988)
  - fix(blocks): prevent hiding keyboard when scrolling (#8989)

- Updated dependencies [bc04f27]
  - @blocksuite/affine-components@0.19.2
  - @blocksuite/affine-model@0.19.2
  - @blocksuite/affine-shared@0.19.2
  - @blocksuite/block-std@0.19.2
  - @blocksuite/global@0.19.2
  - @blocksuite/inline@0.19.2
  - @blocksuite/store@0.19.2

## 0.19.1

### Patch Changes

- ded71c4: chore: release blocksuite

  ## Feat

  - feat(edgeless): release frame by clicking ungroup button (#8984)

  ## Fix

  - fix(edgeless): new inner frame should be inside parent frame (#8985)
  - fix(inline): range in different document (#8986)
  - fix(blocks): focus ai input after position updated (#8981)
  - fix(edgeless): export template job and image upload api (#8980)
  - fix: preview won't disappear after drag end (#8979)
  - fix: corner cases of dnd (#8978)
  - fix(blocks): doc link import/export handling (#8976)

  ## Chore

  - chore(blocks): add image file upload entries to keyboard toolbar (#8987)
  - chore(blocks): set readonly to database on mobile (#8975)
  - chore: lock file maintenance (#8983)
  - chore: lock file maintenance (#8982)
  - chore: remove legacy versions in transformer and adapter (#8974)

- Updated dependencies [ded71c4]
  - @blocksuite/affine-components@0.19.1
  - @blocksuite/affine-model@0.19.1
  - @blocksuite/affine-shared@0.19.1
  - @blocksuite/block-std@0.19.1
  - @blocksuite/global@0.19.1
  - @blocksuite/inline@0.19.1
  - @blocksuite/store@0.19.1

## 0.19.0

### Minor Changes

- d7ec057: Blocksuite minor release.

  ## Feat

  - feat: enable new dnd by default (#8970)
  - feat: should insert bookmark when drop frame and group (#8969)
  - feat(blocks): add block adapters for note block (#8963)

  ## Fix

  - fix: note dnd preview (#8968)
  - fix: attachment, bookmark and embed blocks should be draggable (#8967)
  - fix: should copy embed doc when dnd (#8966)
  - fix(std): undefined editor during rect polling on mobile (#8965)
  - fix(blocks): fix incorrect font family in mobile widgets (#8961)
  - fix(blocks): at menu styles (#8962)

  ## Refactor

  - refactor: optimize code of new drag event watcher (#8971)
  - refactor(playground): remove `mockPeekViewExtension` (#8964)

### Patch Changes

- Updated dependencies [d7ec057]
  - @blocksuite/affine-components@0.19.0
  - @blocksuite/affine-model@0.19.0
  - @blocksuite/affine-shared@0.19.0
  - @blocksuite/block-std@0.19.0
  - @blocksuite/global@0.19.0
  - @blocksuite/inline@0.19.0
  - @blocksuite/store@0.19.0

## 0.18.7

### Patch Changes

- 1057773: Blocksuite patch release.

  ## Feat

  - feat(edgeless): rewrite mind map drag indicator (#8805)
  - feat: remove data transfer from dnd api (#8955)

  ## Fix

  - fix: dnd from entity api (#8958)
  - fix(std): edge case on pointer controller (#8954)
  - fix: indent behavior (#8941)
  - fix(edgeless): add index reorder buttong for frame block (#8951)

  ## Chore

  - chore: run headless vitest locally by default (#8957)
  - chore(blocks): disable image peekview on mobile (#8952)

  ## Refactor

  - refactor(database): refactor addRow functionality in kanban and table views (#8956)
  - refactor: notion html adapter (#8947)

- Updated dependencies [1057773]
  - @blocksuite/affine-components@0.18.7
  - @blocksuite/affine-model@0.18.7
  - @blocksuite/affine-shared@0.18.7
  - @blocksuite/block-std@0.18.7
  - @blocksuite/global@0.18.7
  - @blocksuite/inline@0.18.7
  - @blocksuite/store@0.18.7

## 0.18.6

### Patch Changes

- d925364: Blocksuite patch release.

  ## Feat

  - feat: add from entity api for dnd (#8946)
  - feat: make block to snapshot a sync method (#8943)
  - feat(database): enhance filter functionality with default values (#8932)
  - feat: bring back the ability to drag blocks from note to edgeless (#8914)
  - feat(blocks): responsive ui for embed doc (#8900)
  - feat(edgeless): unlock and unlock button (#8826)
  - feat(edgeless): impl lock interface for edgeless element and block (#8825)
  - feat(edgeless): add lock property to edgeless block and element (#8824)
  - feat(blocks): support embed linked doc and synced doc html block adapter (#8907)
  - feat(blocks): support database html block adapter (#8898)

  ## Fix

  - fix(blocks): inconsistent language list behavior on hover in Firefox (#8944)
  - fix(database): adjust detail panel layout for better responsiveness (#8945)
  - fix(database): move cursor in kanban card title by arrow keys (#8893)
  - fix(blocks): show keyboard toolbar when focus on title and hide on scrolling (#8939)
  - fix(blocks): missing aliases when duplicating linked doc block on edgeless (#8930)
  - fix: remove vitest extension from recommendation list (#8936)
  - fix(blocks): should prevent default if drop event is handled (#8929)
  - fix(blocks): missing aliases when converting from embed to card (#8928)
  - fix(blocks): should show original doc title when hovering title button (#8925)
  - fix(blocks): hide the thumb for bookmark if its width is less than 375 (#8922)
  - fix(blocks): button styling when disabled on embed card edit popup (#8924)
  - fix(edgeless): undefined telemetry service (#8918)
  - fix(database): add group call frequency is incorrect (#8916)
  - fix(database): adjust padding for mobile menu to accommodate safe area insets (#8915)

  ## Chore

  - chore(edgeless): telemetry for edgeless lock feature (#8933)
  - chore(blocks): use rest params in parsed result (#8908)
  - chore: lock file maintenance (#8919)
  - chore: lock file maintenance (#8894)

  ## Refactor

  - refactor: adapter types and utils (#8934)
  - refactor: make notion text adapter as an extension (#8926)

  ## Perf

  - perf(std): cache dom rect for pointer controller (#8940)

  ## Test

  - test(database): add sorting functionality tests for multiple rules (#8917)
  - test(edgeless): fix lock flaky test by adding waitNextFrame (#8937)
  - test(edgeless): edgeless element lock feature tests (#8867)

- Updated dependencies [d925364]
  - @blocksuite/affine-components@0.18.6
  - @blocksuite/affine-model@0.18.6
  - @blocksuite/affine-shared@0.18.6
  - @blocksuite/block-std@0.18.6
  - @blocksuite/global@0.18.6
  - @blocksuite/inline@0.18.6
  - @blocksuite/store@0.18.6

## 0.18.5

### Patch Changes

- ec2956c: ## Feat

  - feat: api for encode and decode dnd data (#8909)
  - feat(blocks): add event tracking for linked doc (#8876)
  - feat(playground): outside click to close docs panel (#8885)

  ## Fix

  - fix(store): fix awareness destroy (#8904)
  - fix: switch card view style does not work (#8886)
  - fix: no need to save aliases on embed synced doc model (#8884)
  - fix: should differentiate between internal and external links when pasting links (#8896)
  - fix(presets): incorrectly adding page root widgets to edgeless (#8897)
  - fix: sentry-0f7fafa98f7c483ca95c04c188f485b8 (#8892)
  - fix: sentry-2d6423fce9c242ec9e63364243a6cf59 (#8891)
  - fix: sentry-d6ecba020e5047e394de05bf0ff77e71 (#8890)
  - fix: sentry-6d40eee6cbcd4704bb2dff3d5347544c (#8889)
  - fix: sentry-f25281abb20a4260aa424741c30e5756 (#8888)
  - fix(playground): starter debug menu theming (#8883)
  - fix(playground): adapt docs panel to dark mode (#8881)
  - fix: should show alias icon when title has alias (#8880)

  ## Chore

  - chore: lock file maintenance (#8895)

  ## Refactor

  - refactor(playground): remove redundant doc init logic (#8906)

- Updated dependencies [ec2956c]
  - @blocksuite/affine-components@0.18.5
  - @blocksuite/affine-model@0.18.5
  - @blocksuite/affine-shared@0.18.5
  - @blocksuite/block-std@0.18.5
  - @blocksuite/global@0.18.5
  - @blocksuite/inline@0.18.5
  - @blocksuite/store@0.18.5

## 0.18.4

### Patch Changes

- f517653: Edgeless perf improvement, linked doc aliases support and fixes

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

- Updated dependencies [f517653]
  - @blocksuite/affine-components@0.18.4
  - @blocksuite/affine-model@0.18.4
  - @blocksuite/affine-shared@0.18.4
  - @blocksuite/block-std@0.18.4
  - @blocksuite/global@0.18.4
  - @blocksuite/inline@0.18.4
  - @blocksuite/store@0.18.4

## 0.18.3

### Patch Changes

- 3448094: ## Fix

  - fix(database): storage should be accessed via globalThis (#8863)
  - fix(edgeless): memory leak in edgeless widgets (#8862)
  - fix: page switching under starter route (#8860)

  ## Refactor

  - refactor(blocks): shadowless keyboard toolbar (#8864)

- Updated dependencies [3448094]
  - @blocksuite/affine-components@0.18.3
  - @blocksuite/affine-model@0.18.3
  - @blocksuite/affine-shared@0.18.3
  - @blocksuite/block-std@0.18.3
  - @blocksuite/global@0.18.3
  - @blocksuite/inline@0.18.3
  - @blocksuite/store@0.18.3

## 0.18.2

### Patch Changes

- f97c4ab: bump

  ## Feat

  - feat(database): date-picker add clear button (#8856)
  - feat(blocks): add plain text block adapter for linked and synced doc block (#8848)
  - feat: generate url service (#8813)
  - feat(blocks): add plain text block adapter for latex (#8845)
  - feat(blocks): provide a mobile spec patches (#8836)
  - feat(blocks): add plain text block adapter for embed link block (#8843)
  - feat(blocks): add support for non consecutive list in adapter (#8802)
  - feat(playground): add an adpater panel to playground (#8841)
  - feat(database): store current view id in local-storage (#8838)

  ## Fix

  - fix: dispose model update listeners (#8857)
  - fix: memory leak in zero width block (#8855)
  - fix: block selection memory leak (#8854)
  - fix(store): add dispose method to collection (#8852)
  - fix(playground): cannot click docs panel doc (#8850)
  - fix(edgeless): widget memory leak (#8853)
  - fix: memory leak on switching from doc to edgeless (#8851)
  - fix(database): multiple spaces in the title are displayed as a single space (#8839)
  - fix(store): add shim.d.ts to files (#8834)
  - fix(blocks): should paste text content as note on edgeless when copy from doc mode (#8827)
  - fix(blocks): peek db doc should also pass the dbs doc id (#8818)
  - fix: background color and width of input in color picker (#8822)
  - fix(blocks): newline handling in MixTextAdapter and paste middleware (#8821)

  ## Chore

  - chore(blocks): update code block styles (#8847)
  - chore: lock file maintenance (#8835)
  - chore(blocks): bump theme (#8849)

  ## Refactor

  - refactor(edgeless): adjust logic of dragging selection (#8842)
  - refactor(database): make Tag-Select component compatible with mobile devices (#8844)
  - refactor(database): make Date-Picker component compatible with mobile devices (#8846)
  - refactor: migrate plain text adapter to extension (#8831)
  - refactor: markdown adapter (#8798)
  - refactor(edgeless): extract side effects of edgeless element toolbar (#8828)
  - refactor(edgeless): refine and remove duplicate type (#8823)

- Updated dependencies [f97c4ab]
  - @blocksuite/affine-components@0.18.2
  - @blocksuite/affine-model@0.18.2
  - @blocksuite/affine-shared@0.18.2
  - @blocksuite/block-std@0.18.2
  - @blocksuite/global@0.18.2
  - @blocksuite/inline@0.18.2
  - @blocksuite/store@0.18.2

## 0.18.1

### Patch Changes

- e2d574c: ## Feat

  - feat: new doc dnd (#8808)

  ## Fix

  - fix(database): row selection is incorrect when clicking the row options button (#8817)
  - fix(blocks): notion html import nested list with nested paragraph (#8809)
  - fix(edgeless): connector endpoint may be null (#8804)
  - fix(edgeless): connector selected rect width and height is zero (#8803)
  - fix(blocks): linked popover styles (#8799)

  ## Chore

  - chore: lock file maintenance (#8797)

  ## Refactor

  - refactor(database): make Kanban View compatible with mobile devices (#8807)
  - refactor: extract toggle button in list block (#8795)

- Updated dependencies [e2d574c]
  - @blocksuite/affine-components@0.18.1
  - @blocksuite/affine-model@0.18.1
  - @blocksuite/affine-shared@0.18.1
  - @blocksuite/block-std@0.18.1
  - @blocksuite/global@0.18.1
  - @blocksuite/inline@0.18.1
  - @blocksuite/store@0.18.1

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
  - @blocksuite/affine-components@0.18.0
  - @blocksuite/affine-model@0.18.0
  - @blocksuite/affine-shared@0.18.0
  - @blocksuite/block-std@0.18.0
  - @blocksuite/global@0.18.0
  - @blocksuite/inline@0.18.0
  - @blocksuite/store@0.18.0

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
  - @blocksuite/affine-components@0.17.33
  - @blocksuite/affine-model@0.17.33
  - @blocksuite/affine-shared@0.17.33
  - @blocksuite/block-std@0.17.33
  - @blocksuite/global@0.17.33
  - @blocksuite/inline@0.17.33
  - @blocksuite/store@0.17.33

## 0.17.32

### Patch Changes

- 7bc83ab: ## Fix

  - fix: mind map text layout (#8737)

- Updated dependencies [7bc83ab]
  - @blocksuite/affine-components@0.17.32
  - @blocksuite/affine-model@0.17.32
  - @blocksuite/affine-shared@0.17.32
  - @blocksuite/block-std@0.17.32
  - @blocksuite/global@0.17.32
  - @blocksuite/inline@0.17.32
  - @blocksuite/store@0.17.32

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
  - @blocksuite/affine-components@0.17.31
  - @blocksuite/affine-model@0.17.31
  - @blocksuite/affine-shared@0.17.31
  - @blocksuite/block-std@0.17.31
  - @blocksuite/global@0.17.31
  - @blocksuite/inline@0.17.31
  - @blocksuite/store@0.17.31

## 0.17.30

### Patch Changes

- 5c327c8: ## Fix

  - fix(database): title linked-doc convert logic (#8734)
  - fix(blocks): pdf embed view overflow (#8733)

- Updated dependencies [5c327c8]
  - @blocksuite/affine-components@0.17.30
  - @blocksuite/affine-model@0.17.30
  - @blocksuite/affine-shared@0.17.30
  - @blocksuite/block-std@0.17.30
  - @blocksuite/global@0.17.30
  - @blocksuite/inline@0.17.30
  - @blocksuite/store@0.17.30

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
  - @blocksuite/affine-components@0.17.29
  - @blocksuite/affine-model@0.17.29
  - @blocksuite/affine-shared@0.17.29
  - @blocksuite/block-std@0.17.29
  - @blocksuite/global@0.17.29
  - @blocksuite/inline@0.17.29
  - @blocksuite/store@0.17.29

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
  - @blocksuite/affine-components@0.17.28
  - @blocksuite/affine-model@0.17.28
  - @blocksuite/affine-shared@0.17.28
  - @blocksuite/block-std@0.17.28
  - @blocksuite/global@0.17.28
  - @blocksuite/inline@0.17.28
  - @blocksuite/store@0.17.28

## 0.17.27

### Patch Changes

- f70b950: fix: color of canvas element under embed dark theme whiteboard is wrong (#8677)

  ## Fix

  - fix: color of canvas element under embed dark theme whiteboard is wrong (#8677)
  - fix(edgeless): tool controller potential problem (#8675)
  - fix: typeError: f.\_def.innerType.shape[e] is undefined (#8676)
  - fix: whiteboard is first loaded, size of the linked doc card is scaled to wrong size (#8674)

- Updated dependencies [f70b950]
  - @blocksuite/affine-components@0.17.27
  - @blocksuite/affine-model@0.17.27
  - @blocksuite/affine-shared@0.17.27
  - @blocksuite/block-std@0.17.27
  - @blocksuite/global@0.17.27
  - @blocksuite/inline@0.17.27
  - @blocksuite/store@0.17.27

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
  - @blocksuite/affine-components@0.17.26
  - @blocksuite/affine-model@0.17.26
  - @blocksuite/affine-shared@0.17.26
  - @blocksuite/block-std@0.17.26
  - @blocksuite/global@0.17.26
  - @blocksuite/inline@0.17.26
  - @blocksuite/store@0.17.26

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
  - @blocksuite/affine-components@0.17.25
  - @blocksuite/affine-model@0.17.25
  - @blocksuite/affine-shared@0.17.25
  - @blocksuite/block-std@0.17.25
  - @blocksuite/global@0.17.25
  - @blocksuite/inline@0.17.25
  - @blocksuite/store@0.17.25

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
  - @blocksuite/affine-components@0.17.24
  - @blocksuite/affine-model@0.17.24
  - @blocksuite/affine-shared@0.17.24
  - @blocksuite/block-std@0.17.24
  - @blocksuite/global@0.17.24
  - @blocksuite/inline@0.17.24
  - @blocksuite/store@0.17.24

## 0.17.23

### Patch Changes

- dc63724: ## Feat

  - feat: support edgeless theme (#8624)

  ## Fix

  - fix(inline): get text format from left delta by default when it is collapsed (#8615)

- Updated dependencies [dc63724]
  - @blocksuite/affine-components@0.17.23
  - @blocksuite/affine-model@0.17.23
  - @blocksuite/affine-shared@0.17.23
  - @blocksuite/block-std@0.17.23
  - @blocksuite/global@0.17.23
  - @blocksuite/inline@0.17.23
  - @blocksuite/store@0.17.23

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
  - @blocksuite/affine-components@0.17.22
  - @blocksuite/affine-model@0.17.22
  - @blocksuite/affine-shared@0.17.22
  - @blocksuite/block-std@0.17.22
  - @blocksuite/global@0.17.22
  - @blocksuite/inline@0.17.22
  - @blocksuite/store@0.17.22

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
  - @blocksuite/affine-components@0.17.21
  - @blocksuite/affine-model@0.17.21
  - @blocksuite/affine-shared@0.17.21
  - @blocksuite/block-std@0.17.21
  - @blocksuite/global@0.17.21
  - @blocksuite/inline@0.17.21
  - @blocksuite/store@0.17.21

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
  - @blocksuite/affine-components@0.17.20
  - @blocksuite/affine-model@0.17.20
  - @blocksuite/affine-shared@0.17.20
  - @blocksuite/block-std@0.17.20
  - @blocksuite/global@0.17.20
  - @blocksuite/inline@0.17.20
  - @blocksuite/store@0.17.20

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
  - @blocksuite/affine-components@0.17.11
  - @blocksuite/affine-model@0.17.11
  - @blocksuite/affine-shared@0.17.11
  - @blocksuite/block-std@0.17.11
  - @blocksuite/global@0.17.11
  - @blocksuite/inline@0.17.11
  - @blocksuite/store@0.17.11

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
  - @blocksuite/affine-components@0.17.10
  - @blocksuite/affine-model@0.17.10
  - @blocksuite/affine-shared@0.17.10
  - @blocksuite/block-std@0.17.10
  - @blocksuite/global@0.17.10
  - @blocksuite/store@0.17.10

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
  - @blocksuite/affine-components@0.17.9
  - @blocksuite/affine-model@0.17.9
  - @blocksuite/affine-shared@0.17.9
  - @blocksuite/block-std@0.17.9
  - @blocksuite/global@0.17.9
  - @blocksuite/store@0.17.9

## 0.17.8

### Patch Changes

- 2f7dbe9: - feat(database): easy access to property visibility
  - fix: mind map issues
  - feat(database): supports switching view types
  - fix(blocks): should use cardStyle for rendering
  - test: add mini-mindmap test
  - feat(database): full width POC
- Updated dependencies [2f7dbe9]
  - @blocksuite/affine-components@0.17.8
  - @blocksuite/affine-model@0.17.8
  - @blocksuite/affine-shared@0.17.8
  - @blocksuite/block-std@0.17.8
  - @blocksuite/global@0.17.8
  - @blocksuite/store@0.17.8

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
  - @blocksuite/affine-components@0.17.7
  - @blocksuite/affine-model@0.17.7
  - @blocksuite/affine-shared@0.17.7
  - @blocksuite/block-std@0.17.7
  - @blocksuite/global@0.17.7
  - @blocksuite/store@0.17.7

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
  - @blocksuite/affine-components@0.17.6
  - @blocksuite/affine-model@0.17.6
  - @blocksuite/affine-shared@0.17.6
  - @blocksuite/block-std@0.17.6
  - @blocksuite/global@0.17.6
  - @blocksuite/store@0.17.6

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
  - @blocksuite/affine-components@0.17.5
  - @blocksuite/affine-model@0.17.5
  - @blocksuite/affine-shared@0.17.5
  - @blocksuite/block-std@0.17.5
  - @blocksuite/global@0.17.5
  - @blocksuite/store@0.17.5

## 0.17.4

### Patch Changes

- 9978a71: Create git tag
- Updated dependencies [9978a71]
  - @blocksuite/affine-components@0.17.4
  - @blocksuite/affine-model@0.17.4
  - @blocksuite/affine-shared@0.17.4
  - @blocksuite/block-std@0.17.4
  - @blocksuite/global@0.17.4
  - @blocksuite/store@0.17.4

## 0.17.3

### Patch Changes

- be60caf: Generate git tag
- Updated dependencies [be60caf]
  - @blocksuite/affine-components@0.17.3
  - @blocksuite/affine-model@0.17.3
  - @blocksuite/affine-shared@0.17.3
  - @blocksuite/block-std@0.17.3
  - @blocksuite/global@0.17.3
  - @blocksuite/store@0.17.3

## 0.17.2

### Patch Changes

- 5543e32: Fix missing export in dataview
- Updated dependencies [5543e32]
  - @blocksuite/affine-components@0.17.2
  - @blocksuite/affine-model@0.17.2
  - @blocksuite/affine-shared@0.17.2
  - @blocksuite/block-std@0.17.2
  - @blocksuite/global@0.17.2
  - @blocksuite/store@0.17.2

## 0.17.1

### Patch Changes

- 21b5d47: BlockSuite 0.17.1

  Add @blocksuite/data-view package.
  Make font loader an extension.
  Frame improvement.
  Fix missing xywh when copy/paste mind map.
  Fix connector label text.

- Updated dependencies [21b5d47]
  - @blocksuite/affine-components@0.17.1
  - @blocksuite/affine-model@0.17.1
  - @blocksuite/affine-shared@0.17.1
  - @blocksuite/block-std@0.17.1
  - @blocksuite/global@0.17.1
  - @blocksuite/store@0.17.1

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
  - @blocksuite/affine-components@0.17.0
  - @blocksuite/affine-model@0.17.0
  - @blocksuite/affine-shared@0.17.0
  - @blocksuite/block-std@0.17.0
  - @blocksuite/global@0.17.0
  - @blocksuite/store@0.17.0
