import { serializeXYWH } from '@blocksuite/blocks';
import type { Workspace } from '@blocksuite/store';
import { Text } from '@blocksuite/store';

import { type InitFn } from './utils';

const presetMarkdown = `This playground is designed to:

* 📝 Test basic editing experience.
* ⚙️ Serve as E2E test entry.
* 🔗 Demonstrate how BlockSuite reconciles real-time collaboration with [local-first](https://martin.kleppmann.com/papers/local-first.pdf) data ownership.

## Controlling Playground Data Source
You might initially enter this page with the \`?init\` URL param. This is the default (opt-in) setup that automatically loads this built-in article. Meanwhile, you'll connect to a random single-user room via a broadcast channel provider by default. This is the "single-user mode" for local testing.

To test real-time collaboration, you can specify the room to join by adding the \`?room=foo\` config - Try opening this page with \`?room=foo\` in two different tabs and see what happens!

> Note that the second and subsequent users should not open the page with the \`?init\` param in this case.

If you are the only user in the room, your content will be lost after refresh. This is great for local debugging. But if you want local persistence, you can open this page with the \`?providers=idb&room=foo\` config, then click the init button in the bottom-left corner to initialize this default content.

As a pro tip, you can combine multiple providers! For example, feel free to open this page with \`?providers=idb,bc&room=hello\` params (IndexedDB + BroadcastChannel), and see if everything works as expected. Have fun!

For any feedback, please visit [BlockSuite issues](https://github.com/toeverything/blocksuite/issues) 📍`;

export const preset: InitFn = async (workspace: Workspace, id: string) => {
  const page = workspace.getPage(id) ?? workspace.createPage({ id });
  page.clear();
  await page.waitForLoaded();
  // Add page block and surface block at root level
  const pageBlockId = page.addBlock('affine:page', {
    title: new Text('Welcome to BlockSuite Playground'),
  });

  // Add note block inside page block
  const noteId = page.addBlock(
    'affine:note',
    { xywh: serializeXYWH(0, 100, 800, 640) },
    pageBlockId
  );

  page.addBlock('affine:surface', {}, pageBlockId);
  // Import preset markdown content inside note block
  const contentParser = new window.ContentParser(page);

  await contentParser.importMarkdown(presetMarkdown, noteId);
  page.resetHistory();
};

preset.id = 'preset';
preset.displayName = 'BlockSuite Starter';
preset.description = 'Start from friendly introduction';
