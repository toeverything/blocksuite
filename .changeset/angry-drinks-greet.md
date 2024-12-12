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

Blocksuite patch release.

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
