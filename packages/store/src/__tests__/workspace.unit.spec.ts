// checkout https://vitest.dev/guide/debugging.html for debugging tests

import { assert, describe, expect, it } from 'vitest';
import {
  BaseBlockModel,
  Signal,
  Workspace,
  Page,
  createAutoIncrementIdGenerator,
} from '..';

// Use manual per-module import/export to support vitest environment on Node.js
import { PageBlockModel } from '../../../blocks/src/page-block/page-model';
import { ParagraphBlockModel } from '../../../blocks/src/paragraph-block/paragraph-model';
import { ListBlockModel } from '../../../blocks/src/list-block/list-model';
import { GroupBlockModel } from '../../../blocks/src/group-block/group-model';
import { DividerBlockModel } from '../../../blocks/src/divider-block/divider-model';
import { PageMeta } from '../workspace/workspace';

function createTestOptions() {
  const idGenerator = createAutoIncrementIdGenerator();
  return { idGenerator };
}

// Create BlockSchema manually
export const BlockSchema = {
  'affine:paragraph': ParagraphBlockModel,
  'affine:page': PageBlockModel,
  'affine:list': ListBlockModel,
  'affine:group': GroupBlockModel,
  'affine:divider': DividerBlockModel,
} as const;

function serialize(page: Page) {
  return page.doc.toJSON();
}

function waitOnce<T>(signal: Signal<T>) {
  return new Promise<T>(resolve => signal.once(val => resolve(val)));
}

async function createRoot(page: Page) {
  queueMicrotask(() => page.addBlock({ flavour: 'affine:page' }));
  const root = await waitOnce(page.signals.rootAdded);
  return root;
}

async function createPage(workspace: Workspace, pageId = 'page0') {
  queueMicrotask(() => workspace.createPage(pageId));
  await waitOnce(workspace.signals.pageAdded);
  return workspace.getPage(pageId);
}

async function createTestPage() {
  const options = createTestOptions();
  const workspace = new Workspace(options).register(BlockSchema);
  const page = await createPage(workspace);
  return page;
}

const defaultPageId = 'page0';
const spaceId = `space:${defaultPageId}`;
const spaceMetaId = 'space:meta';

describe.concurrent('basic', () => {
  it('can init store', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);
    const page = await createPage(workspace);
    const actual = serialize(page);
    const actualPage = actual[spaceMetaId].pages[0] as PageMeta;
    assert.equal(typeof actualPage.createDate, 'number');
    // @ts-ignore
    delete actualPage.createDate;

    assert.deepEqual(actual, {
      [spaceMetaId]: {
        pages: [
          {
            id: 'page0',
            title: '',
            favorite: false,
            trash: false,
            trashDate: null,
          },
        ],
      },
      [spaceId]: {},
    });
  });
});

describe.concurrent('addBlock', () => {
  it('can add single model', async () => {
    const page = await createTestPage();
    page.addBlock({ flavour: 'affine:page' });

    assert.deepEqual(serialize(page)[spaceId], {
      '0': {
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
      },
    });
  });

  it('can set custom idGenerator', async () => {
    const options = {
      ...createTestOptions(),
      idGenerator: (() => {
        const keys = ['7', '100', '2'];
        let i = 0;
        return () => keys[i++];
      })(),
    };
    const workspace = new Workspace(options).register(BlockSchema);
    const page = await createPage(workspace);

    page.addBlock({ flavour: 'affine:page' });
    page.addBlock({ flavour: 'affine:paragraph' });
    page.addBlock({ flavour: 'affine:paragraph' });

    assert.deepEqual(serialize(page)[spaceId], {
      '7': {
        'sys:children': ['100', '2'],
        'sys:flavour': 'affine:page',
        'sys:id': '7',
      },
      '100': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '100',
        'prop:text': '',
        'prop:type': 'text',
      },
      '2': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '2',
        'prop:text': '',
        'prop:type': 'text',
      },
    });
  });

  it('can add model with props', async () => {
    const page = await createTestPage();
    page.addBlock({ flavour: 'affine:page', title: 'hello' });

    assert.deepEqual(serialize(page)[spaceId], {
      '0': {
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'prop:title': 'hello',
      },
    });
  });

  it('can add multi models', async () => {
    const page = await createTestPage();
    page.addBlock({ flavour: 'affine:page' });
    page.addBlock({ flavour: 'affine:paragraph' });

    assert.deepEqual(serialize(page)[spaceId], {
      '0': {
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
      },
      '1': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '1',
        'prop:text': '',
        'prop:type': 'text',
      },
    });
  });

  it('can observe signal events', async () => {
    const page = await createTestPage();

    queueMicrotask(() => page.addBlock({ flavour: 'affine:page' }));
    const block = await waitOnce(page.signals.rootAdded);
    assert.ok(block instanceof BlockSchema['affine:page']);
  });

  it('can add block to root', async () => {
    const page = await createTestPage();

    queueMicrotask(() => page.addBlock({ flavour: 'affine:page' }));
    const root = await waitOnce(page.signals.rootAdded);
    assert.ok(root instanceof BlockSchema['affine:page']);

    page.addBlock({ flavour: 'affine:paragraph' });
    assert.ok(root.children[0] instanceof BlockSchema['affine:paragraph']);
    assert.equal(root.childMap.get('1'), 0);

    const serializedChildren = serialize(page)[spaceId]['0']['sys:children'];
    assert.deepEqual(serializedChildren, ['1']);
    assert.equal(root.children[0].id, '1');
  });

  it('can add and remove multi pages', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchema);

    const page0 = await createPage(workspace, 'page0');
    const page1 = await createPage(workspace, 'page1');

    // @ts-ignore
    assert.equal(workspace._pages.size, 2);

    queueMicrotask(() => {
      workspace.removePage(page0);
      // @ts-ignore
      assert.equal(workspace._pages.size, 1);
      workspace.removePage(page1);
      // @ts-ignore
      assert.equal(workspace._pages.size, 0);
    });
  });

  it('can set page state', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchema);
    workspace.createPage('page0');

    assert.deepEqual(
      workspace.meta.pageMetas.map(
        ({ id, title, favorite, trash, trashDate }) => ({
          id,
          title,
          favorite,
          trash,
          trashDate,
        })
      ),
      [
        {
          id: 'page0',
          title: '',
          favorite: false,
          trash: false,
          trashDate: null,
        },
      ]
    );

    workspace.setPageMeta('page0', { favorite: true });
    assert.deepEqual(
      workspace.meta.pageMetas.map(
        ({ id, title, favorite, trash, trashDate }) => ({
          id,
          title,
          favorite,
          trash,
          trashDate,
        })
      ),
      [
        {
          id: 'page0',
          title: '',
          favorite: true,
          trash: false,
          trashDate: null,
        },
      ]
    );
  });
});

