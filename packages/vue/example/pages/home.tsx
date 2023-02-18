/* eslint-disable react-hooks/rules-of-hooks */
import type { Page } from '@blocksuite/store';
import { useBlockSuiteStore } from '@blocksuite/vue';
import { Editor } from '@blocksuite/vue/editor.js';
import { createCurrentWorkspaceActions } from '@blocksuite/vue/store/currentWorkspace/index.js';
import { createManagerActions } from '@blocksuite/vue/store/manager/index.js';
import { defineComponent } from 'vue';

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

export const HomePage = defineComponent({
  setup() {
    const store = useBlockSuiteStore();
    const managerActions = createManagerActions(store);
    const workspaceActions = createCurrentWorkspaceActions(store);

    workspaceActions.createPage();
    return () => {
      // const currentPage = store.currentPage as Page;
      const currentPage = store.pages[0] as Page;
      workspaceActions.setCurrentPage(store.pages[0] as Page);

      if (!currentPage) {
        return null;
      }
      console.log(currentPage);

      return (
        <div>
          <Editor
            page={() => currentPage}
            onInit={async (page, editor) => {
              const pageBlockId = page.addBlockByFlavour('affine:page', {
                title: 'Welcome to BlockSuite Vue example',
                children: [],
              });
              page.addBlockByFlavour('affine:surface', {}, null);
              const frameId = page.addBlockByFlavour(
                'affine:frame',
                {},
                pageBlockId
              );
              // Import preset markdown content inside frame block
              await editor.clipboard.importMarkdown(presetMarkdown, frameId);
              page.resetHistory();
            }}
          />
        </div>
      );
    };
  },
});
