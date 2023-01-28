/**
 * Manually create initial page structure.
 * In collaboration mode or on page refresh with local persistence,
 * the page structure will be automatically loaded from provider.
 * In these cases, these functions should not be called.
 */
import { Page, Text, Workspace } from '@blocksuite/store';
import BlockTag = BlockSuiteInternal.BlockTag;

export function empty(workspace: Workspace) {
  return new Promise<string>(resolve => {
    workspace.signals.pageAdded.once(pageId => {
      const page = workspace.getPage(pageId) as Page;

      // Add page block and surface block at root level
      const pageBlockId = page.addBlockByFlavour('affine:page', { title: '' });
      page.addBlockByFlavour('affine:surface', {}, null);

      // Add frame block inside page block
      const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);
      // Add paragraph block inside frame block
      page.addBlockByFlavour('affine:paragraph', {}, frameId);
      resolve(pageId);
    });

    workspace.createPage('page0');
  });
}

export function heavy(workspace: Workspace) {
  return new Promise<string>(resolve => {
    workspace.signals.pageAdded.once(pageId => {
      const page = workspace.getPage(pageId) as Page;

      // Add page block and surface block at root level
      const pageBlockId = page.addBlockByFlavour('affine:page');
      page.addBlockByFlavour('affine:surface', {}, null);

      // Add frame block inside page block
      const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);
      for (let i = 0; i < 1000; i++) {
        // Add paragraph block inside frame block
        page.addBlockByFlavour(
          'affine:paragraph',
          {
            text: new Text(page, 'Hello, world! ' + i),
          },
          frameId
        );
      }
      resolve(pageId);
    });

    workspace.createPage('page0');
  });
}

const presetMarkdown = `This example is designed to:

* ⚛️ Test react binding with BlockSuite.

For any feedback, please visit [BlockSuite issues](https://github.com/toeverything/blocksuite/issues) 📍`;

export function preset(workspace: Workspace) {
  return new Promise<string>(resolve => {
    workspace.signals.pageAdded.once(async pageId => {
      const page = workspace.getPage(pageId) as Page;

      // Add page block and surface block at root level
      const pageBlockId = page.addBlockByFlavour('affine:page', {
        title: 'Welcome to BlockSuite React Example',
      });
      page.addBlockByFlavour('affine:surface', {}, null);

      // Add frame block inside page block
      const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);
      // Import preset markdown content inside frame block
      await window.editor.clipboard.importMarkdown(presetMarkdown, frameId);

      requestAnimationFrame(() => {
        page.resetHistory();
        resolve(pageId);
      });
    });

    workspace.createPage('page0');
  });
}

export function database(workspace: Workspace) {
  return new Promise<string>(resolve => {
    workspace.signals.pageAdded.once(async pageId => {
      const page = workspace.getPage(pageId) as Page;

      // Add page block and surface block at root level
      const pageBlockId = page.addBlockByFlavour('affine:page', {
        title: 'Welcome to BlockSuite playground',
      });
      page.addBlockByFlavour('affine:surface', {}, null);

      // Add frame block inside page block
      const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);

      type Option = 'Done' | 'TODO' | 'WIP';
      const selection = ['Done', 'TODO', 'WIP'] as Option[];
      // Add database block inside frame block
      const databaseId = page.addBlockByFlavour(
        'affine:database',
        {
          columns: ['1', '2'],
        },
        frameId
      );
      const p1 = page.addBlockByFlavour(
        'affine:paragraph',
        {
          text: new page.Text(page, '1'),
        },
        databaseId
      );
      const p2 = page.addBlockByFlavour(
        'affine:paragraph',
        {
          text: new page.Text(page, '2'),
        },
        databaseId
      );

      page.setTagSchema({
        meta: {
          color: '#ff0000',
          width: 200,
          hide: false,
        },
        name: 'Select',
        id: '1',
        type: 'select',
        selection: selection,
      });
      page.setTagSchema({
        meta: {
          color: '#ff0000',
          width: 200,
          hide: false,
        },
        name: 'Select 2',
        id: '2',
        type: 'select',
        selection: selection,
      });

      page.updateBlockTag(p1, {
        type: '1',
        value: 'text1',
      });

      page.updateBlockTag<BlockTag<BlockSuiteInternal.SelectTagSchema<Option>>>(
        p2,
        {
          type: '2',
          value: 'TODO',
        }
      );

      requestAnimationFrame(() => {
        page.resetHistory();
        resolve(pageId);
      });
    });

    workspace.createPage('page0');
  });
}