describe.concurrent('deleteBlock', () => {
  it('can delete single model', async () => {
    const page = await createTestPage();

    page.addBlock({ flavour: 'affine:page' });
    assert.deepEqual(serialize(page)[spaceId], {
      '0': {
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
      },
    });

    page.deleteBlockById('0');
    assert.deepEqual(serialize(page)[spaceId], {});
  });

  it('can delete model with parent', async () => {
    const page = await createTestPage();
    const root = await createRoot(page);

    page.addBlock({ flavour: 'affine:paragraph' });

    // before delete
    assert.deepEqual(serialize(page)[spaceId], {
      '0': {
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
      },
      '1': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '1',
        'prop:text': '',
        'prop:type': 'text',
      },
    });

    page.deleteBlock(root.children[0]);

    // after delete
    assert.deepEqual(serialize(page)[spaceId], {
      '0': {
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
      },
    });
    assert.equal(root.children.length, 0);
  });
});

describe.concurrent('getBlock', () => {
  it('can get block by id', async () => {
    const page = await createTestPage();
    const root = await createRoot(page);

    page.addBlock({ flavour: 'affine:paragraph' });
    page.addBlock({ flavour: 'affine:paragraph' });

    const text = page.getBlockById('2') as BaseBlockModel;
    assert.ok(text instanceof BlockSchema['affine:paragraph']);
    assert.equal(root.children.indexOf(text), 1);

    const invalid = page.getBlockById('😅');
    assert.equal(invalid, null);
  });

  it('can get parent', async () => {
    const page = await createTestPage();
    const root = await createRoot(page);

    page.addBlock({ flavour: 'affine:paragraph' });
    page.addBlock({ flavour: 'affine:paragraph' });

    const result = page.getParent(root.children[1]) as BaseBlockModel;
    assert.equal(result, root);

    const invalid = page.getParentById(root.id, root);
    assert.equal(invalid, null);
  });

  it('can get previous sibling', async () => {
    const page = await createTestPage();
    const root = await createRoot(page);

    page.addBlock({ flavour: 'affine:paragraph' });
    page.addBlock({ flavour: 'affine:paragraph' });

    const result = page.getPreviousSibling(root.children[1]) as BaseBlockModel;
    assert.equal(result, root.children[0]);

    const invalid = page.getPreviousSibling(root.children[0]);
    assert.equal(invalid, null);
  });
});

// Inline snapshot is not supported under describe.parallel config
describe('store.toJSXElement works', async () => {
  it('store matches snapshot', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchema);
    const page = await createPage(workspace);

    page.addBlock({ flavour: 'affine:page', title: 'hello' });

    expect(workspace.toJSXElement()).toMatchInlineSnapshot(`
      <affine:page
        prop:title="hello"
      />
    `);
  });

  it('empty store matches snapshot', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchema);
    await createPage(workspace);

    expect(workspace.toJSXElement()).toMatchInlineSnapshot('null');
  });

  it('store with multiple blocks children matches snapshot', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchema);
    const page = await createPage(workspace);

    page.addBlock({ flavour: 'affine:page' });
    page.addBlock({ flavour: 'affine:paragraph' });
    page.addBlock({ flavour: 'affine:paragraph' });

    expect(workspace.toJSXElement()).toMatchInlineSnapshot(/* xml */ `
      <affine:page>
        <affine:paragraph
          prop:type="text"
        />
        <affine:paragraph
          prop:type="text"
        />
      </affine:page>
    `);
  });
});

describe.concurrent('store.search works', async () => {
  it('store search matching', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchema);
    const page = await createPage(workspace);

    page.addBlock({ flavour: 'affine:page', title: 'hello' });

    page.addBlock({
      flavour: 'affine:paragraph',
      text: new page.Text(
        page,
        '英特尔第13代酷睿i7-1370P移动处理器现身Geekbench，14核心和5GHz'
      ),
    });

    page.addBlock({
      flavour: 'affine:paragraph',
      text: new page.Text(
        page,
        '索尼考虑移植《GT赛车7》，又一PlayStation独占IP登陆PC平台'
      ),
    });

    const id = page.id.replace('space:', '');

    expect(workspace.search('处理器')).toStrictEqual(new Map([['1', id]]));

    expect(workspace.search('索尼')).toStrictEqual(new Map([['2', id]]));
  });
});
