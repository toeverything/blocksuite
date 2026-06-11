import type { AffineTextAttributes } from '@labre/affine-shared/types';
import { StdIdentifier } from '@labre/std';
import { InlineSpecExtension } from '@labre/std/inline';
import { html } from 'lit';
import { z } from 'zod';

export const LinkInlineSpecExtension =
  InlineSpecExtension<AffineTextAttributes>('link', provider => {
    const std = provider.get(StdIdentifier);
    return {
      name: 'link',
      schema: z.object({
        link: z.string().optional().nullable().catch(undefined),
      }),
      match: delta => {
        return !!delta.attributes?.link;
      },
      renderer: ({ delta }) => {
        return html`<affine-link .std=${std} .delta=${delta}></affine-link>`;
      },
    };
  });
