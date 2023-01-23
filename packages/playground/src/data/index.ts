/**
 * Manually create initial page structure.
 * In collaboration mode or on page refresh with local persistence,
 * the page structure will be automatically loaded from provider.
 * In these cases, these functions should not be called.
 */
import { Page, Text, Workspace } from '@blocksuite/store';

export function empty(workspace: Workspace) {
  return new Promise<string>(resolve => {
    workspace.signals.pageAdded.once(pageId => {
      const page = workspace.getPage(pageId) as Page;
      const pageBlockId = page.addBlockByFlavour('affine:page', { title: '' });
      const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);
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
      const pageBlockId = page.addBlockByFlavour('affine:page');
      page.addBlockByFlavour('affine:surface', {}, null);
      const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);
      for (let i = 0; i < 1000; i++) {
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
  return new Promise<string>(resolve => {
    workspace.signals.pageAdded.once(async pageId => {
      const page = workspace.getPage(pageId) as Page;
      const pageBlockId = page.addBlock({
        flavour: 'affine:page',
        title: 'Welcome to BlockSuite playground',
      });
      page.addBlock({ flavour: 'affine:surface' }, null);

      const frameId = page.addBlock({ flavour: 'affine:frame' }, pageBlockId);
      await window.editor.clipboard.importMarkdown(presetMarkdown, frameId);

      requestAnimationFrame(() => {
        page.resetHistory();
        resolve(pageId);
      });
    });

    workspace.createPage('page0');
  });
}
