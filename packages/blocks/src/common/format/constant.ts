import type { Flavour } from '../../models.js';

// corresponding to `formatText` command
export const FORMAT_TEXT_SUPPORT_FLAVOURS: Flavour[] = [
  'affine:paragraph',
  'affine:list',
];
// corresponding to `formatBlock` command
export const FORMAT_BLOCK_SUPPORT_FLAVOURS: Flavour[] = [
  'affine:paragraph',
  'affine:list',
];
// corresponding to `formatNative` command
export const FORMAT_NATIVE_SUPPORT_FLAVOURS: Flavour[] = ['affine:database'];
