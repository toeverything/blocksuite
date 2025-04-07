import type { GfxToolsFullOptionValue } from '@blocksuite/std/gfx';

export type Pen = Extract<
  GfxToolsFullOptionValue['type'],
  'brush' | 'highlighter'
>;

export type PenMap<T> = Record<Pen, T>;
