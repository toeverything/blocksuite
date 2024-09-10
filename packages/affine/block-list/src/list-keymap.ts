import {
  markdownInput,
  textKeymap,
} from '@blocksuite/affine-components/rich-text';
import { ListBlockSchema } from '@blocksuite/affine-model';
import { KeymapExtension } from '@blocksuite/block-std';
import { IS_MAC } from '@blocksuite/global/env';

import { forwardDelete } from './utils/forward-delete.js';

export const ListKeymapExtension = KeymapExtension(
  std => {
    return {
      Enter: ctx => {
        const text = std.selection.find('text');
        if (!text) return false;

        ctx.get('keyboardState').raw.preventDefault();
        std.command.exec('splitList', {
          blockId: text.from.blockId,
          inlineIndex: text.from.index,
        });
        return true;
      },
      'Mod-Enter': ctx => {
        const text = std.selection.find('text');
        if (!text) return false;

        ctx.get('keyboardState').raw.preventDefault();
        std.command.exec('splitList', {
          blockId: text.from.blockId,
          inlineIndex: text.from.index,
        });
        return true;
      },
      Tab: ctx => {
        const { selectedModels } = std.command.exec('getSelectedModels', {
          types: ['text'],
        });
        if (selectedModels?.length !== 1) {
          return false;
        }
        const text = std.selection.find('text');
        if (!text) return false;

        ctx.get('keyboardState').raw.preventDefault();
        std.command.exec('indentList', {
          blockId: text.from.blockId,
          inlineIndex: text.from.index,
        });
        return true;
      },
      'Shift-Tab': ctx => {
        const { selectedModels } = std.command.exec('getSelectedModels', {
          types: ['text'],
        });
        if (selectedModels?.length !== 1) {
          return;
        }
        const text = std.selection.find('text');
        if (!text) return false;

        ctx.get('keyboardState').raw.preventDefault();
        std.command.exec('dedentList', {
          blockId: text.from.blockId,
          inlineIndex: text.from.index,
        });
        return true;
      },
      Backspace: ctx => {
        const text = std.selection.find('text');
        if (!text) return false;
        const isCollapsed = text.isCollapsed();
        const isStart = isCollapsed && text.from.index === 0;
        if (!isStart) return false;

        ctx.get('keyboardState').raw.preventDefault();
        std.command.exec('listToParagraph', { id: text.from.blockId });
        return true;
      },
      'Control-d': ctx => {
        if (!IS_MAC) return;
        const deleted = forwardDelete(std);
        if (!deleted) return;
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
      Delete: ctx => {
        const deleted = forwardDelete(std);
        if (!deleted) return;
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
      Space: ctx => {
        if (!markdownInput(std)) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
      'Shift-Space': ctx => {
        if (!markdownInput(std)) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
    };
  },
  {
    flavour: ListBlockSchema.model.flavour,
  }
);

export const ListTextKeymapExtension = KeymapExtension(textKeymap, {
  flavour: ListBlockSchema.model.flavour,
});
