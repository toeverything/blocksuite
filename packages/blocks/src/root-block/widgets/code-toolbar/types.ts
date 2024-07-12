import type { TemplateResult } from 'lit';

import type { CodeBlockComponent } from '../../../code-block/code-block.js';

type CodeToolbarItemBase = {
  icon: ((codeBlock: CodeBlockComponent) => TemplateResult) | TemplateResult;
  name: ((codeBlock: CodeBlockComponent) => string) | string;
  showWhen: (codeBlock: CodeBlockComponent) => boolean;
  tooltip: string;
};

export type CodeToolbarActionItem = {
  action: (codeBlock: CodeBlockComponent, onClick?: () => void) => void;
  type: 'action';
} & CodeToolbarItemBase;

export type CodeToolbarCustomItem = {
  render: (
    codeBlock: CodeBlockComponent,
    onClick?: () => void
  ) => TemplateResult | null;
  type: 'custom';
} & CodeToolbarItemBase;

export type CodeToolbarItem = CodeToolbarActionItem | CodeToolbarCustomItem;

export type DividerItem = {
  type: 'divider';
};

export type MoreItem = {
  action: (
    codeBlock: CodeBlockComponent,
    abortController: AbortController
  ) => void;
  type: 'more';
} & CodeToolbarItemBase;

export type CodeToolbarMoreItem = DividerItem | MoreItem;
