/* eslint-disable @typescript-eslint/no-restricted-imports */
// checkout https://vitest.dev/guide/debugging.html for debugging tests

import { assert, describe, expect, it } from 'vitest';

import { DividerBlockSchema } from '../../../blocks/src/divider-block/divider-model.js';
import { FrameBlockSchema } from '../../../blocks/src/frame-block/frame-model.js';
import { ListBlockSchema } from '../../../blocks/src/list-block/list-model.js';
// Use manual per-module import/export to support vitest environment on Node.js
import { PageBlockSchema } from '../../../blocks/src/page-block/page-model.js';
import { ParagraphBlockSchema } from '../../../blocks/src/paragraph-block/paragraph-model.js';
import type { Slot } from '../../../global/src/utils/slot.js';
import type { BaseBlockModel, Page } from '../index.js';
import { Generator, Workspace } from '../index.js';
import type { PageMeta } from '../workspace/index.js';

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  return { id: 'test-workspace', idGenerator, isSSR: true };
}

export const BlockSchemas = [
  ParagraphBlockSchema,
  PageBlockSchema,
  ListBlockSchema,
  FrameBlockSchema,
  DividerBlockSchema,
];

const defaultPageId = 'page0';
const spaceId = `space:${defaultPageId}`;
const spaceMetaId = 'space:meta';

function serialize(page: Page) {
  return page.doc.toJSON();
}

function waitOnce<T>(slot: Slot<T>) {
  return new Promise<T>(resolve => slot.once(val => resolve(val)));
}

function createRoot(page: Page) {
  page.addBlock('affine:page');
  if (!page.root) throw new Error('root not found');
  return page.root;
}

function createTestPage(pageId = defaultPageId, parentId?: string) {
  const options = createTestOptions();
  const workspace = new Workspace(options).register(BlockSchemas);
  return workspace.createPage(pageId, parentId);
}

describe('basic', () => {
  it('can init workspace', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);
    assert.equal(workspace.isEmpty, true);

    const page = workspace.createPage('page0');
    const actual = serialize(page);
    const actualPage = actual[spaceMetaId].pages[0] as PageMeta;

    assert.equal(workspace.isEmpty, false);
    assert.equal(typeof actualPage.createDate, 'number');
    // @ts-ignore
    delete actualPage.createDate;

    assert.deepEqual(actual, {
      [spaceMetaId]: {
        pages: [
          {
            id: 'page0',
            subpageIds: [],
            title: '',
          },
        ],
        versions: {},
      },
      [spaceId]: {},
    });
  });
});

describe('pageMeta', () => {
  it('can create subpage', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchemas);

    const parentPage = workspace.createPage(defaultPageId);
    const subpage = workspace.createPage('subpage0', parentPage.id);
    assert.deepEqual(parentPage.meta.subpageIds, [subpage.id]);
  });

  it('can shift subpage', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchemas);

    const page0 = workspace.createPage('page0');
    const page1 = workspace.createPage('page1');
    const page2 = workspace.createPage('page2');

    assert.deepEqual(
      workspace.meta.pageMetas.map(m => m.id),
      ['page0', 'page1', 'page2']
    );

    workspace.shiftPage(page1.id, 0);

    assert.deepEqual(
      workspace.meta.pageMetas.map(m => m.id),
      ['page1', 'page0', 'page2']
    );
  });
});

