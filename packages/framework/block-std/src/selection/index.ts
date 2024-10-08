import type {
  BlockSelection,
  CursorSelection,
  SurfaceSelection,
  TextSelection,
} from './variants/index.js';

export * from './base.js';
export * from './manager.js';
export * from './variants/index.js';

declare global {
  namespace BlockSuite {
    interface Selection {
      block: typeof BlockSelection;
      cursor: typeof CursorSelection;
      surface: typeof SurfaceSelection;
      text: typeof TextSelection;
    }

    type SelectionType = keyof Selection;

    type SelectionInstance = {
      [P in SelectionType]: InstanceType<Selection[P]>;
    };
  }
}
