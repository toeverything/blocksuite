/* eslint-disable @typescript-eslint/no-restricted-imports */
// checkout https://vitest.dev/guide/debugging.html for debugging tests

import type { Slot } from '@blocksuite/global/utils';
import { assert, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyUpdate, encodeStateAsUpdate } from 'yjs';

import { PAGE_VERSION, WORKSPACE_VERSION } from '../consts.js';
import type { BlockModel, BlockSchemaType, Page } from '../index.js';
import { Generator, Schema, Workspace } from '../index.js';
import type { PageMeta } from '../workspace/index.js';
import type { BlockSuiteDoc } from '../yjs/index.js';
import {
  NoteBlockSchema,
  PageBlockSchema,
  ParagraphBlockSchema,
} from './test-schema.js';
import { assertExists } from './test-utils-dom.js';

export const BlockSchemas = [
  ParagraphBlockSchema,
  PageBlockSchema,
  NoteBlockSchema,
] as BlockSchemaType[];

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  const schema = new Schema();
  schema.register(BlockSchemas);
  return { id: 'test-workspace', idGenerator, schema };
}

const defaultPageId = 'page:home';
const spaceId = defaultPageId;
const spaceMetaId = 'meta';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeWorkspace(doc: BlockSuiteDoc): Record<string, any> {
  const spaces = {};
  doc.spaces.forEach((subDoc, key) => {
    // @ts-ignore
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
  const workspace = new Workspace(options);
  const page = workspace.createPage({ id: pageId });
  page.load();
  return page;
}

function requestIdleCallbackPolyfill(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
) {
  const timeout = options?.timeout ?? 1000;
  const start = Date.now();
  return setTimeout(function () {
    callback({
      didTimeout: false,
      timeRemaining: function () {
        return Math.max(0, timeout - (Date.now() - start));
      },
    });
  }, timeout) as unknown as number;
}

beforeEach(() => {
  if (globalThis.requestIdleCallback === undefined) {
    globalThis.requestIdleCallback = requestIdleCallbackPolyfill;
  }
});

describe('basic', () => {
  it('can init workspace', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);
    assert.equal(workspace.isEmpty, true);

    const page = workspace.createPage({ id: 'page:home' });
    page.load();
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
            id: 'page:home',
            title: '',
            tags: [],
          },
        ],
        workspaceVersion: WORKSPACE_VERSION,
        pageVersion: PAGE_VERSION,
        blockVersions: {
          'affine:note': 1,
          'affine:page': 2,
          'affine:paragraph': 1,
        },
      },
      spaces: {
        [spaceId]: {
          blocks: {},
        },
      },
    });
  });

  it('init workspace with custom id generator', () => {
    const options = createTestOptions();
    let id = 100;
    const workspace = new Workspace({
      ...options,
      idGenerator: () => {
        return String(id++);
      },
    });
    {
      const page = workspace.createPage();
      assert.equal(page.id, '100');
    }
    {
      const page = workspace.createPage();
      assert.equal(page.id, '101');
    }
  });

  it('page ready lifecycle', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);
    const page = workspace.createPage({
      id: 'space:0',
    });

    const readyCallback = vi.fn();
    const rootAddedCallback = vi.fn();
    page.slots.ready.on(readyCallback);
    page.slots.rootAdded.on(rootAddedCallback);

    page.load(() => {
      expect(page.ready).toBe(false);
      const rootId = page.addBlock('affine:page', {
        title: new page.Text(),
      });
      expect(rootAddedCallback).toBeCalledTimes(1);
      expect(page.ready).toBe(false);

      page.addBlock('affine:note', {}, rootId);
    });

    expect(page.ready).toBe(true);
    expect(readyCallback).toBeCalledTimes(1);
  });

  it('workspace pages with yjs applyUpdate', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);
    const workspace2 = new Workspace(options);
    const page = workspace.createPage({
      id: 'space:0',
    });
    page.load(() => {
      page.addBlock('affine:page', {
        title: new page.Text(),
      });
    });
    {
      const subdocsTester = vi.fn(({ added }) => {
        expect(added.size).toBe(1);
      });
      // only apply root update
      workspace2.doc.once('subdocs', subdocsTester);
      expect(subdocsTester).toBeCalledTimes(0);
      expect(workspace2.pages.size).toBe(0);
      const update = encodeStateAsUpdate(workspace.doc);
      applyUpdate(workspace2.doc, update);
      expect(workspace2.doc.toJSON()['spaces']).toEqual({
        'space:0': {
          blocks: {},
        },
      });
      expect(workspace2.pages.size).toBe(1);
      expect(subdocsTester).toBeCalledTimes(1);
    }
    {
      // apply page update
      const update = encodeStateAsUpdate(page.spaceDoc);
      expect(workspace2.pages.size).toBe(1);
      const page2 = workspace2.getPage('space:0');
      assertExists(page2);
      applyUpdate(page2.spaceDoc, update);
      expect(workspace2.doc.toJSON()['spaces']).toEqual({
        'space:0': {
          blocks: {
            '0': {
              'prop:title': '',
              'sys:children': [],
              'sys:flavour': 'affine:page',
              'sys:id': '0',
              'sys:version': 2,
            },
          },
        },
      });
      const fn = vi.fn(({ loaded }) => {
        expect(loaded.size).toBe(1);
      });
      workspace2.doc.once('subdocs', fn);
      expect(fn).toBeCalledTimes(0);
      page2.load();
      expect(fn).toBeCalledTimes(1);
    }
  });
});

