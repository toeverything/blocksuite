/* eslint-disable @typescript-eslint/no-restricted-imports */
// checkout https://vitest.dev/guide/debugging.html for debugging tests

import { EDITOR_WIDTH } from '@blocksuite/global/config';
import type { Slot } from '@blocksuite/global/utils';
import { assert, describe, expect, it } from 'vitest';
import { ac } from 'vitest/dist/types-0373403c';

// Use manual per-module import/export to support vitest environment on Node.js
import { DividerBlockSchema } from '../../../blocks/src/divider-block/divider-model.js';
import { FrameBlockSchema } from '../../../blocks/src/frame-block/frame-model.js';
import { ListBlockSchema } from '../../../blocks/src/list-block/list-model.js';
import { PageBlockSchema } from '../../../blocks/src/page-block/page-model.js';
import { ParagraphBlockSchema } from '../../../blocks/src/paragraph-block/paragraph-model.js';
import type { BaseBlockModel, Page } from '../index.js';
import { Generator, Workspace } from '../index.js';
import type { PageMeta } from '../workspace/index.js';
import type { BlockSuiteDoc } from '../yjs';

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
const spaceMetaId = 'meta';

function serialize(page: Page) {
  return page.doc.toJSON();
}

function serializeWorkspace(doc: BlockSuiteDoc): Record<string, any> {
  const spaces = {};
  doc.spaces.forEach((subDoc, key) => {
    spaces[key] = subDoc.toJSON();
  });
  const json = doc.toJSON();
  delete json.spaces;

  return {
    ...json,
    spaces,
  };
}

function waitOnce<T>(slot: Slot<T>) {
  return new Promise<T>(resolve => slot.once(val => resolve(val)));
}

function createRoot(page: Page) {
  page.addBlock('affine:page');
  if (!page.root) throw new Error('root not found');
  return page.root;
}

function createTestPage(pageId = defaultPageId) {
  const options = createTestOptions();
  const workspace = new Workspace(options).register(BlockSchemas);
  return workspace.createPage({ id: pageId });
}

describe('basic', () => {
  it('can init workspace', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);
    assert.equal(workspace.isEmpty, true);

    workspace.createPage({ id: 'page0' });
    const actual = serializeWorkspace(workspace.doc);
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
            title: '',
          },
        ],
        blockVersions: {},
      },
      spaces: {
        [spaceId]: {
          blocks: {},
        },
      },
    });
  });
});

describe('addBlock', () => {
  it('can add single model', () => {
    const page = createTestPage();
    page.addBlock('affine:page', {
      title: new page.Text(),
    });

    assert.deepEqual(serializeWorkspace(page.doc).spaces[spaceId].blocks, {
      '0': {
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

    assert.deepEqual(serializeWorkspace(page.doc).spaces[spaceId].blocks, {
      '0': {
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'prop:title': 'hello',
      },
    });
  });

  it('can add multi models', () => {
    const page = createTestPage();
    const pageId = page.addBlock('affine:page', {
      title: new page.Text(),
    });
    const frameId = page.addBlock('affine:frame', {}, pageId);
    page.addBlock('affine:paragraph', {}, frameId);
    page.addBlocks(
      [
        { flavour: 'affine:paragraph', blockProps: { type: 'h1' } },
        { flavour: 'affine:paragraph', blockProps: { type: 'h2' } },
      ],
      frameId
    );

    assert.deepEqual(serializeWorkspace(page.doc).spaces[spaceId].blocks, {
      '0': {
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'prop:title': '',
      },
      '1': {
        'sys:children': ['2', '3', '4'],
        'sys:flavour': 'affine:frame',
        'sys:id': '1',
        'prop:background': '--affine-background-secondary-color',
        'prop:xywh': `[0,0,${EDITOR_WIDTH},480]`,
        'prop:index': 'a0',
      },
      '2': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '2',
        'prop:text': '',
        'prop:type': 'text',
      },
      '3': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '3',
        'prop:text': '',
        'prop:type': 'h1',
      },
      '4': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '4',
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
    const block = await waitOnce(page.slots.rootAdded);
    assert.equal(block.flavour, 'affine:page');
  });

  it('can add block to root', async () => {
    const page = createTestPage();

    let frameId: string;

    queueMicrotask(() => {
      const pageId = page.addBlock('affine:page');
      frameId = page.addBlock('affine:frame', {}, pageId);
    });
    await waitOnce(page.slots.rootAdded);
    const { root } = page;
    if (!root) throw new Error('root is null');

    assert.equal(root.flavour, 'affine:page');

    page.addBlock('affine:paragraph', {}, frameId);
    assert.equal(root.children[0].flavour, 'affine:frame');
    assert.equal(root.children[0].children[0].flavour, 'affine:paragraph');
    assert.equal(root.childMap.get('1'), 0);

    const serializedChildren = serializeWorkspace(page.doc).spaces[spaceId]
      .blocks['0']['sys:children'];
    assert.deepEqual(serializedChildren, ['1']);
    assert.equal(root.children[0].id, '1');
  });

  it('can add and remove multi pages', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchemas);

    const page0 = workspace.createPage({ id: 'page0' });
    const page1 = workspace.createPage({ id: 'page1' });
    // @ts-expect-error
    assert.equal(workspace._pages.size, 2);

    page0.addBlock('affine:page', {
      title: new page0.Text(),
    });
    workspace.removePage(page0.id);

    // @ts-expect-error
    assert.equal(workspace._pages.size, 1);
    assert.deepEqual(
      serializeWorkspace(page0.doc).spaces['space:page0'].blocks,
      {}
    );

    workspace.removePage(page1.id);
    // @ts-expect-error
    assert.equal(workspace._pages.size, 0);
  });

  it('can set page state', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchemas);
    workspace.createPage({ id: 'page0' });

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
    assert.deepEqual(serializeWorkspace(page.doc).spaces[spaceId].blocks, {
      '0': {
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'prop:title': '',
      },
    });

    page.deleteBlock(page.root as BaseBlockModel);
    assert.deepEqual(serializeWorkspace(page.doc).spaces[spaceId].blocks, {});
  });

  it('can delete model with parent', () => {
    const page = createTestPage();
    const root = createRoot(page);
    const frameId = page.addBlock('affine:frame', {}, root.id);

    page.addBlock('affine:paragraph', {}, frameId);

    // before delete
    assert.deepEqual(serializeWorkspace(page.doc).spaces[spaceId].blocks, {
      '0': {
        'prop:title': '',
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
      },
      '1': {
        'sys:children': ['2'],
        'sys:flavour': 'affine:frame',
        'sys:id': '1',
        'prop:background': '--affine-background-secondary-color',
        'prop:xywh': `[0,0,${EDITOR_WIDTH},480]`,
        'prop:index': 'a0',
      },
      '2': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '2',
        'prop:text': '',
        'prop:type': 'text',
      },
    });

    page.deleteBlock(root.children[0].children[0]);

    // after delete
    assert.deepEqual(serializeWorkspace(page.doc).spaces[spaceId].blocks, {
      '0': {
        'prop:title': '',
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
      },
      '1': {
        'sys:children': [],
        'sys:flavour': 'affine:frame',
        'sys:id': '1',
        'prop:background': '--affine-background-secondary-color',
        'prop:xywh': `[0,0,${EDITOR_WIDTH},480]`,
        'prop:index': 'a0',
      },
    });
    assert.equal(root.children.length, 1);
  });
});

