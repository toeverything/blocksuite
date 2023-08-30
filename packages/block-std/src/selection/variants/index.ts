export * from './block.js';
export * from './surface.js';
export * from './text.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace BlockSuite {
    type SelectionType = keyof Selection;

    type SelectionInstance = {
      [P in SelectionType]: InstanceType<Selection[P]>;
    };
  }
}
