export * from './block-crud/index.js';
export * from './model-crud/index.js';
export * from './selection/index.js';
export * from './text-crud/index.js';
export * from './with-root.js';

declare global {
  namespace BlockSuite {
    // if we use `with` or `inline` to add command data either then use a command we
    // need to update this interface
    interface CommandData {
      currentSelectionPath?: string[];
    }
  }
}