describe('addBlock', () => {
  it('can add single model', () => {
    const page = createTestPage();
    page.addBlock('affine:page', {
      title: new page.Text(),
    });

    assert.deepEqual(serializeWorkspace(page.rootDoc).spaces[spaceId].blocks, {
      '0': {
        'prop:title': '',
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'sys:version': 2,
      },
    });
  });

  it('can add model with props', () => {
    const page = createTestPage();
    page.addBlock('affine:page', { title: new page.Text('hello') });

    assert.deepEqual(serializeWorkspace(page.rootDoc).spaces[spaceId].blocks, {
      '0': {
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'prop:title': 'hello',
        'sys:version': 2,
      },
    });
  });

  it('can add multi models', () => {
    const page = createTestPage();
    const pageId = page.addBlock('affine:page', {
      title: new page.Text(),
    });
    const noteId = page.addBlock('affine:note', {}, pageId);
    page.addBlock('affine:paragraph', {}, noteId);
    page.addBlocks(
      [
        { flavour: 'affine:paragraph', blockProps: { type: 'h1' } },
        { flavour: 'affine:paragraph', blockProps: { type: 'h2' } },
      ],
      noteId
    );

    assert.deepEqual(serializeWorkspace(page.rootDoc).spaces[spaceId].blocks, {
      '0': {
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'prop:title': '',
        'sys:version': 2,
      },
      '1': {
        'sys:children': ['2', '3', '4'],
        'sys:flavour': 'affine:note',
        'sys:id': '1',
        'sys:version': 1,
      },
      '2': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '2',
        'prop:text': '',
        'prop:type': 'text',
        'sys:version': 1,
      },
      '3': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '3',
        'prop:text': '',
        'prop:type': 'h1',
        'sys:version': 1,
      },
      '4': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '4',
        'prop:text': '',
        'prop:type': 'h2',
        'sys:version': 1,
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

    let noteId: string;

    queueMicrotask(() => {
      const pageId = page.addBlock('affine:page');
      noteId = page.addBlock('affine:note', {}, pageId);
    });
    await waitOnce(page.slots.rootAdded);
    const { root } = page;
    if (!root) throw new Error('root is null');

    assert.equal(root.flavour, 'affine:page');

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    page.addBlock('affine:paragraph', {}, noteId!);
    assert.equal(root.children[0].flavour, 'affine:note');
    assert.equal(root.children[0].children[0].flavour, 'affine:paragraph');
    assert.equal(root.childMap.get('1'), 0);

    const serializedChildren = serializeWorkspace(page.rootDoc).spaces[spaceId]
      .blocks['0']['sys:children'];
    assert.deepEqual(serializedChildren, ['1']);
    assert.equal(root.children[0].id, '1');
  });

  it('can add and remove multi pages', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);

    const page0 = workspace.createPage({ id: 'page:home' });
    const page1 = workspace.createPage({ id: 'space:page1' });
    await Promise.all([page0.load(), page1.load()]);
    assert.equal(workspace.pages.size, 2);

    page0.addBlock('affine:page', {
      title: new page0.Text(),
    });
    workspace.removePage(page0.id);

    assert.equal(workspace.pages.size, 1);
    assert.equal(
      serializeWorkspace(page0.rootDoc).spaces['page:home'],
      undefined
    );

    workspace.removePage(page1.id);
    assert.equal(workspace.pages.size, 0);
  });

  it('can remove page that has not been loaded', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);

    const page0 = workspace.createPage({ id: 'page:home' });

    workspace.removePage(page0.id);
    assert.equal(workspace.pages.size, 0);
  });

  it('can set page state', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);
    workspace.createPage({ id: 'page:home' });

    assert.deepEqual(
      workspace.meta.pageMetas.map(({ id, title }) => ({
        id,
        title,
      })),
      [
        {
          id: 'page:home',
          title: '',
        },
      ]
    );

    let called = false;
    workspace.meta.pageMetasUpdated.on(() => {
      called = true;
    });

    // @ts-ignore
    workspace.setPageMeta('page:home', { favorite: true });
    assert.deepEqual(
      // @ts-ignore
      workspace.meta.pageMetas.map(({ id, title, favorite }) => ({
        id,
        title,
        favorite,
      })),
      [
        {
          id: 'page:home',
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
  it('delete children recursively by default', () => {
    const page = createTestPage();

    const pageId = page.addBlock('affine:page', {});
    const noteId = page.addBlock('affine:note', {}, pageId);
    page.addBlock('affine:paragraph', {}, noteId);
    page.addBlock('affine:paragraph', {}, noteId);
    assert.deepEqual(serializeWorkspace(page.rootDoc).spaces[spaceId].blocks, {
      '0': {
        'prop:title': '',
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'sys:version': 2,
      },
      '1': {
        'sys:children': ['2', '3'],
        'sys:flavour': 'affine:note',
        'sys:id': '1',
        'sys:version': 1,
      },
      '2': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '2',
        'sys:version': 1,
      },
      '3': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '3',
        'sys:version': 1,
      },
    });

    const deletedModel = page.getBlockById('1') as BlockModel;
    page.deleteBlock(deletedModel);

    assert.deepEqual(serializeWorkspace(page.rootDoc).spaces[spaceId].blocks, {
      '0': {
        'prop:title': '',
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'sys:version': 2,
      },
    });
  });

  it('bring children to parent', () => {
    const page = createTestPage();

    const pageId = page.addBlock('affine:page', {});
    const noteId = page.addBlock('affine:note', {}, pageId);
    const p1 = page.addBlock('affine:paragraph', {}, noteId);
    page.addBlock('affine:paragraph', {}, p1);
    page.addBlock('affine:paragraph', {}, p1);

    assert.deepEqual(serializeWorkspace(page.rootDoc).spaces[spaceId].blocks, {
      '0': {
        'prop:title': '',
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'sys:version': 2,
      },
      '1': {
        'sys:children': ['2'],
        'sys:flavour': 'affine:note',
        'sys:id': '1',
        'sys:version': 1,
      },
      '2': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': ['3', '4'],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '2',
        'sys:version': 1,
      },
      '3': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '3',
        'sys:version': 1,
      },
      '4': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '4',
        'sys:version': 1,
      },
    });

    const deletedModel = page.getBlockById('2') as BlockModel;
    const deletedModelParent = page.getBlockById('1') as BlockModel;
    page.deleteBlock(deletedModel, {
      bringChildrenTo: deletedModelParent,
    });

    assert.deepEqual(serializeWorkspace(page.rootDoc).spaces[spaceId].blocks, {
      '0': {
        'prop:title': '',
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'sys:version': 2,
      },
      '1': {
        'sys:children': ['3', '4'],
        'sys:flavour': 'affine:note',
        'sys:id': '1',
        'sys:version': 1,
      },
      '3': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '3',
        'sys:version': 1,
      },
      '4': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '4',
        'sys:version': 1,
      },
    });
  });

  it('bring children to other block', () => {
    const page = createTestPage();

    const pageId = page.addBlock('affine:page', {});
    const noteId = page.addBlock('affine:note', {}, pageId);
    const p1 = page.addBlock('affine:paragraph', {}, noteId);
    const p2 = page.addBlock('affine:paragraph', {}, noteId);
    page.addBlock('affine:paragraph', {}, p1);
    page.addBlock('affine:paragraph', {}, p1);
    page.addBlock('affine:paragraph', {}, p2);

    assert.deepEqual(serializeWorkspace(page.rootDoc).spaces[spaceId].blocks, {
      '0': {
        'prop:title': '',
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'sys:version': 2,
      },
      '1': {
        'sys:children': ['2', '3'],
        'sys:flavour': 'affine:note',
        'sys:id': '1',
        'sys:version': 1,
      },
      '2': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': ['4', '5'],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '2',
        'sys:version': 1,
      },
      '3': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': ['6'],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '3',
        'sys:version': 1,
      },
      '4': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '4',
        'sys:version': 1,
      },
      '5': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '5',
        'sys:version': 1,
      },
      '6': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '6',
        'sys:version': 1,
      },
    });

    const deletedModel = page.getBlockById('2') as BlockModel;
    const moveToModel = page.getBlockById('3') as BlockModel;
    page.deleteBlock(deletedModel, {
      bringChildrenTo: moveToModel,
    });

    assert.deepEqual(serializeWorkspace(page.rootDoc).spaces[spaceId].blocks, {
      '0': {
        'prop:title': '',
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'sys:version': 2,
      },
      '1': {
        'sys:children': ['3'],
        'sys:flavour': 'affine:note',
        'sys:id': '1',
        'sys:version': 1,
      },
      '3': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': ['6', '4', '5'],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '3',
        'sys:version': 1,
      },
      '4': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '4',
        'sys:version': 1,
      },
      '5': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '5',
        'sys:version': 1,
      },
      '6': {
        'prop:text': '',
        'prop:type': 'text',
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '6',
        'sys:version': 1,
      },
    });
  });

  it('can delete model with parent', () => {
    const page = createTestPage();
    const root = createRoot(page);
    const noteId = page.addBlock('affine:note', {}, root.id);

    page.addBlock('affine:paragraph', {}, noteId);

    // before delete
    assert.deepEqual(serializeWorkspace(page.rootDoc).spaces[spaceId].blocks, {
      '0': {
        'prop:title': '',
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'sys:version': 2,
      },
      '1': {
        'sys:children': ['2'],
        'sys:flavour': 'affine:note',
        'sys:id': '1',
        'sys:version': 1,
      },
      '2': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '2',
        'prop:text': '',
        'prop:type': 'text',
        'sys:version': 1,
      },
    });

    page.deleteBlock(root.children[0].children[0]);

    // after delete
    assert.deepEqual(serializeWorkspace(page.rootDoc).spaces[spaceId].blocks, {
      '0': {
        'prop:title': '',
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'sys:version': 2,
      },
      '1': {
        'sys:children': [],
        'sys:flavour': 'affine:note',
        'sys:id': '1',
        'sys:version': 1,
      },
    });
    assert.equal(root.children.length, 1);
  });
});

