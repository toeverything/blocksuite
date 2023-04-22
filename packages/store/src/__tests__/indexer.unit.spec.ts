/* eslint-disable @typescript-eslint/no-restricted-imports */
// checkout https://vitest.dev/guide/debugging.html for debugging tests
import { describe, expect, it } from 'vitest';

// Use manual per-module import/export to support vitest environment on Node.js
import { PageBlockSchema } from '../../../blocks/src/page-block/page-model.js';
import { ParagraphBlockSchema } from '../../../blocks/src/paragraph-block/paragraph-model.js';
import { Generator, Workspace } from '../index.js';

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  return { id: 'test-workspace', idGenerator, isSSR: true };
}

export const BlockSchemas = [ParagraphBlockSchema, PageBlockSchema];

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

describe('backlink works', () => {
  // const blockIndexer = new BlockIndexer(workspace.doc, {
  //   slots: workspace.slots,
  // });

  it('backlink indexer works with subpage', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchemas);
    const backlinkIndexer = workspace.indexer.backlink;

    const page = workspace.createPage('page0');
    const subpage = workspace.createPage('page1');

    page.addBlock('affine:page');
    const text = page.Text.fromDelta([
      {
        insert: ' ',
        attributes: { reference: { type: 'Subpage', pageId: subpage.id } },
      },
    ]);
    page.addBlock('affine:paragraph', {
      text,
    });

    // wait for the backlink index to be updated
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(backlinkIndexer.getBacklink(page.id)).toStrictEqual([]);
    expect(backlinkIndexer.getSubpageNodes(page.id)).toStrictEqual([
      {
        blockId: '1',
        pageId: 'page1',
        type: 'Subpage',
      },
    ]);
    expect(backlinkIndexer.getBacklink(subpage.id)).toStrictEqual([
      {
        blockId: '1',
        pageId: 'page0',
        type: 'Subpage',
      },
    ]);

    expect(backlinkIndexer.getSubpageNodes(subpage.id)).toStrictEqual([]);

    text.format(0, 1, { reference: null });

    expect(backlinkIndexer.getBacklink(page.id)).toStrictEqual([]);
    expect(backlinkIndexer.getSubpageNodes(page.id)).toStrictEqual([]);

    expect(backlinkIndexer.getBacklink(subpage.id)).toStrictEqual([]);
    expect(backlinkIndexer.getSubpageNodes(subpage.id)).toStrictEqual([]);
  });

  it('backlink indexer works with linked page', async () => {
    const options = createTestOptions();
    const workspace = new Workspace(options).register(BlockSchemas);
    const backlinkIndexer = workspace.indexer.backlink;

    const page0 = workspace.createPage('page0');
    const page1 = workspace.createPage('page1');

    page0.addBlock('affine:page');
    page0.addBlock('affine:paragraph', {
      text: page0.Text.fromDelta([
        {
          insert: ' ',
          attributes: { reference: { type: 'LinkedPage', pageId: page0.id } },
        },
      ]),
    });
    const paragraphId2 = page0.addBlock('affine:paragraph', {
      text: page1.Text.fromDelta([
        {
          insert: ' ',
          attributes: { reference: { type: 'LinkedPage', pageId: page1.id } },
        },
      ]),
    });
    const paragraph2 = page0.getBlockById(paragraphId2);

    page1.addBlock('affine:page');
    page1.addBlock('affine:paragraph', {
      text: page1.Text.fromDelta([
        {
          insert: ' ',
          attributes: { reference: { type: 'LinkedPage', pageId: page0.id } },
        },
      ]),
    });
    const paragraphId4 = page1.addBlock('affine:paragraph', {
      text: page1.Text.fromDelta([
        {
          insert: ' ',
          attributes: { reference: { type: 'LinkedPage', pageId: page1.id } },
        },
      ]),
    });
    const paragraph4 = page1.getBlockById(paragraphId4);

    // wait for the backlink index to be updated
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(backlinkIndexer.getBacklink(page0.id)).toStrictEqual([
      {
        blockId: '1',
        pageId: 'page0',
        type: 'LinkedPage',
      },
      {
        blockId: '4',
        pageId: 'page1',
        type: 'LinkedPage',
      },
    ]);
    expect(backlinkIndexer.getSubpageNodes(page0.id)).toStrictEqual([]);

    expect(backlinkIndexer.getBacklink(page1.id)).toStrictEqual([
      {
        blockId: '2',
        pageId: 'page0',
        type: 'LinkedPage',
      },
      {
        blockId: '5',
        pageId: 'page1',
        type: 'LinkedPage',
      },
    ]);
    expect(backlinkIndexer.getSubpageNodes(page1.id)).toStrictEqual([]);

    paragraph2.text.delete(0, paragraph2.text.length);
    page1.updateBlock(paragraph4, { text: new page1.Text() });

    expect(backlinkIndexer.getBacklink(page0.id)).toStrictEqual([
      {
        blockId: '1',
        pageId: 'page0',
        type: 'LinkedPage',
      },
      {
        blockId: '4',
        pageId: 'page1',
        type: 'LinkedPage',
      },
    ]);
    expect(backlinkIndexer.getSubpageNodes(page0.id)).toStrictEqual([]);

    expect(backlinkIndexer.getBacklink(page1.id)).toStrictEqual([]);
    expect(backlinkIndexer.getSubpageNodes(page1.id)).toStrictEqual([]);
  });
});
