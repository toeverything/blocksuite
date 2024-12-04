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

bump

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
