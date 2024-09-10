import type { InlineEditor, InlineRootElement } from '@blocksuite/inline';

import { ReferenceInfoSchema } from '@blocksuite/affine-model';
import { StdIdentifier } from '@blocksuite/block-std';
import { html } from 'lit';
import { z } from 'zod';

import {
  type AffineTextAttributes,
  InlineSpecExtension,
} from '../../extension/index.js';
import {
  ReferenceNodeConfigIdentifier,
  ReferenceNodeConfigProvider,
} from './nodes/reference-node/reference-config.js';

export type AffineInlineEditor = InlineEditor<AffineTextAttributes>;
export type AffineInlineRootElement = InlineRootElement<AffineTextAttributes>;

export const BoldInlineSpecExtension = InlineSpecExtension({
  name: 'bold',
  schema: z.literal(true).optional().nullable().catch(undefined),
  match: delta => {
    return !!delta.attributes?.bold;
  },
  renderer: ({ delta }) => {
    return html`<affine-text .delta=${delta}></affine-text>`;
  },
});

export const ItalicInlineSpecExtension = InlineSpecExtension({
  name: 'italic',
  schema: z.literal(true).optional().nullable().catch(undefined),
  match: delta => {
    return !!delta.attributes?.italic;
  },
  renderer: ({ delta }) => {
    return html`<affine-text .delta=${delta}></affine-text>`;
  },
});

export const UnderlineInlineSpecExtension = InlineSpecExtension({
  name: 'underline',
  schema: z.literal(true).optional().nullable().catch(undefined),
  match: delta => {
    return !!delta.attributes?.underline;
  },
  renderer: ({ delta }) => {
    return html`<affine-text .delta=${delta}></affine-text>`;
  },
});

export const StrikeInlineSpecExtension = InlineSpecExtension({
  name: 'strike',
  schema: z.literal(true).optional().nullable().catch(undefined),
  match: delta => {
    return !!delta.attributes?.strike;
  },
  renderer: ({ delta }) => {
    return html`<affine-text .delta=${delta}></affine-text>`;
  },
});

export const CodeInlineSpecExtension = InlineSpecExtension({
  name: 'code',
  schema: z.literal(true).optional().nullable().catch(undefined),
  match: delta => {
    return !!delta.attributes?.code;
  },
  renderer: ({ delta }) => {
    return html`<affine-text .delta=${delta}></affine-text>`;
  },
});

export const BackgroundInlineSpecExtension = InlineSpecExtension({
  name: 'background',
  schema: z.string().optional().nullable().catch(undefined),
  match: delta => {
    return !!delta.attributes?.background;
  },
  renderer: ({ delta }) => {
    return html`<affine-text .delta=${delta}></affine-text>`;
  },
});

export const ColorInlineSpecExtension = InlineSpecExtension({
  name: 'color',
  schema: z.string().optional().nullable().catch(undefined),
  match: delta => {
    return !!delta.attributes?.color;
  },
  renderer: ({ delta }) => {
    return html`<affine-text .delta=${delta}></affine-text>`;
  },
});

export const LatexInlineSpecExtension = InlineSpecExtension(
  'latex',
  provider => {
    const std = provider.get(StdIdentifier);
    return {
      name: 'latex',
      schema: z.string().optional().nullable().catch(undefined),
      match: delta => typeof delta.attributes?.latex === 'string',
      renderer: ({ delta, selected, editor, startOffset, endOffset }) => {
        return html`<affine-latex-node
          .std=${std}
          .delta=${delta}
          .selected=${selected}
          .editor=${editor}
          .startOffset=${startOffset}
          .endOffset=${endOffset}
        ></affine-latex-node>`;
      },
      embed: true,
    };
  }
);

export const ReferenceInlineSpecExtension = InlineSpecExtension(
  'reference',
  provider => {
    const std = provider.get(StdIdentifier);
    const configProvider = new ReferenceNodeConfigProvider(std);
    const config = provider.getOptional(ReferenceNodeConfigIdentifier) ?? {};
    if (config.customContent) {
      configProvider.setCustomContent(config.customContent);
    }
    if (config.customIcon) {
      configProvider.setCustomIcon(config.customIcon);
    }
    if (config.customTitle) {
      configProvider.setCustomTitle(config.customTitle);
    }
    if (config.interactable !== undefined) {
      configProvider.setInteractable(config.interactable);
    }
    return {
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
          .config=${configProvider}
        ></affine-reference>`;
      },
      embed: true,
    };
  }
);

export const LinkInlineSpecExtension = InlineSpecExtension({
  name: 'link',
  schema: z.string().optional().nullable().catch(undefined),
  match: delta => {
    return !!delta.attributes?.link;
  },
  renderer: ({ delta }) => {
    return html`<affine-link .delta=${delta}></affine-link>`;
  },
});

export const LatexEditorUnitSpecExtension = InlineSpecExtension({
  name: 'latex-editor-unit',
  schema: z.undefined(),
  match: () => true,
  renderer: ({ delta }) => {
    return html`<latex-editor-unit .delta=${delta}></latex-editor-unit>`;
  },
});

export const InlineSpecExtensions = [
  BoldInlineSpecExtension,
  ItalicInlineSpecExtension,
  UnderlineInlineSpecExtension,
  StrikeInlineSpecExtension,
  CodeInlineSpecExtension,
  BackgroundInlineSpecExtension,
  ColorInlineSpecExtension,
  LatexInlineSpecExtension,
  ReferenceInlineSpecExtension,
  LinkInlineSpecExtension,
  LatexEditorUnitSpecExtension,
];
