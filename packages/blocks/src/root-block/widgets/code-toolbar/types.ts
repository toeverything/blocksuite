import type { TemplateResult } from 'lit';

import type { CodeBlockComponent } from '../../../code-block/code-block.js';

type CodeToolbarItemBase = {
  name: string | ((codeBlock: CodeBlockComponent) => string);
  tooltip: string;
  icon: TemplateResult | ((codeBlock: CodeBlockComponent) => TemplateResult);
  showWhen: (codeBlock: CodeBlockComponent) => boolean;
};

export type CodeToolbarActionItem = CodeToolbarItemBase & {
  type: 'action';
  action: (codeBlock: CodeBlockComponent, onClick?: () => void) => void;
};

export type CodeToolbarCustomItem = CodeToolbarItemBase & {
  type: 'custom';
  render: (
    codeBlock: CodeBlockComponent,
    onClick?: () => void
  ) => TemplateResult | null;
};

export type CodeToolbarItem = CodeToolbarActionItem | CodeToolbarCustomItem;

export type DividerItem = {
  type: 'divider';
};

export type MoreItem = CodeToolbarItemBase & {
  type: 'more';
  action: (
    codeBlock: CodeBlockComponent,
    abortController: AbortController
  ) => void;
};

export type CodeToolbarMoreItem = MoreItem | DividerItem;
