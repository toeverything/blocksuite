export * from './block.js';
export * from './cursor.js';
export * from './surface.js';
export * from './text.js';

declare global {
  namespace BlockSuite {
    type SelectionType = keyof Selection;

    type SelectionInstance = {
      [P in SelectionType]: InstanceType<Selection[P]>;
    };
  }
}
