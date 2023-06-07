/**
 * This file should be pure, which means cannot modify global environment
 *  and couldn't cause differ between server and browser.
 *
 * Simply put, `import '@blocksuite/blocks/std.ts'` should work well in the Next.js
 */
export * from './block-range.js';
export * from './common-operations.js';
export * from './drag-and-drop.js';
export * from './event.js';
export * from './filesys.js';
export * from './hotkey.js';
export * from './query.js';
export * from './rect.js';
export * from './reordering.js';
export * from './selection.js';
// Compat with SSR
export * from './std.js';
export * from './types.js';
