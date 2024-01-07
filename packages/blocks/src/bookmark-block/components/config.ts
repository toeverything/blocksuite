import type { TemplateResult } from 'lit';

import type { LinkCardToolbar } from '../../_common/components/link-card/link-card-toolbar.js';
import type { BookmarkBlockModel } from '../bookmark-model.js';

export type ToolbarActionCallback = (type: ConfigItem['type']) => void;

type ConfigItem = {
  type: 'link' | 'card' | 'embed' | 'edit' | 'caption' | 'card-style';
  icon: TemplateResult;
  tooltip: string;
  showWhen?: (model: BookmarkBlockModel) => boolean;
  disableWhen?: (model: BookmarkBlockModel) => boolean;
  action: (
    model: BookmarkBlockModel,
    /**
     * @deprecated
     */
    callback?: ToolbarActionCallback,
    element?: LinkCardToolbar
  ) => void;
  divider?: boolean;
};