describe('getBlock', () => {
  it('can get block by id', () => {
    const page = createTestPage();
    const root = createRoot(page);
    const frameId = page.addBlock('affine:frame', {}, root.id);

    page.addBlock('affine:paragraph', {}, frameId);
    page.addBlock('affine:paragraph', {}, frameId);

    const text = page.getBlockById('3') as BaseBlockModel;
    assert.equal(text.flavour, 'affine:paragraph');
    assert.equal(root.children[0].children.indexOf(text), 1);

    const invalid = page.getBlockById('😅');
    assert.equal(invalid, null);
  });

  it('can get parent', () => {
    const page = createTestPage();
    const root = createRoot(page);
    const frameId = page.addBlock('affine:frame', {}, root.id);

    page.addBlock('affine:paragraph', {}, frameId);
    page.addBlock('affine:paragraph', {}, frameId);

    const result = page.getParent(
      root.children[0].children[1]
    ) as BaseBlockModel;
    assert.equal(result, root.children[0]);

    const invalid = page.getParent(root);
    assert.equal(invalid, null);
  });

  it('can get previous sibling', () => {
    const page = createTestPage();
    const root = createRoot(page);
    const frameId = page.addBlock('affine:frame', {}, root.id);

    page.addBlock('affine:paragraph', {}, frameId);
    page.addBlock('affine:paragraph', {}, frameId);

    const result = page.getPreviousSibling(
      root.children[0].children[1]
    ) as BaseBlockModel;
    assert.equal(result, root.children[0].children[0]);

    const invalid = page.getPreviousSibling(root.children[0].children[0]);
    assert.equal(invalid, null);
  });
});

// Inline snapshot is not supported under describe.parallel config
describe('workspace.exportJSX works', () => {
  it('workspace matches snapshot', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchemas);
    const page = workspace.createPage({ id: 'page0' });

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
    workspace.createPage({ id: 'page0' });

    expect(workspace.exportJSX()).toMatchInlineSnapshot('null');
  });

  it('workspace with multiple blocks children matches snapshot', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchemas);
    const page = workspace.createPage({ id: 'page0' });

    const pageId = page.addBlock('affine:page', {
      title: new page.Text(),
    });
    const frameId = page.addBlock('affine:frame', {}, pageId);
    page.addBlock('affine:paragraph', {}, frameId);
    page.addBlock('affine:paragraph', {}, frameId);

    expect(workspace.exportJSX()).toMatchInlineSnapshot(/* xml */ `
      <affine:page>
        <affine:frame
          prop:background="--affine-background-secondary-color"
          prop:index="a0"
        >
          <affine:paragraph
            prop:type="text"
          />
          <affine:paragraph
            prop:type="text"
          />
        </affine:frame>
      </affine:page>
    `);
  });
});
