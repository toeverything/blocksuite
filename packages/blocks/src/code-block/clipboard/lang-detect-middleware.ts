import type { JobMiddleware } from '@blocksuite/store';

import { matchFlavours } from '../../_common/utils/model.js';
import type { CodeBlockComponent } from '../code-block.js';
import { isPlaintext } from '../utils/code-languages.js';

export const languageDetectMiddleware = (
  host: CodeBlockComponent
): JobMiddleware => {
  const codeService = host.service;
  // Since the paste should be handled in the same event loop,
  // we only store the block id in a variable
  let canGuessLangBlockId: string | null = null;
  return ({ slots }) => {
    slots.beforeImport.on(payload => {
      if (
        payload.type !== 'block' ||
        payload.snapshot.flavour !== 'affine:code'
      )
        return;

      const pastedModel = host.model;
      const beforePastedText = pastedModel.text.yText.toString();
      const textSelection = host.std.selection.find('text');
      const selectAll =
        textSelection &&
        textSelection.from.index === 0 &&
        textSelection.from.length === beforePastedText.length;

      if (beforePastedText && !selectAll) {
        // Only detect language when pasting text into an empty block
        return;
      }
      // Mark the block as guessable
      canGuessLangBlockId = payload.snapshot.id;
    });
    slots.afterImport.on(async payload => {
      if (payload.type !== 'block') return;
      const { model } = payload;
      if (model.id !== canGuessLangBlockId) return;
      canGuessLangBlockId = null;
      if (!matchFlavours(model, ['affine:code'])) return;
      // Only detect language for plaintext blocks
      if (!isPlaintext(model.language)) return;

      const detectionResult = await codeService.detectLanguage(model);
      if (!detectionResult) {
        return;
      }
      // Update the language of the block
      model.doc.updateBlock(model, {
        language: detectionResult.language.id,
      });
    });
  };
};
