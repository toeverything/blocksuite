/**
 * Manually create initial page structure.
 * In collaboration mode or on page refresh with local persistence,
 * the page structure will be automatically loaded from provider.
 * In these cases, these functions should not be called.
 */
import { Page, Text, Workspace } from '@blocksuite/store';
import BlockTag = BlockSuiteInternal.BlockTag;

export function heavy(workspace: Workspace) {
  workspace.signals.pageAdded.once(id => {
    const page = workspace.getPage(id) as Page;
    const pageBlockId = page.addBlockByFlavour('affine:page');
    page.addBlock(
      {
        flavour: 'affine:surface',
      },
      null
    );
    const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);
    for (let i = 0; i < 1000; i++) {
      page.addBlock(
        {
          flavour: 'affine:paragraph',
          text: new Text(page, 'Hello, world! ' + i),
        },
        frameId
      );
    }
  });

  workspace.createPage('page0');
}

const presetMarkdown = `This playground is designed to:

* 📝 Test basic editing experience.
* ⚙️ Serve as E2E test entry.
* 🔗 Demonstrate how BlockSuite reconciles real-time collaboration with [local-first](https://martin.kleppmann.com/papers/local-first.pdf) data ownership.

## Controlling Playground Data Source
You might initially enter this page with the \`?init\` URL param. This is the default (opt-in) setup that automatically loads this built-in article. Meanwhile, you'll connect to a random single-user room via a WebRTC provider by default. This is the “single-user mode“ for local testing.

To test real-time collaboration, you can specify the room to join by adding the \`?room=foo\` config - Try opening this page with \`?room=foo\` in two different tabs and see what happens!

> Note that the second and subsequent users should not open the page with the \`?init\` param in this case. Also, due to the P2P nature of WebRTC, as long as there is at least one user connected to the room, the content inside the room will **always** exist.

If you are the only user in the room, your content will be lost after refresh. This is great for local debugging. But if you want local persistence, you can open this page with the \`?providers=indexeddb&room=foo\` config, then click the init button in the bottom-left corner to initialize this default content.

As a pro tip, you can combine multiple providers! For example, feel free to open this page with \`?providers=indexeddb,webrtc&room=hello\` params, and see if everything works as expected. Have fun!

For any feedback, please visit [BlockSuite issues](https://github.com/toeverything/blocksuite/issues) 📍`;

export function basic(workspace: Workspace) {
  workspace.signals.pageAdded.once(async id => {
    const page = workspace.getPage(id) as Page;
    const pageBlockId = page.addBlock({
      flavour: 'affine:page',
      title: 'Welcome to BlockSuite playground',
    });
    page.addBlockByFlavour('affine:surface', {}, null);

    const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);
    await window.editor.clipboard.importMarkdown(presetMarkdown, frameId);

    requestAnimationFrame(() => page.resetHistory());
  });

  workspace.createPage('page0');
}

export function database(workspace: Workspace) {
  workspace.signals.pageAdded.once(async id => {
    const page = workspace.getPage(id) as Page;
    const pageBlockId = page.addBlock({
      flavour: 'affine:page',
      title: 'Welcome to BlockSuite playground',
    });
    page.addBlockByFlavour('affine:surface', {}, null);

    const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);
    type Option = 'Done' | 'TODO' | 'WIP';
    const options = ['Done', 'TODO', 'WIP'] as Option[];
    const databaseId = page.addBlockByFlavour(
      'affine:database',
      {
        columns: [
          {
            id: '1',
            flavour: 'affine-tag:text',
            name: 'Tag',
            metadata: {
              color: '#FA851E',
              width: 100,
              hide: false,
            },
          },
          {
            id: '2',
            flavour: 'affine-tag:option',
            name: 'Option',
            enum: options,
            metadata: {
              color: '#C7BAF3',
              width: 100,
              hide: false,
            },
          },
        ],
      },
      frameId
    );
    const paragraphId = page.addBlockByFlavour(
      'affine:paragraph',
      {
        text: new Text(page, 'hello, world'),
      },
      databaseId
    );

    const paragraph2Id = page.addBlockByFlavour(
      'affine:paragraph',
      {
        text: new Text(page, 'test'),
      },
      databaseId
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    page.updateBlockTag(page.getBlockById(paragraphId)!, {
      type: '1',
      value: 'text1',
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    page.updateBlockTag<BlockTag<BlockSuiteInternal.OptionTagType<Option>>>(
      page.getBlockById(paragraph2Id)!,
      {
        type: '2',
        value: 'TODO',
      }
    );

    requestAnimationFrame(() => page.resetHistory());
  });

  workspace.createPage('page0');
}
