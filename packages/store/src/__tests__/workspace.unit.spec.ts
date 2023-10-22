/* eslint-disable @typescript-eslint/no-restricted-imports */
// checkout https://vitest.dev/guide/debugging.html for debugging tests

import type { Slot } from '@blocksuite/global/utils';
import { assert, describe, expect, it, vi } from 'vitest';
import { Awareness } from 'y-protocols/awareness.js';
import { applyUpdate, encodeStateAsUpdate } from 'yjs';

// Use manual per-module import/export to support vitest environment on Node.js
import { NOTE_WIDTH } from '../../../blocks/src/_common/consts.js';
import { DividerBlockSchema } from '../../../blocks/src/divider-block/divider-model.js';
import { ListBlockSchema } from '../../../blocks/src/list-block/list-model.js';
import { NoteBlockSchema } from '../../../blocks/src/note-block/note-model.js';
import { PageBlockSchema } from '../../../blocks/src/page-block/page-model.js';
import { ParagraphBlockSchema } from '../../../blocks/src/paragraph-block/paragraph-model.js';
import { PAGE_VERSION, WORKSPACE_VERSION } from '../consts';
import type { BaseBlockModel, Page, PassiveDocProvider } from '../index.js';
import { Generator, Schema, Workspace } from '../index.js';
import type { PageMeta } from '../workspace/index.js';
import type { BlockSuiteDoc } from '../yjs';
import { assertExists } from './test-utils-dom';

export const BlockSchemas = [
  ParagraphBlockSchema,
  PageBlockSchema,
  ListBlockSchema,
  NoteBlockSchema,
  DividerBlockSchema,
];

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  const schema = new Schema();
  schema.register(BlockSchemas);
  return { id: 'test-workspace', idGenerator, isSSR: true, schema };
}

const defaultPageId = 'page:home';
const spaceId = defaultPageId;
const spaceMetaId = 'meta';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

async function createTestPage(pageId = defaultPageId) {
  const options = createTestOptions();
  const workspace = new Workspace(options);
  const page = workspace.createPage({ id: pageId });
  await page.waitForLoaded();
  return page;
}

describe('basic', () => {
  it('can init workspace', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);
    assert.equal(workspace.isEmpty, true);

    const page = workspace.createPage({ id: 'page:home' });
    await page.waitForLoaded();
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
          'affine:divider': 1,
          'affine:list': 1,
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

  it('init with provider', async () => {
    const options = createTestOptions();
    const workspace = new Workspace({
      ...options,
      providerCreators: [
        vi.fn((id, doc, config): PassiveDocProvider => {
          expect(id).toBe(options.id);
          expect(doc.guid).toBe(options.id);
          expect(config.awareness).toBeInstanceOf(Awareness);
          return {
            flavour: '',
            passive: true,
            connect() {
              // do nothing
            },
            get connected() {
              return false;
            },
            disconnect() {
              // do nothing
            },
          };
        }),
      ],
    });
  });

  it('init workspace with custom id generator', async () => {
    const options = createTestOptions();
    let id = 100;
    const workspace = new Workspace({
      ...options,
      idGenerator: type => {
        assert.equal(type, 'page');
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

  it('workspace pages with yjs applyUpdate', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);
    const workspace2 = new Workspace(options);
    const page = workspace.createPage({
      id: 'space:0',
    });
    await page.waitForLoaded();
    page.addBlock('affine:page', {
      title: new page.Text(),
    });
    {
      const fn = vi.fn(({ added }) => {
        expect(added.size).toBe(1);
      });
      // only apply root update
      workspace2.doc.once('subdocs', fn);
      expect(fn).toBeCalledTimes(0);
      expect(workspace2.pages.size).toBe(0);
      const update = encodeStateAsUpdate(workspace.doc);
      applyUpdate(workspace2.doc, update);
      expect(workspace2.doc.toJSON()['spaces']).toEqual({
        'space:0': {
          blocks: {},
        },
      });
      expect(workspace2.pages.size).toBe(1);
      expect(fn).toBeCalledTimes(1);
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
            },
          },
        },
      });
      const fn = vi.fn(({ loaded }) => {
        expect(loaded.size).toBe(1);
      });
      workspace2.doc.once('subdocs', fn);
      expect(fn).toBeCalledTimes(0);
      await page2.waitForLoaded();
      expect(fn).toBeCalledTimes(1);
    }
  });
});

