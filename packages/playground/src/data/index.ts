/**
 * Manually create initial page structure.
 * In collaboration mode or on page refresh with local persistence,
 * the page structure will be automatically loaded from provider.
 * In these cases, these functions should not be called.
 */

export * from './database';
export * from './empty';
export * from './heavy';
export * from './heavy-whiteboard';
export * from './multiple-editor';
export * from './preset';
export type { InitFn } from './utils';
