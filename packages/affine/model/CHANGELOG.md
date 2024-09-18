# @blocksuite/affine-model

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
  - @blocksuite/block-std@0.17.10
  - @blocksuite/global@0.17.10
  - @blocksuite/inline@0.17.10
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
  - @blocksuite/block-std@0.17.9
  - @blocksuite/global@0.17.9
  - @blocksuite/inline@0.17.9
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
  - @blocksuite/block-std@0.17.8
  - @blocksuite/global@0.17.8
  - @blocksuite/inline@0.17.8
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
  - @blocksuite/block-std@0.17.7
  - @blocksuite/global@0.17.7
  - @blocksuite/inline@0.17.7
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
  - @blocksuite/block-std@0.17.6
  - @blocksuite/global@0.17.6
  - @blocksuite/inline@0.17.6
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
  - @blocksuite/block-std@0.17.5
  - @blocksuite/global@0.17.5
  - @blocksuite/inline@0.17.5
  - @blocksuite/store@0.17.5

## 0.17.4

### Patch Changes

- 9978a71: Create git tag
- Updated dependencies [9978a71]
  - @blocksuite/block-std@0.17.4
  - @blocksuite/global@0.17.4
  - @blocksuite/inline@0.17.4
  - @blocksuite/store@0.17.4

## 0.17.3

### Patch Changes

- be60caf: Generate git tag
- Updated dependencies [be60caf]
  - @blocksuite/block-std@0.17.3
  - @blocksuite/global@0.17.3
  - @blocksuite/inline@0.17.3
  - @blocksuite/store@0.17.3

## 0.17.2

### Patch Changes

- 5543e32: Fix missing export in dataview
- Updated dependencies [5543e32]
  - @blocksuite/block-std@0.17.2
  - @blocksuite/global@0.17.2
  - @blocksuite/inline@0.17.2
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
  - @blocksuite/block-std@0.17.1
  - @blocksuite/global@0.17.1
  - @blocksuite/inline@0.17.1
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
  - @blocksuite/block-std@0.17.0
  - @blocksuite/global@0.17.0
  - @blocksuite/inline@0.17.0
  - @blocksuite/store@0.17.0
