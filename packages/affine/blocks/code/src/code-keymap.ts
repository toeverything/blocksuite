import { textKeymap } from '@labre/affine-inline-preset';
import { CodeBlockSchema } from '@labre/affine-model';
import { KeymapExtension } from '@labre/std';

export const CodeKeymapExtension = KeymapExtension(textKeymap, {
  flavour: CodeBlockSchema.model.flavour,
});
