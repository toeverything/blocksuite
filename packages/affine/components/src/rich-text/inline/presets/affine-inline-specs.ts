import type { ReferenceInfo } from '@blocksuite/affine-model';
import type { InlineEditor, InlineRootElement } from '@blocksuite/inline';

import { ReferenceInfoSchema } from '@blocksuite/affine-model';
import { html } from 'lit';
import { z } from 'zod';

import type { InlineSpecs } from '../inline-manager.js';
import type { ReferenceNodeConfig } from './nodes/reference-node/reference-config.js';

export type AffineInlineEditor = InlineEditor<AffineTextAttributes>;
export type AffineInlineRootElement = InlineRootElement<AffineTextAttributes>;

export interface AffineTextAttributes {
  bold?: true | null;
  italic?: true | null;
  underline?: true | null;
  strike?: true | null;
  code?: true | null;
  link?: string | null;
  reference?:
    | ({
        type: 'Subpage' | 'LinkedPage';
      } & ReferenceInfo)
    | null;
  background?: string | null;
  color?: string | null;
  latex?: string | null;
}

export const basicAffineInlineSpecs: InlineSpecs<AffineTextAttributes>[] = [
  {
    name: 'bold',
    schema: z.literal(true).optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.bold;
    },
    renderer: ({ delta }) => {
      return html`<affine-text .delta=${delta}></affine-text>`;
    },
  },
  {
    name: 'italic',
    schema: z.literal(true).optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.italic;
    },
    renderer: ({ delta }) => {
      return html`<affine-text .delta=${delta}></affine-text>`;
    },
  },
  {
    name: 'underline',
    schema: z.literal(true).optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.underline;
    },
    renderer: ({ delta }) => {
      return html`<affine-text .delta=${delta}></affine-text>`;
    },
  },
  {
    name: 'strike',
    schema: z.literal(true).optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.strike;
    },
    renderer: ({ delta }) => {
      return html`<affine-text .delta=${delta}></affine-text>`;
    },
  },
  {
    name: 'code',
    schema: z.literal(true).optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.code;
    },
    renderer: ({ delta }) => {
      return html`<affine-text .delta=${delta}></affine-text>`;
    },
  },
  {
    name: 'background',
    schema: z.string().optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.background;
    },
    renderer: ({ delta }) => {
      return html`<affine-text .delta=${delta}></affine-text>`;
    },
  },
  {
    name: 'color',
    schema: z.string().optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.color;
    },
    renderer: ({ delta }) => {
      return html`<affine-text .delta=${delta}></affine-text>`;
    },
  },
  {
    name: 'latex',
    schema: z.string().optional().nullable().catch(undefined),
    match: delta => typeof delta.attributes?.latex === 'string',
    renderer: ({ delta, selected, editor, startOffset, endOffset }) => {
      return html`<affine-latex-node
        .delta=${delta}
        .selected=${selected}
        .editor=${editor}
        .startOffset=${startOffset}
        .endOffset=${endOffset}
      ></affine-latex-node>`;
    },
    embed: true,
  },
];

export function getAffineInlineSpecsWithReference(
  referenceNodeConfig: ReferenceNodeConfig
): InlineSpecs<AffineTextAttributes>[] {
  return [
    ...basicAffineInlineSpecs,
    {
      name: 'reference',
      schema: z
        .object({
          type: z.enum([
            // @deprecated Subpage is deprecated, use LinkedPage instead
            'Subpage',
            'LinkedPage',
          ]),
        })
        .merge(ReferenceInfoSchema)
        .optional()
        .nullable()
        .catch(undefined),
      match: delta => {
        return !!delta.attributes?.reference;
      },
      renderer: ({ delta, selected }) => {
        return html`<affine-reference
          .delta=${delta}
          .selected=${selected}
          .config=${referenceNodeConfig}
        ></affine-reference>`;
      },
      embed: true,
    },
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
}
