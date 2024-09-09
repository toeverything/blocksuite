import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
  WidgetViewMapExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import {
  CodeBlockInlineManagerExtension,
  CodeBlockUnitSpecExtension,
} from './code-block-inline.js';
import { CodeBlockService } from './code-block-service.js';

export const CodeBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:code'),
  CodeBlockService,
  BlockViewExtension('affine:code', literal`affine-code`),
  WidgetViewMapExtension('affine:code', {
    codeToolbar: literal`affine-code-toolbar-widget`,
    codeLangList: literal`affine-code-language-list-widget`,
  }),
  CodeBlockInlineManagerExtension,
  CodeBlockUnitSpecExtension,
];