describe('addBlock', () => {
  it('can add single model', async () => {
    const page = await createTestPage();
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

  it('can add model with props', async () => {
    const page = await createTestPage();
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

  it('can add multi models', async () => {
    const page = await createTestPage();
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

    assert.deepEqual(serializeWorkspace(page.doc).spaces[spaceId].blocks, {
      '0': {
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'prop:title': '',
      },
      '1': {
        'sys:children': ['2', '3', '4'],
        'sys:flavour': 'affine:note',
        'sys:id': '1',
        'prop:background': '--affine-background-secondary-color',
        'prop:xywh': `[0,0,${NOTE_WIDTH},95]`,
        'prop:index': 'a0',
        'prop:hidden': false,
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
    const page = await createTestPage();

    queueMicrotask(() =>
      page.addBlock('affine:page', {
        title: new page.Text(),
      })
    );
    const block = await waitOnce(page.slots.rootAdded);
    assert.equal(block.flavour, 'affine:page');
  });

  it('can add block to root', async () => {
    const page = await createTestPage();

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

    const serializedChildren = serializeWorkspace(page.doc).spaces[spaceId]
      .blocks['0']['sys:children'];
    assert.deepEqual(serializedChildren, ['1']);
    assert.equal(root.children[0].id, '1');
  });

  it('can add and remove multi pages', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);

    const page0 = workspace.createPage({ id: 'page:home' });
    const page1 = workspace.createPage({ id: 'space:page1' });
    await Promise.all([page0.waitForLoaded(), page1.waitForLoaded()]);
    assert.equal(workspace.pages.size, 2);

    page0.addBlock('affine:page', {
      title: new page0.Text(),
    });
    workspace.removePage(page0.id);

    assert.equal(workspace.pages.size, 1);
    assert.equal(serializeWorkspace(page0.doc).spaces['page:home'], undefined);

    workspace.removePage(page1.id);
    assert.equal(workspace.pages.size, 0);
  });

  it('can remove page that has not been loaded', async () => {
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
  it('can delete single model', async () => {
    const page = await createTestPage();

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

  it('can delete model with parent', async () => {
    const page = await createTestPage();
    const root = createRoot(page);
    const noteId = page.addBlock('affine:note', {}, root.id);

    page.addBlock('affine:paragraph', {}, noteId);

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
        'sys:flavour': 'affine:note',
        'sys:id': '1',
        'prop:background': '--affine-background-secondary-color',
        'prop:xywh': `[0,0,${NOTE_WIDTH},95]`,
        'prop:index': 'a0',
        'prop:hidden': false,
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
        'sys:flavour': 'affine:note',
        'sys:id': '1',
        'prop:background': '--affine-background-secondary-color',
        'prop:xywh': `[0,0,${NOTE_WIDTH},95]`,
        'prop:index': 'a0',
        'prop:hidden': false,
      },
    });
    assert.equal(root.children.length, 1);
  });
});

describe('getBlock', () => {
  it('can get block by id', async () => {
    const page = await createTestPage();
    const root = createRoot(page);
    const noteId = page.addBlock('affine:note', {}, root.id);

    page.addBlock('affine:paragraph', {}, noteId);
    page.addBlock('affine:paragraph', {}, noteId);

    const text = page.getBlockById('3') as BaseBlockModel;
    assert.equal(text.flavour, 'affine:paragraph');
    assert.equal(root.children[0].children.indexOf(text), 1);

    const invalid = page.getBlockById('😅');
    assert.equal(invalid, null);
  });

  it('can get parent', async () => {
    const page = await createTestPage();
    const root = createRoot(page);
    const noteId = page.addBlock('affine:note', {}, root.id);

    page.addBlock('affine:paragraph', {}, noteId);
    page.addBlock('affine:paragraph', {}, noteId);

    const result = page.getParent(
      root.children[0].children[1]
    ) as BaseBlockModel;
    assert.equal(result, root.children[0]);

    const invalid = page.getParent(root);
    assert.equal(invalid, null);
  });

  it('can get previous sibling', async () => {
    const page = await createTestPage();
    const root = createRoot(page);
    const noteId = page.addBlock('affine:note', {}, root.id);

    page.addBlock('affine:paragraph', {}, noteId);
    page.addBlock('affine:paragraph', {}, noteId);

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

  it('workspace with multiple blocks children matches snapshot', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);
    const page = workspace.createPage({ id: 'page:home' });
    await page.waitForLoaded();

    const pageId = page.addBlock('affine:page', {
      title: new page.Text(),
    });
    const noteId = page.addBlock('affine:note', {}, pageId);
    page.addBlock('affine:paragraph', {}, noteId);
    page.addBlock('affine:paragraph', {}, noteId);

    expect(workspace.exportJSX()).toMatchInlineSnapshot(/* xml */ `
      <affine:page>
        <affine:note
          prop:background="--affine-background-secondary-color"
          prop:hidden={false}
          prop:index="a0"
        >
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
  it('search page meta title', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options);
    const page = workspace.createPage({ id: 'page:home' });
    await page.waitForLoaded();
    const pageId = page.addBlock('affine:page', {
      title: new page.Text('test123'),
    });
    const noteId = page.addBlock('affine:note', {}, pageId);
    page.addBlock('affine:paragraph', {}, noteId);
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
