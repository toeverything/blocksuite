import type { TemplateResult } from 'lit';

import type { Menu } from '../../../_common/components/index.js';
import type { CodeBlockComponent } from '../../../code-block/code-block.js';

type CodeToolbarItemBase = {
  name: string;
  tooltip: string;
  showWhen: (codeBlock: CodeBlockComponent) => boolean;
};

export type CodeToolbarActionItem = CodeToolbarItemBase & {
  type: 'action';
  icon: TemplateResult;
  action: (codeBlock: CodeBlockComponent) => void;
};

export type CodeToolbarCustomItem = CodeToolbarItemBase & {
  type: 'custom';
  icon: TemplateResult;
  render: (codeBlock: CodeBlockComponent) => TemplateResult | null;
};

export type CodeToolbarItem = CodeToolbarActionItem | CodeToolbarCustomItem;

export type CodeToolbarMoreItem = {
  render: (codeBlock: CodeBlockComponent) => Menu;
  showWhen: (codeBlock: CodeBlockComponent) => boolean;
};
