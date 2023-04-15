/**
 * This file should be pure, which means cannot modify global environment
 *  and couldn't cause differ between server and browser.
 *
 * Simply put, `import '@blocksuite/blocks/std.ts'` should work well in the Next.js
 */
export * from './block-range.js';
export * from './common-operations.js';
export * from './filesys.js';
export * from './gesture.js';
export * from './hotkey.js';
export * from './lit.js';
export * from './query.js';
export * from './rect.js';
export * from './selection.js';
// Compat with SSR
// export * from './shortcut.js';
export * from './std.js';
export * from './types.js';
