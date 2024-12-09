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
