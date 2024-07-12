import type { TemplateResult } from 'lit';

import type { ImageBlockComponent } from '../../../image-block/image-block.js';

export type DefaultItemConfig = {
  action: (
    blockElement: ImageBlockComponent,
    abortController: AbortController,
    onClick?: () => void
  ) => void;
  icon: TemplateResult;
  name: string;
  showWhen: (blockElement: ImageBlockComponent) => boolean;
  tooltip: string;
};

export type CommonItem = {
  type: 'common';
} & DefaultItemConfig;

export type MoreItem = {
  type: 'more';
} & DefaultItemConfig;

export type DividerItem = {
  showWhen: (blockElement: ImageBlockComponent) => boolean;
  type: 'divider';
};

export type CustomItem = {
  render: (
    blockElement: ImageBlockComponent,
    onClick?: () => void
  ) => TemplateResult | null;
  showWhen: (blockElement: ImageBlockComponent) => boolean;
  type: 'custom';
};

export type ImageConfigItem = CommonItem | CustomItem;
export type MoreMenuConfigItem = DividerItem | MoreItem;