describe('getBlock', () => {
  it('can get block by id', () => {
    const page = createTestPage();
    const root = createRoot(page);
    const noteId = page.addBlock('affine:note', {}, root.id);

    page.addBlock('affine:paragraph', {}, noteId);
    page.addBlock('affine:paragraph', {}, noteId);

    const text = page.getBlockById('3') as BlockModel;
    assert.equal(text.flavour, 'affine:paragraph');
    assert.equal(root.children[0].children.indexOf(text), 1);

    const invalid = page.getBlockById('😅');
    assert.equal(invalid, null);
  });

  it('can get parent', () => {
    const page = createTestPage();
    const root = createRoot(page);
    const noteId = page.addBlock('affine:note', {}, root.id);

    page.addBlock('affine:paragraph', {}, noteId);
    page.addBlock('affine:paragraph', {}, noteId);

    const result = page.getParent(root.children[0].children[1]) as BlockModel;
    assert.equal(result, root.children[0]);

    const invalid = page.getParent(root);
    assert.equal(invalid, null);
  });

  it('can get previous sibling', () => {
    const page = createTestPage();
    const root = createRoot(page);
    const noteId = page.addBlock('affine:note', {}, root.id);

    page.addBlock('affine:paragraph', {}, noteId);
    page.addBlock('affine:paragraph', {}, noteId);

    const result = page.getPreviousSibling(
      root.children[0].children[1]
    ) as BlockModel;
    assert.equal(result, root.children[0].children[0]);

    const invalid = page.getPreviousSibling(root.children[0].children[0]);
    assert.equal(invalid, null);
  });
});