describe('addBlock', () => {
  it('can add single model', () => {
    const page = createTestPage();
    page.addBlock('affine:page', {
      title: new page.Text(),
    });

    assert.deepEqual(serialize(page)[spaceId], {
      '0': {
        'ext:columns': {},
        'ext:columnSchema': {},
        'prop:title': '',
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
      },
    });
  });

  it('can add model with props', () => {
    const page = createTestPage();
    page.addBlock('affine:page', { title: new page.Text('hello') });

    assert.deepEqual(serialize(page)[spaceId], {
      '0': {
        'ext:columns': {},
        'ext:columnSchema': {},
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'prop:title': 'hello',
      },
    });
  });

  it('can add multi models', () => {
    const page = createTestPage();
    page.addBlock('affine:page', {
      title: new page.Text(),
    });
    page.addBlock('affine:paragraph');
    page.addBlocksByFlavour([
      { flavour: 'affine:paragraph', blockProps: { type: 'h1' } },
      { flavour: 'affine:paragraph', blockProps: { type: 'h2' } },
    ]);

    assert.deepEqual(serialize(page)[spaceId], {
      '0': {
        'ext:columns': {},
        'ext:columnSchema': {},
        'sys:children': ['1', '2', '3'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'prop:title': '',
      },
      '1': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '1',
        'prop:text': '',
        'prop:type': 'text',
      },
      '2': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '2',
        'prop:text': '',
        'prop:type': 'h1',
      },
      '3': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '3',
        'prop:text': '',
        'prop:type': 'h2',
      },
    });
  });

  it('can observe slot events', async () => {
    const page = createTestPage();

    queueMicrotask(() =>
      page.addBlock('affine:page', {
        title: new page.Text(),
      })
    );
    const block = (await waitOnce(page.slots.rootAdded)) as BaseBlockModel;
    if (Array.isArray(block)) {
      throw new Error('');
    }
    assert.equal(block.flavour, 'affine:page');
  });

  it('can add block to root', async () => {
    const page = createTestPage();

    queueMicrotask(() => page.addBlock('affine:page'));
    await waitOnce(page.slots.rootAdded);
    const { root } = page;
    if (!root) throw new Error('root is null');

    assert.equal(root.flavour, 'affine:page');

    page.addBlock('affine:paragraph');
    assert.equal(root.children[0].flavour, 'affine:paragraph');
    assert.equal(root.childMap.get('1'), 0);

    const serializedChildren = serialize(page)[spaceId]['0']['sys:children'];
    assert.deepEqual(serializedChildren, ['1']);
    assert.equal(root.children[0].id, '1');
  });

  it('can add and remove multi pages', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchemas);

    const page0 = workspace.createPage('page0');
    const page1 = workspace.createPage('page1');
    // @ts-expect-error
    assert.equal(workspace._pages.size, 2);

    page0.addBlock('affine:page', {
      title: new page0.Text(),
    });
    workspace.removePage(page0.id);

    // @ts-expect-error
    assert.equal(workspace._pages.size, 1);
    assert.deepEqual(serialize(page0)['space:page0'], {});

    workspace.removePage(page1.id);
    // @ts-expect-error
    assert.equal(workspace._pages.size, 0);
  });

  it('can set page state', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchemas);
    workspace.createPage('page0');

    assert.deepEqual(
      workspace.meta.pageMetas.map(({ id, title }) => ({
        id,
        title,
      })),
      [
        {
          id: 'page0',
          title: '',
        },
      ]
    );

    let called = false;
    workspace.meta.pageMetasUpdated.on(() => {
      called = true;
    });

    workspace.setPageMeta('page0', { favorite: true });
    assert.deepEqual(
      workspace.meta.pageMetas.map(({ id, title, favorite }) => ({
        id,
        title,
        favorite,
      })),
      [
        {
          id: 'page0',
          title: '',
          favorite: true,
        },
      ]
    );
    assert.ok(called);
  });

  it('can set workspace common meta fields', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);

    queueMicrotask(() => workspace.meta.setName('hello'));
    await waitOnce(workspace.meta.commonFieldsUpdated);
    assert.deepEqual(workspace.meta.name, 'hello');

    queueMicrotask(() => workspace.meta.setAvatar('gengar.jpg'));
    await waitOnce(workspace.meta.commonFieldsUpdated);
    assert.deepEqual(workspace.meta.avatar, 'gengar.jpg');
  });
});

