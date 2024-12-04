import {
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
  WidgetViewMapExtension,
} from '@blocksuite/block-std';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { AFFINE_CODE_TOOLBAR_WIDGET } from '../root-block/widgets/code-toolbar/index.js';
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
    codeToolbar: literal`${unsafeStatic(AFFINE_CODE_TOOLBAR_WIDGET)}`,
  }),
  CodeBlockInlineManagerExtension,
  CodeBlockUnitSpecExtension,
];
