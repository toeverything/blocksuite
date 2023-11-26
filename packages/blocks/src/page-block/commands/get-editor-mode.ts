import type { Command } from '@blocksuite/block-std';

import type { AbstractEditor } from '../../_common/utils/index.js';

export const getEditorModeCommand: Command<'root', 'currentEditorMode'> = (
  ctx,
  next
) => {
  const root = ctx.root;
  if (!root) return;

  const editorContainer = root.closest('editor-container') as AbstractEditor;
  if (!editorContainer) return;

  const currentEditorMode = editorContainer.mode;
  if (currentEditorMode) {
    next({ currentEditorMode });
  }
};

declare global {
  namespace BlockSuite {
    interface CommandData {
      currentEditorMode?: 'page' | 'edgeless';
    }

    interface Commands {
      getEditorMode: typeof getEditorModeCommand;
    }
  }
}
