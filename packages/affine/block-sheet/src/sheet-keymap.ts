import { textKeymap } from '@blocksuite/affine-components/rich-text';
import { SheetBlockSchema } from '@blocksuite/affine-model';
import { KeymapExtension } from '@blocksuite/block-std';

export const SheetKeymapExtension = KeymapExtension(
  () => {
    return {
      Enter: () => {},
      'Mod-Enter': () => {},
      Tab: () => {},
      'Shift-Tab': () => {},
      Backspace: () => {},
      'Control-d': () => {},
      Delete: () => {},
      Space: () => {},
      'Shift-Space': () => {},
    };
  },
  {
    flavour: SheetBlockSchema.model.flavour,
  }
);

export const SheetTextKeymapExtension = KeymapExtension(textKeymap, {
  flavour: SheetBlockSchema.model.flavour,
});