describe('deleteBlock', () => {
  it('can delete single model', () => {
    const page = createTestPage();

    page.addBlock('affine:page', {
      title: new page.Text(),
    });
    assert.deepEqual(serialize(page)[spaceId], {
      '0': {
        'ext:columns': {},
        'ext:columnSchema': {},
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'prop:title': '',
      },
    });

    page.deleteBlockById('0');
    assert.deepEqual(serialize(page)[spaceId], {});
  });

  it('can delete model with parent', () => {
    const page = createTestPage();
    const root = createRoot(page);

    page.addBlock('affine:paragraph');

    // before delete
    assert.deepEqual(serialize(page)[spaceId], {
      '0': {
        'ext:columns': {},
        'ext:columnSchema': {},
        'prop:title': '',
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
        'ext:columns': {},
        'ext:columnSchema': {},
        'prop:title': '',
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
      },
    });
    assert.equal(root.children.length, 0);
  });
});

describe('getBlock', () => {
  it('can get block by id', () => {
    const page = createTestPage();
    const root = createRoot(page);

    page.addBlock('affine:paragraph');
    page.addBlock('affine:paragraph');

    const text = page.getBlockById('2') as BaseBlockModel;
    assert.equal(text.flavour, 'affine:paragraph');
    assert.equal(root.children.indexOf(text), 1);

    const invalid = page.getBlockById('😅');
    assert.equal(invalid, null);
  });

  it('can get parent', () => {
    const page = createTestPage();
    const root = createRoot(page);

    page.addBlock('affine:paragraph');
    page.addBlock('affine:paragraph');

    const result = page.getParent(root.children[1]) as BaseBlockModel;
    assert.equal(result, root);

    const invalid = page.getParentById(root.id, root);
    assert.equal(invalid, null);
  });

  it('can get previous sibling', () => {
    const page = createTestPage();
    const root = createRoot(page);

    page.addBlock('affine:paragraph');
    page.addBlock('affine:paragraph');

    const result = page.getPreviousSibling(root.children[1]) as BaseBlockModel;
    assert.equal(result, root.children[0]);

    const invalid = page.getPreviousSibling(root.children[0]);
    assert.equal(invalid, null);
  });
});

// Inline snapshot is not supported under describe.parallel config
describe('workspace.exportJSX works', () => {
  it('workspace matches snapshot', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchemas);
    const page = workspace.createPage('page0');

    page.addBlock('affine:page', { title: new page.Text('hello') });

    expect(workspace.exportJSX()).toMatchInlineSnapshot(`
      <affine:page
        prop:title="hello"
      />
    `);
  });

  it('empty workspace matches snapshot', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchemas);
    workspace.createPage('page0');

    expect(workspace.exportJSX()).toMatchInlineSnapshot('null');
  });

  it('workspace with multiple blocks children matches snapshot', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchemas);
    const page = workspace.createPage('page0');

    page.addBlock('affine:page', {
      title: new page.Text(),
    });
    page.addBlock('affine:paragraph');
    page.addBlock('affine:paragraph');

    expect(workspace.exportJSX()).toMatchInlineSnapshot(/* xml */ `
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

describe('workspace.search works', () => {
  it('workspace search matching', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchemas);
    const page = workspace.createPage('page0');

    page.addBlock('affine:page', { title: new page.Text('hello') });

    page.addBlock('affine:paragraph', {
      text: new page.Text(
        '英特尔第13代酷睿i7-1370P移动处理器现身Geekbench，14核心和5GHz'
      ),
    });

    page.addBlock('affine:paragraph', {
      text: new page.Text(
        '索尼考虑移植《GT赛车7》，又一PlayStation独占IP登陆PC平台'
      ),
    });

    const id = page.id.replace('space:', '');

    queueMicrotask(() => {
      expect(workspace.search('处理器')).toStrictEqual(new Map([['1', id]]));
      expect(workspace.search('索尼')).toStrictEqual(new Map([['2', id]]));
    });
  });
});
