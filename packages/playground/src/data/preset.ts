import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from '@blocksuite/blocks';
import { type Workspace } from '@blocksuite/store';

import { addShapeElement, type InitFn } from './utils';

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

export const preset: InitFn = (workspace: Workspace, id: string) => {
  const page = workspace.createPage({ id });

  // Add page block and surface block at root level
  const pageBlockId = page.addBlock('affine:page', {
    title: new Text('Welcome to BlockSuite Playground'),
  });
  const surfaceBlockId = page.addBlock('affine:surface', {}, pageBlockId);

  // Add frame block inside page block
  const frameId = page.addBlock('affine:frame', {}, pageBlockId);
  // Import preset markdown content inside frame block
  const contentParser = new window.ContentParser(page);
  addShapeElement(page, surfaceBlockId, {
    id: '0',
    index: 'a0',
    type: 'shape',
    xywh: '[0,0,100,100]',
    seed: Math.floor(Math.random() * 2 ** 31),

    shapeType: 'rect',

    radius: 0,
    filled: false,
    fillColor: DEFAULT_SHAPE_FILL_COLOR,
    strokeWidth: 4,
    strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
    strokeStyle: 'solid',
  });
  contentParser.importMarkdown(presetMarkdown, frameId);
};

preset.id = 'preset';
preset.displayName = 'BlockSuite Starter';
preset.description = 'Start from friendly introduction';
