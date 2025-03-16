import type { ExtensionType } from '@blocksuite/store';

import { InlineManagerExtension } from './extension/index.js';
import {
  BackgroundInlineSpecExtension,
  BoldInlineSpecExtension,
  CodeInlineSpecExtension,
  ColorInlineSpecExtension,
  FootNoteInlineSpecExtension,
  InlineAdapterExtensions,
  InlineSpecExtensions,
  ItalicInlineSpecExtension,
  LatexInlineSpecExtension,
  LinkInlineSpecExtension,
  MarkdownExtensions,
  ReferenceInlineSpecExtension,
  StrikeInlineSpecExtension,
  UnderlineInlineSpecExtension,
} from './inline/index.js';
import { LatexEditorInlineManagerExtension } from './inline/presets/nodes/latex-node/latex-editor-menu.js';

export const DefaultInlineManagerExtension = InlineManagerExtension({
  id: 'DefaultInlineManager',
  specs: [
    BoldInlineSpecExtension.identifier,
    ItalicInlineSpecExtension.identifier,
    UnderlineInlineSpecExtension.identifier,
    StrikeInlineSpecExtension.identifier,
    CodeInlineSpecExtension.identifier,
    BackgroundInlineSpecExtension.identifier,
    ColorInlineSpecExtension.identifier,
    LatexInlineSpecExtension.identifier,
    ReferenceInlineSpecExtension.identifier,
    LinkInlineSpecExtension.identifier,
    FootNoteInlineSpecExtension.identifier,
  ],
});

export const RichTextExtensions: ExtensionType[] = [
  InlineSpecExtensions,
  MarkdownExtensions,
  LatexEditorInlineManagerExtension,
  DefaultInlineManagerExtension,
  InlineAdapterExtensions,
].flat();