// Inline snapshot is not supported under describe.parallel config
describe('workspace.exportJSX works', () => {
  it('workspace matches snapshot', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);
    const page = workspace.createPage({ id: 'page:home' });

    page.addBlock('affine:page', { title: new page.Text('hello') });

    expect(workspace.exportJSX()).toMatchInlineSnapshot(`
      <affine:page
        prop:title="hello"
      />
    `);
  });

  it('empty workspace matches snapshot', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);
    workspace.createPage({ id: 'page:home' });

    expect(workspace.exportJSX()).toMatchInlineSnapshot('null');
  });

  it('workspace with multiple blocks children matches snapshot', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);
    const page = workspace.createPage({ id: 'page:home' });
    page.load(() => {
      const pageId = page.addBlock('affine:page', {
        title: new page.Text(),
      });
      const noteId = page.addBlock('affine:note', {}, pageId);
      page.addBlock('affine:paragraph', {}, noteId);
      page.addBlock('affine:paragraph', {}, noteId);
    });

    expect(workspace.exportJSX()).toMatchInlineSnapshot(/* xml */ `
      <affine:page>
        <affine:note>
          <affine:paragraph
            prop:type="text"
          />
          <affine:paragraph
            prop:type="text"
          />
        </affine:note>
      </affine:page>
    `);
  });
});

describe('workspace search', () => {
  it('search page meta title', () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);
    const page = workspace.createPage({ id: 'page:home' });
    page.load(() => {
      const pageId = page.addBlock('affine:page', {
        title: new page.Text('test123'),
      });
      const noteId = page.addBlock('affine:note', {}, pageId);
      page.addBlock('affine:paragraph', {}, noteId);
    });

    requestIdleCallback(() => {
      const result = workspace.search('test');
      expect(result).toMatchInlineSnapshot(`
      Map {
        "0" => {
          "content": "test123",
          "space": "page:home",
        },
      }
    `);
    });
  });
});
