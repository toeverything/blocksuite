/**
 * Manually create initial page structure.
 * In collaboration mode or on page refresh with local persistence,
 * the page structure will be automatically loaded from provider.
 * In these cases, these functions should not be called.
 */
import { ContentParser } from '@blocksuite/blocks';
import { Page, Text, Workspace } from '@blocksuite/store';

export interface InitFn {
  (workspace: Workspace): Promise<string>;
  id: string;
  displayName: string;
  description: string;
}

export const empty: InitFn = (workspace: Workspace) => {
  return new Promise<string>(resolve => {
    workspace.signals.pageAdded.once(pageId => {
      const page = workspace.getPage(pageId) as Page;

      // Add page block and surface block at root level
      const pageBlockId = page.addBlockByFlavour('affine:page', {
        title: new Text(),
      });

      page.addBlockByFlavour('affine:surface', {}, null);

      // Add frame block inside page block
      const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);
      // Add paragraph block inside frame block
      page.addBlockByFlavour('affine:paragraph', {}, frameId);

      requestAnimationFrame(() => {
        page.resetHistory();
        resolve(pageId);
      });
    });

    workspace.createPage('page0');
  });
};

empty.id = 'empty';
empty.displayName = 'Empty Editor';
empty.description = 'Start from empty editor';

export const heavy: InitFn = (workspace: Workspace) => {
  return new Promise<string>(resolve => {
    workspace.signals.pageAdded.once(pageId => {
      const page = workspace.getPage(pageId) as Page;

      // Add page block and surface block at root level
      const pageBlockId = page.addBlockByFlavour('affine:page', {
        title: new Text(),
      });
      page.addBlockByFlavour('affine:surface', {}, null);

      // Add frame block inside page block
      const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);
      for (let i = 0; i < 1000; i++) {
        // Add paragraph block inside frame block
        page.addBlockByFlavour(
          'affine:paragraph',
          {
            text: new Text('Hello, world! ' + i),
          },
          frameId
        );
      }
      resolve(pageId);
    });

    workspace.createPage('page0');
  });
};

heavy.id = 'heavy';
heavy.displayName = 'Heavy Example';
heavy.description = 'Heavy example on thousands of paragraph blocks';

const presetMarkdown = `This playground is designed to:

* 📝 Test basic editing experience.
* ⚙️ Serve as E2E test entry.
* 🔗 Demonstrate how BlockSuite reconciles real-time collaboration with [local-first](https://martin.kleppmann.com/papers/local-first.pdf) data ownership.

## Controlling Playground Data Source
You might initially enter this page with the \`?init\` URL param. This is the default (opt-in) setup that automatically loads this built-in article. Meanwhile, you'll connect to a random single-user room via a WebRTC provider by default. This is the "single-user mode" for local testing.

To test real-time collaboration, you can specify the room to join by adding the \`?room=foo\` config - Try opening this page with \`?room=foo\` in two different tabs and see what happens!

> Note that the second and subsequent users should not open the page with the \`?init\` param in this case. Also, due to the P2P nature of WebRTC, as long as there is at least one user connected to the room, the content inside the room will **always** exist.

If you are the only user in the room, your content will be lost after refresh. This is great for local debugging. But if you want local persistence, you can open this page with the \`?providers=indexeddb&room=foo\` config, then click the init button in the bottom-left corner to initialize this default content.

As a pro tip, you can combine multiple providers! For example, feel free to open this page with \`?providers=indexeddb,webrtc&room=hello\` params, and see if everything works as expected. Have fun!

For any feedback, please visit [BlockSuite issues](https://github.com/toeverything/blocksuite/issues) 📍`;

export const preset: InitFn = (workspace: Workspace) => {
  return new Promise<string>(resolve => {
    workspace.signals.pageAdded.once(async pageId => {
      const page = workspace.getPage(pageId) as Page;

      // Add page block and surface block at root level
      const pageBlockId = page.addBlockByFlavour('affine:page', {
        title: new Text('Welcome to BlockSuite playground'),
      });
      page.addBlockByFlavour('affine:surface', {}, null);

      // Add frame block inside page block
      const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);
      // Import preset markdown content inside frame block
      const contentParser = new ContentParser(page);
      await contentParser.importMarkdown(presetMarkdown, frameId);

      requestAnimationFrame(() => {
        page.resetHistory();
        resolve(pageId);
      });
    });

    workspace.createPage('page0');
  });
};

preset.id = 'preset';
preset.displayName = 'BlockSuite Starter';
preset.description = 'Start from friendly introduction';

export const database: InitFn = (workspace: Workspace) => {
  return new Promise<string>(resolve => {
    workspace.signals.pageAdded.once(async pageId => {
      const page = workspace.getPage(pageId) as Page;
      page.awarenessStore.setFlag('enable_database', true);

      // Add page block and surface block at root level
      const pageBlockId = page.addBlockByFlavour('affine:page', {
        title: new Text('Welcome to BlockSuite playground'),
      });
      page.addBlockByFlavour('affine:surface', {}, null);

      // Add frame block inside page block
      const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);

      type Option = 'Done' | 'TODO' | 'WIP';
      const selection = ['Done', 'TODO', 'WIP'] as Option[];
      const col1 = page.setTagSchema({
        internalProperty: {
          color: '#ff0000',
          width: 200,
          hide: false,
        },
        property: {
          decimal: 0,
        },
        name: 'Number',
        type: 'number',
      });
      const col2 = page.setTagSchema({
        internalProperty: {
          color: '#ff0000',
          width: 200,
          hide: false,
        },
        property: {
          selection: selection,
        },
        name: 'Select 2',
        type: 'select',
      });
      const col3 = page.setTagSchema({
        internalProperty: {
          color: '#ff0000',
          width: 200,
          hide: false,
        },
        property: {},
        name: 'Select 2',
        type: 'rich-text',
      });
      // Add database block inside frame block
      const databaseId = page.addBlockByFlavour(
        'affine:database',
        {
          columns: [col1, col2, col3],
        },
        frameId
      );
      const p1 = page.addBlockByFlavour(
        'affine:paragraph',
        {
          text: new page.Text('text1'),
        },
        databaseId
      );
      const p2 = page.addBlockByFlavour(
        'affine:paragraph',
        {
          text: new page.Text('text2'),
        },
        databaseId
      );

      page.updateBlockTag(p1, {
        schemaId: col1,
        value: 0.1,
      });

      page.updateBlockTag(p2, {
        schemaId: col2,
        value: 'TODO',
      });

      const text = new page.YText();
      text.insert(0, '123');
      text.insert(0, 'code');
      page.updateBlockTag(p2, {
        schemaId: col3,
        value: text,
      });

      // Add a paragraph after database
      page.addBlockByFlavour('affine:paragraph', {}, frameId);

      requestAnimationFrame(() => {
        page.resetHistory();
        resolve(pageId);
      });
    });

    workspace.createPage('page0');
  });
};

database.id = 'database';
database.displayName = 'Database Example';
database.description = 'Database block basic example';
