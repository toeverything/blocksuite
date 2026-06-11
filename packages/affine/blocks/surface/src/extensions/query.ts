import type { Connectable, NoteBlockModel } from '@labre/affine-model';
import type { GfxModel } from '@labre/std/gfx';
import type { BlockModel } from '@labre/store';

export function isConnectable(
  element: GfxModel | null
): element is Connectable {
  return !!element && element.connectable;
}

export function isNoteBlock(
  element: BlockModel | GfxModel | null
): element is NoteBlockModel {
  return !!element && 'flavour' in element && element.flavour === 'affine:note';
}
