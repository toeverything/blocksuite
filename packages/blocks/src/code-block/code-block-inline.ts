import {
  BackgroundInlineSpecExtension,
  BoldInlineSpecExtension,
  CodeInlineSpecExtension,
  ColorInlineSpecExtension,
  InlineManagerExtension,
  InlineSpecExtension,
  ItalicInlineSpecExtension,
  LatexInlineSpecExtension,
  LinkInlineSpecExtension,
  StrikeInlineSpecExtension,
  UnderlineInlineSpecExtension,
} from '@blocksuite/affine-components/rich-text';
import { html } from 'lit';
import { z } from 'zod';

export const CodeBlockUnitSpecExtension = InlineSpecExtension({
  name: 'code-block-unit',
  schema: z.undefined(),
  match: () => true,
  renderer: ({ delta }) => {
    return html`<affine-code-unit .delta=${delta}></affine-code-unit>`;
  },
});

export const CodeBlockInlineManagerExtension = InlineManagerExtension({
  id: 'CodeBlockInlineManager',
  enableMarkdown: false,
  specs: [
    BoldInlineSpecExtension.identifier,
    ItalicInlineSpecExtension.identifier,
    UnderlineInlineSpecExtension.identifier,
    StrikeInlineSpecExtension.identifier,
    CodeInlineSpecExtension.identifier,
    BackgroundInlineSpecExtension.identifier,
    ColorInlineSpecExtension.identifier,
    LatexInlineSpecExtension.identifier,
    LinkInlineSpecExtension.identifier,
    CodeBlockUnitSpecExtension.identifier,
  ],
});
