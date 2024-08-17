import type { BlockStdScope, UIEventHandler } from '@blocksuite/block-std';

import { textFormatConfigs } from '../format/index.js';

export const textFormatKeymap = (std: BlockStdScope) =>
  textFormatConfigs
    .filter(config => config.hotkey)
    .reduce(
      (acc, config) => {
        return {
          ...acc,
          [config.hotkey as string]: ctx => {
            const { doc, selection } = std;
            if (doc.readonly) return;

            const textSelection = selection.find('text');
            if (!textSelection) return;

            config.action(std.host);
            ctx.get('keyboardState').raw.preventDefault();
            return true;
          },
        };
      },
      {} as Record<string, UIEventHandler>
    );
