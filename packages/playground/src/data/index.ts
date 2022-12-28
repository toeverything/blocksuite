/**
 * Manually create initial page structure.
 * In collaboration mode or on page refresh with local persistence,
 * the page structure will be automatically loaded from provider.
 * In these cases, these functions should not be called.
 */
import { Page, Text, Workspace } from '@blocksuite/store';

export const heavy = (workspace: Workspace) => {
  workspace.signals.pageAdded.once(id => {
    const page = workspace.getPage(id) as Page;
    const pageBlockId = page.addBlock({ flavour: 'affine:page' });
    const groupId = page.addBlock({ flavour: 'affine:group' }, pageBlockId);
    for (let i = 0; i < 1000; i++) {
      page.addBlock(
        {
          flavour: 'affine:paragraph',
          text: new Text(page, 'Hello, world! ' + i),
        },
        groupId
      );
    }
  });

  workspace.createPage('page0');
};

export const basic = (workspace: Workspace) => {
  workspace.signals.pageAdded.once(id => {
    const page = workspace.getPage(id) as Page;
    const pageBlockId = page.addBlock({
      flavour: 'affine:page',
      title: 'Welcome to BlockSuite playground',
    });
    const groupId = page.addBlock({ flavour: 'affine:group' }, pageBlockId);
    page.addBlock(
      {
        flavour: 'affine:paragraph',
        text: new Text(
          page,
          'This playground is a demo environment built with BlockSuite.'
        ),
      },
      groupId
    );
    page.addBlock(
      {
        flavour: 'affine:paragraph',
        text: Text.fromDelta(page, [
          {
            insert: 'Try ',
          },
          {
            insert: 'typing',
            attributes: {
              bold: true,
            },
          },
          {
            insert: ', ',
          },
          {
            insert: 'formatting',
            attributes: {
              italic: true,
            },
          },
          {
            insert: ', and ',
          },
          {
            insert: 'dragging',
            attributes: {
              underline: true,
              strike: false,
            },
          },
          {
            insert: ' here!',
          },
        ]),
      },
      groupId
    );
    page.addBlock(
      {
        flavour: 'affine:paragraph',
        text: Text.fromDelta(page, [
          {
            insert: 'A quick tip 💡: Try removing the ',
          },
          {
            insert: '?init',
            attributes: {
              code: true,
            },
          },
          {
            insert: ' part in the URL and open it in another tab!',
          },
        ]),
      },
      groupId
    );
    page.resetHistory();
  });

  workspace.createPage('page0');
};
