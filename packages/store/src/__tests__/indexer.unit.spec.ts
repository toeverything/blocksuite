/* eslint-disable @typescript-eslint/no-restricted-imports */
// checkout https://vitest.dev/guide/debugging.html for debugging tests
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyUpdate, encodeStateAsUpdate } from 'yjs';

// Use manual per-module import/export to support vitest environment on Node.js
import { NoteBlockSchema } from '../../../blocks/src/note-block/note-model.js';
import { PageBlockSchema } from '../../../blocks/src/page-block/page-model.js';
import { ParagraphBlockSchema } from '../../../blocks/src/paragraph-block/paragraph-model.js';
import { Generator, Schema, Workspace } from '../index.js';

export const BlockSchemas = [
  ParagraphBlockSchema,
  PageBlockSchema,
  NoteBlockSchema,
];

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  const schema = new Schema();
  schema.register(BlockSchemas);
  return { id: 'test-workspace', idGenerator, schema };
}

async function createTestPage(pageId = 'page:home', workspace?: Workspace) {
  const options = createTestOptions();
  const _workspace = workspace || new Workspace(options);
  const page = _workspace.createPage({ id: pageId });
  await page.load();
  return page;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestIdleCallback'] });
});

describe('workspace.search works', () => {
  it('workspace search matching', async () => {
    const page = await createTestPage();
    const workspace = page.workspace;

    const pageId = page.addBlock('affine:page', {
      title: new page.Text(''),
    });
    const noteId = page.addBlock('affine:note', {}, pageId);
    const text1 =
      '英特尔第13代酷睿i7-1370P移动处理器现身Geekbench，14核心和5GHz';
    const text2 = '索尼考虑移植《GT赛车7》，又一PlayStation独占IP登陆PC平台';
    const expected1 = new Map([
      [
        '2',
        {
          content: text1,
          space: page.id,
        },
      ],
    ]);
    const expected2 = new Map([
      [
        '3',
        {
          content: text2,
          space: page.id,
        },
      ],
    ]);
    page.addBlock(
      'affine:paragraph',
      {
        text: new page.Text(text1),
      },
      noteId
    );

    page.addBlock(
      'affine:paragraph',
      {
        text: new page.Text(text2),
      },
      noteId
    );

    const id = page.id;

    requestIdleCallback(() => {
      queueMicrotask(() => {
        expect(workspace.search('处理器')).toStrictEqual(expected1);
        expect(workspace.search('索尼')).toStrictEqual(expected2);
      });
    });

    const update = encodeStateAsUpdate(page.spaceDoc);
    const schema = new Schema();
    const workspace2 = new Workspace({
      schema,
      id: 'test',
    });
    const page2 = workspace2.createPage({
      id: 'page:home',
    });
    applyUpdate(page2.spaceDoc, update);
    expect(page2.spaceDoc.toJSON()).toEqual(page.spaceDoc.toJSON());

    requestIdleCallback(() => {
      queueMicrotask(() => {
        expect(workspace2.search('处理器')).toStrictEqual(expected1);
        expect(workspace2.search('索尼')).toStrictEqual(expected2);
      });
    });
  });
});

describe('backlink works', () => {
  it('backlink indexer works with subpage', async () => {
    const page = await createTestPage();
    const workspace = page.workspace;
    const subpage = await createTestPage('page1', workspace);
    const backlinkIndexer = workspace.indexer.backlink;

    const pageId = page.addBlock('affine:page', {
      title: new page.Text(''),
    });
    const noteId = page.addBlock('affine:note', {}, pageId);

    const text = page.Text.fromDelta([
      {
        insert: ' ',
        attributes: { reference: { type: 'Subpage', pageId: subpage.id } },
      },
    ]);
    page.addBlock(
      'affine:paragraph',
      {
        text,
      },
      noteId
    );

    // wait for the backlink index to be updated
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(backlinkIndexer.getBacklink(page.id)).toStrictEqual([]);
    expect(backlinkIndexer.getBacklink(subpage.id)).toStrictEqual([
      {
        blockId: '2',
        pageId: 'page:home',
        type: 'Subpage',
      },
    ]);

    text.format(0, 1, { reference: null });

    expect(backlinkIndexer.getBacklink(page.id)).toStrictEqual([]);

    expect(backlinkIndexer.getBacklink(subpage.id)).toStrictEqual([]);
  });

  it('backlink indexer works with linked page', async () => {
    const page0 = await createTestPage();
    const workspace = page0.workspace;
    const page1 = await createTestPage('space:page1', workspace);
    const backlinkIndexer = workspace.indexer.backlink;

    const page0Id = page0.addBlock('affine:page');
    const note0Id = page0.addBlock('affine:note', {}, page0Id);

    page0.addBlock(
      'affine:paragraph',
      {
        text: page0.Text.fromDelta([
          {
            insert: ' ',
            attributes: { reference: { type: 'LinkedPage', pageId: page0.id } },
          },
        ]),
      },
      note0Id
    );
    const paragraphId2 = page0.addBlock(
      'affine:paragraph',
      {
        text: page1.Text.fromDelta([
          {
            insert: ' ',
            attributes: { reference: { type: 'LinkedPage', pageId: page1.id } },
          },
        ]),
      },
      note0Id
    );
    const paragraph2 = page0.getBlockById(paragraphId2);

    const page1Id = page1.addBlock('affine:page');
    const note1Id = page1.addBlock('affine:note', {}, page1Id);

    page1.addBlock(
      'affine:paragraph',
      {
        text: page1.Text.fromDelta([
          {
            insert: ' ',
            attributes: { reference: { type: 'LinkedPage', pageId: page0.id } },
          },
        ]),
      },
      note1Id
    );
    const paragraphId4 = page1.addBlock(
      'affine:paragraph',
      {
        text: page1.Text.fromDelta([
          {
            insert: ' ',
            attributes: { reference: { type: 'LinkedPage', pageId: page1.id } },
          },
        ]),
      },
      note1Id
    );
    const paragraph4 = page1.getBlockById(paragraphId4);

    // wait for the backlink index to be updated
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(backlinkIndexer.getBacklink(page0.id)).toStrictEqual([
      {
        blockId: '2',
        pageId: 'page:home',
        type: 'LinkedPage',
      },
      {
        blockId: '6',
        pageId: 'space:page1',
        type: 'LinkedPage',
      },
    ]);

    expect(backlinkIndexer.getBacklink(page1.id)).toStrictEqual([
      {
        blockId: '3',
        pageId: 'page:home',
        type: 'LinkedPage',
      },
      {
        blockId: '7',
        pageId: 'space:page1',
        type: 'LinkedPage',
      },
    ]);

    paragraph2?.text?.delete(0, paragraph2.text.length);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    page1.updateBlock(paragraph4!, { text: new page1.Text() });

    expect(backlinkIndexer.getBacklink(page0.id)).toStrictEqual([
      {
        blockId: '2',
        pageId: 'page:home',
        type: 'LinkedPage',
      },
      {
        blockId: '6',
        pageId: 'space:page1',
        type: 'LinkedPage',
      },
    ]);

    expect(backlinkIndexer.getBacklink(page1.id)).toStrictEqual([]);
  });
});
