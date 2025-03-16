import { FootNoteSchema, ReferenceInfoSchema } from '@blocksuite/affine-model';
import { ToolbarModuleExtension } from '@blocksuite/affine-shared/services';
import type { AffineTextAttributes } from '@blocksuite/affine-shared/types';
import { BlockFlavourIdentifier, StdIdentifier } from '@blocksuite/block-std';
import type { InlineEditor, InlineRootElement } from '@blocksuite/inline';
import { html } from 'lit';
import { z } from 'zod';

import { InlineSpecExtension } from '../../extension/index.js';
import { FootNoteNodeConfigIdentifier } from './nodes/footnote-node/footnote-config.js';
import { builtinInlineLinkToolbarConfig } from './nodes/link-node/configs/toolbar.js';
import { builtinInlineReferenceToolbarConfig } from './nodes/reference-node/configs/toolbar.js';
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
    if (config.interactable !== undefined) {
      configProvider.setInteractable(config.interactable);
    }
    if (config.hidePopup !== undefined) {
      configProvider.setHidePopup(config.hidePopup);
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
          .std=${std}
          .delta=${delta}
          .selected=${selected}
          .config=${configProvider}
        ></affine-reference>`;
      },
      embed: true,
    };
  }
);

export const LinkInlineSpecExtension = InlineSpecExtension('link', provider => {
  const std = provider.get(StdIdentifier);
  return {
    name: 'link',
    schema: z.string().optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.link;
    },
    renderer: ({ delta }) => {
      return html`<affine-link .std=${std} .delta=${delta}></affine-link>`;
    },
  };
});

export const LatexEditorUnitSpecExtension = InlineSpecExtension({
  name: 'latex-editor-unit',
  schema: z.undefined(),
  match: () => true,
  renderer: ({ delta }) => {
    return html`<latex-editor-unit .delta=${delta}></latex-editor-unit>`;
  },
});

export const FootNoteInlineSpecExtension = InlineSpecExtension(
  'footnote',
  provider => {
    const std = provider.get(StdIdentifier);
    const config =
      provider.getOptional(FootNoteNodeConfigIdentifier) ?? undefined;
    return {
      name: 'footnote',
      schema: FootNoteSchema.optional().nullable().catch(undefined),
      match: delta => {
        return !!delta.attributes?.footnote;
      },
      renderer: ({ delta }) => {
        return html`<affine-footnote-node
          .delta=${delta}
          .std=${std}
          .config=${config}
        ></affine-footnote-node>`;
      },
      embed: true,
    };
  }
);

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
  FootNoteInlineSpecExtension,

  ToolbarModuleExtension({
    id: BlockFlavourIdentifier('affine:reference'),
    config: builtinInlineReferenceToolbarConfig,
  }),

  ToolbarModuleExtension({
    id: BlockFlavourIdentifier('affine:link'),
    config: builtinInlineLinkToolbarConfig,
  }),
];
