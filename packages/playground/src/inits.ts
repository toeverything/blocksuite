import { createEditor } from '@blocksuite/editor';
import type { BaseBlockModel, Space, Store } from '@blocksuite/store';
import { addEverythingToPage } from './addEverythingToPage';
import { init } from './init-helper';

export type PlaygroundInitContext = {
  store: Store;
  blockSchema: Record<string, typeof BaseBlockModel>;
};

type InitFn = (ctx: PlaygroundInitContext) => Space;

export type PlaygroundInit = {
  setup: InitFn;
};

const initEmptySpaceAndEditor = (
  spaceName: string,
  { store, blockSchema }: PlaygroundInitContext
): Space => {
  const space = store.createSpace(spaceName).register(blockSchema);
  const editor = createEditor(space);
  document.body.appendChild(editor);
  return space;
};

declare global {
  /** Specified in BlockSuite playground via `?init=value` using */
  type BlockSuitePlaygroundInitKey = keyof typeof inits;
}

function createInit(setup: InitFn): PlaygroundInit {
  return { setup };
}

/** Loaded via `?init={id}` */
export const inits = {
  /** page-test is what you usually want to use when you do all the init in the e2e tests */
  'page-test': createInit(ctx => initEmptySpaceAndEditor('page-test', ctx)),
  'empty-list-test': createInit(ctx => {
    const space = initEmptySpaceAndEditor('init-empty-list-test', ctx);

    init
      .fromSpace(space)
      .addPage({})
      .addChild('affine:group')
      .self(group => {
        for (let i = 0; i < 3; i++) {
          group.addChild('affine:list');
        }
      });

    return space;
  }),
  everything: createInit(ctx => {
    const space = initEmptySpaceAndEditor('init-everything', ctx);

    init
      .fromSpace(space)
      .addPage({ title: 'Everything' })
      .self(page => {
        addEverythingToPage(page.model);
      });

    return space;
  }),
};
