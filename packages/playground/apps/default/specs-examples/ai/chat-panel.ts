import type { AffineEditorContainer } from '@blocksuite/presets';
import { AIProvider } from '@blocksuite/presets';

import { CustomChatPanel } from '../../../_common/components/custom-chat-panel';

export function attachChatPanel(editor: AffineEditorContainer) {
  const chatPanel = new CustomChatPanel();
  chatPanel.editor = editor;
  AIProvider.slots.requestContinueInChat.on(show => {
    if (show) chatPanel.show();
  });
  document.body.append(chatPanel);
  return chatPanel;
}
