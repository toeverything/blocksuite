/* eslint-disable @typescript-eslint/no-restricted-imports */
// checkout https://vitest.dev/guide/debugging.html for debugging tests
import { describe, expect, it } from 'vitest';

// Use manual per-module import/export to support vitest environment on Node.js
import { FrameBlockSchema } from '../../../blocks/src/frame-block/frame-model.js';
import { PageBlockSchema } from '../../../blocks/src/page-block/page-model.js';
import { ParagraphBlockSchema } from '../../../blocks/src/paragraph-block/paragraph-model.js';
import type { Page } from '../index.js';
import { Generator, Workspace } from '../index.js';

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  return { id: 'test-workspace', idGenerator, isSSR: true };
}

export const BlockSchemas = [
  ParagraphBlockSchema,
  PageBlockSchema,
  FrameBlockSchema,
];

function createTestPage(pageId = 'page0', workspace?: Workspace) {
  const options = createTestOptions();
  const _workspace = workspace || new Workspace(options).register(BlockSchemas);
  const page = _workspace.createPage({ id: pageId });
  return new Promise<Page>(resolve => {
    page.onLoadSlot.once(() => {
      resolve(page);
    });
  });
}

describe.skip('workspace.search works', () => {
  it('workspace search matching', async () => {
    const page = await createTestPage();
    const workspace = page.workspace;

    const pageId = page.addBlock('affine:page', {
      title: new page.Text(''),
    });
    const frameId = page.addBlock('affine:frame', {}, pageId);

    page.addBlock(
      'affine:paragraph',
      {
        text: new page.Text(
          '英特尔第13代酷睿i7-1370P移动处理器现身Geekbench，14核心和5GHz'
        ),
      },
      frameId
    );

    page.addBlock(
      'affine:paragraph',
      {
        text: new page.Text(
          '索尼考虑移植《GT赛车7》，又一PlayStation独占IP登陆PC平台'
        ),
      },
      frameId
    );

    const id = page.id.replace('space:', '');

    queueMicrotask(() => {
      expect(workspace.search('处理器')).toStrictEqual(new Map([['2', id]]));
      expect(workspace.search('索尼')).toStrictEqual(new Map([['3', id]]));
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
    const frameId = page.addBlock('affine:frame', {}, pageId);

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
      frameId
    );

    // wait for the backlink index to be updated
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(backlinkIndexer.getBacklink(page.id)).toStrictEqual([]);
    expect(backlinkIndexer.getBacklink(subpage.id)).toStrictEqual([
      {
        blockId: '2',
        pageId: 'page0',
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
    const page1 = await createTestPage('page1', workspace);
    const backlinkIndexer = workspace.indexer.backlink;

    const page0Id = page0.addBlock('affine:page');
    const frame0Id = page0.addBlock('affine:frame', {}, page0Id);

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
      frame0Id
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
      frame0Id
    );
    const paragraph2 = page0.getBlockById(paragraphId2);

    const page1Id = page1.addBlock('affine:page');
    const frame1Id = page1.addBlock('affine:frame', {}, page1Id);

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
      frame1Id
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
      frame1Id
    );
    const paragraph4 = page1.getBlockById(paragraphId4);

    // wait for the backlink index to be updated
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(backlinkIndexer.getBacklink(page0.id)).toStrictEqual([
      {
        blockId: '2',
        pageId: 'page0',
        type: 'LinkedPage',
      },
      {
        blockId: '6',
        pageId: 'page1',
        type: 'LinkedPage',
      },
    ]);

    expect(backlinkIndexer.getBacklink(page1.id)).toStrictEqual([
      {
        blockId: '3',
        pageId: 'page0',
        type: 'LinkedPage',
      },
      {
        blockId: '7',
        pageId: 'page1',
        type: 'LinkedPage',
      },
    ]);

    paragraph2.text.delete(0, paragraph2.text.length);
    page1.updateBlock(paragraph4, { text: new page1.Text() });

    expect(backlinkIndexer.getBacklink(page0.id)).toStrictEqual([
      {
        blockId: '2',
        pageId: 'page0',
        type: 'LinkedPage',
      },
      {
        blockId: '6',
        pageId: 'page1',
        type: 'LinkedPage',
      },
    ]);

    expect(backlinkIndexer.getBacklink(page1.id)).toStrictEqual([]);
  });
});
