import {
  type AffineTextAttributes,
  basicAffineInlineSpecs,
  type InlineSpecs,
} from '@blocksuite/affine-components/rich-text';
import { html } from 'lit';
import { z } from 'zod';

export type CodeBlockTextAttributes = AffineTextAttributes & {
  'code-block-unit'?: null;
};

export const codeBlockInlineSpecs: InlineSpecs<CodeBlockTextAttributes>[] = [
  {
    name: 'code-block-unit',
    schema: z.undefined(),
    match: () => true,
    renderer: ({ delta }) => {
      return html`<affine-code-unit .delta=${delta}></affine-code-unit>`;
    },
  },
  ...basicAffineInlineSpecs,
  {
    name: 'link',
    schema: z.string().optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.link;
    },
    renderer: ({ delta }) => {
      return html`<affine-link .delta=${delta}></affine-link>`;
    },
  },
];
