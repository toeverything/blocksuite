import type { InlineEditor, InlineRootElement } from '@blocksuite/inline';

import { html } from 'lit';
import { z } from 'zod';

import type { InlineSpecs } from '../inline-manager.js';
import type { ReferenceNodeConfig } from './nodes/reference-node/reference-config.js';

import './nodes/index.js';

export type AffineInlineEditor = InlineEditor<AffineTextAttributes>;
export type AffineInlineRootElement = InlineRootElement<AffineTextAttributes>;

export interface AffineTextAttributes {
  background?: null | string;
  bold?: null | true;
  code?: null | true;
  color?: null | string;
  italic?: null | true;
  link?: null | string;
  reference?: {
    pageId: string;
    type: 'LinkedPage' | 'Subpage';
  } | null;
  strike?: null | true;
  underline?: null | true;
}

export const affineInlineSpecsWithoutReference: InlineSpecs<AffineTextAttributes>[] =
  [
    {
      match: delta => {
        return !!delta.attributes?.bold;
      },
      name: 'bold',
      renderer: delta => {
        return html`<affine-text .delta=${delta}></affine-text>`;
      },
      schema: z.literal(true).optional().nullable().catch(undefined),
    },
    {
      match: delta => {
        return !!delta.attributes?.italic;
      },
      name: 'italic',
      renderer: delta => {
        return html`<affine-text .delta=${delta}></affine-text>`;
      },
      schema: z.literal(true).optional().nullable().catch(undefined),
    },
    {
      match: delta => {
        return !!delta.attributes?.underline;
      },
      name: 'underline',
      renderer: delta => {
        return html`<affine-text .delta=${delta}></affine-text>`;
      },
      schema: z.literal(true).optional().nullable().catch(undefined),
    },
    {
      match: delta => {
        return !!delta.attributes?.strike;
      },
      name: 'strike',
      renderer: delta => {
        return html`<affine-text .delta=${delta}></affine-text>`;
      },
      schema: z.literal(true).optional().nullable().catch(undefined),
    },
    {
      match: delta => {
        return !!delta.attributes?.code;
      },
      name: 'code',
      renderer: delta => {
        return html`<affine-text .delta=${delta}></affine-text>`;
      },
      schema: z.literal(true).optional().nullable().catch(undefined),
    },
    {
      match: delta => {
        return !!delta.attributes?.background;
      },
      name: 'background',
      renderer: delta => {
        return html`<affine-text .delta=${delta}></affine-text>`;
      },
      schema: z.string().optional().nullable().catch(undefined),
    },
    {
      match: delta => {
        return !!delta.attributes?.color;
      },
      name: 'color',
      renderer: delta => {
        return html`<affine-text .delta=${delta}></affine-text>`;
      },
      schema: z.string().optional().nullable().catch(undefined),
    },
  ];

export function getAffineInlineSpecsWithReference(
  referenceNodeConfig: ReferenceNodeConfig
): InlineSpecs<AffineTextAttributes>[] {
  return [
    ...affineInlineSpecsWithoutReference,
    {
      embed: true,
      match: delta => {
        return !!delta.attributes?.reference;
      },
      name: 'reference',
      renderer: (delta, selected) => {
        return html`<affine-reference
          .delta=${delta}
          .selected=${selected}
          .config=${referenceNodeConfig}
        ></affine-reference>`;
      },
      schema: z
        .object({
          pageId: z.string(),
          type: z.enum([
            // @deprecated Subpage is deprecated, use LinkedPage instead
            'Subpage',
            'LinkedPage',
          ]),
        })
        .optional()
        .nullable()
        .catch(undefined),
    },
    {
      match: delta => {
        return !!delta.attributes?.link;
      },
      name: 'link',
      renderer: delta => {
        return html`<affine-link .delta=${delta}></affine-link>`;
      },
      schema: z.string().optional().nullable().catch(undefined),
    },
  ];
}
