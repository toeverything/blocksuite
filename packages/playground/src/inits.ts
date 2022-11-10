import { createEditor } from '@blocksuite/editor';
import type { BaseBlockModel, Space, Store } from '@blocksuite/store';

export type PlaygroundInitContext = {
  store: Store;
  blockSchema: Record<string, typeof BaseBlockModel>;
};

type InitFn = (ctx: PlaygroundInitContext) => Space;

export type PlaygroundInit = {
  setup: InitFn;
};

const initEmptySpaceAndEditor =
  (spaceName: string): InitFn =>
  ({ store, blockSchema }) => {
    const space = store.createSpace(spaceName).register(blockSchema);
    const editor = createEditor(space);
    document.body.appendChild(editor);
    return space;
  };

/** Loaded via `?init={id}` */
export const inits = {
  'page-test': createInit(initEmptySpaceAndEditor('page-test')),
  list: createInit(ctx => {
    const space = initEmptySpaceAndEditor('init-list')(ctx);

    const pageId = space.addBlock({ flavour: 'affine:page' });
    const groupId = space.addBlock({ flavour: 'affine:group' }, pageId);
    for (let i = 0; i < 3; i++) {
      space.addBlock({ flavour: 'affine:list' }, groupId);
    }

    return space;
  }),
};

declare global {
  /** Specified in BlockSuite playground via `?init=value` using */
  type BlockSuitePlaygroundInitKey = keyof typeof inits;
}

function createInit(setup: InitFn): PlaygroundInit {
  return { setup };
}
