import { BlockViewExtension, FlavourExtension } from '@labre/std';
import type { ExtensionType } from '@labre/store';
import { literal } from 'lit/static-html.js';

export const DataViewBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:data-view'),
  BlockViewExtension('affine:data-view', literal`affine-data-view`),
];
