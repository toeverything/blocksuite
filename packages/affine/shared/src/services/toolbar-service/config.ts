import type { Placement } from '@floating-ui/dom';

import type { ToolbarActions } from './action';

export type ToolbarModuleConfig = {
  actions: ToolbarActions;

  placement?: Extract<Placement, 'top' | 'top-start'>;
};
