import { type AffineAIPanelWidget, InsertBelowIcon } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { CopilotClient } from '@blocksuite/presets';
import { html } from 'lit';

import { getInsertBelowHandler } from './response/insert-below';

export function setupAIPanel(panel: AffineAIPanelWidget) {
  const copilotClient = new CopilotClient('http://localhost:3010');

  panel.handleEvent('keyDown', ctx => {
    const keyboardState = ctx.get('keyboardState');
    if (keyboardState.raw.key === ' ') {
      const selection = panel.host.selection.find('text');
      if (selection && selection.isCollapsed() && selection.from.index === 0) {
        const block = panel.host.view.viewFromPath('block', selection.path);
        if (!block?.model?.text || block.model.text?.length > 0) return;

        keyboardState.raw.preventDefault();

        const insertBelow = getInsertBelowHandler(panel.host);
        assertExists(panel.config);
        panel.config.finishStateConfig.responses = [
          {
            name: 'Insert',
            icon: InsertBelowIcon,
            handler: () => insertBelow(panel),
          },
        ];
        panel.toggle(block);
      }
    }
  });

  panel.config = {
    answerRenderer: answer => html`<div>${answer}</div>`,
    generateAnswer: ({ input, update, finish, signal }) => {
      copilotClient
        .createSession({
          workspaceId: panel.host.doc.collection.id,
          docId: panel.host.doc.id,
          action: true,
          model: 'Gpt4TurboPreview',
          promptName: '',
        })
        .then(sessionId => {
          const stream = copilotClient.textToTextStream(input, sessionId);
          let timeout: ReturnType<typeof setTimeout> | null = null;
          stream.addEventListener('message', e => {
            if (timeout) clearTimeout(timeout);
            update((panel.answer ?? '') + e.data);

            // Terminate after 5 seconds of inactivity
            timeout = setTimeout(() => {
              finish('error');
              stream.close();
            }, 5000);
          });
          stream.addEventListener('error', () => {
            if (timeout) clearTimeout(timeout);
            finish('success');
          });
          signal.addEventListener('abort', () => {
            stream.close();
          });
        })
        .catch(console.error);
    },

    finishStateConfig: {
      responses: [],
      actions: [],
    },
    errorStateConfig: {
      upgrade: () => {},
      responses: [],
    },
  };
}
