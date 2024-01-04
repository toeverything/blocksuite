import type { TemplateResult } from 'lit';

import { getThemeMode } from '../../_common/utils/query.js';
import type {
  BookmarkBlockModel,
  BookmarkBlockType,
} from '../bookmark-model.js';
import {
  DarkBanner,
  DarkLargeHorizontalCardIcon,
  DarkLargeVerticalCardIcon,
  DarkLoadingIcon,
  DarkSmallHorizontalCardIcon,
  DarkSmallVerticalCardIcon,
  LightBanner,
  LightLargeHorizontalCardIcon,
  LightLargeVerticalCardIcon,
  LightLoadingIcon,
  LightSmallHorizontalCardIcon,
  LightSmallVerticalCardIcon,
} from '../styles.js';
import type { BookmarkToolbar } from './bookmark-toolbar.js';

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
    element?: BookmarkToolbar
  ) => void;
  divider?: boolean;
};

export const STYLE_VALUES: BookmarkBlockType[] = [
  'horizontal',
  'list',
  'vertical',
  'cube',
];

export const STYLE_TOOLTIPS = [
  'Large Horizontal Style',
  'Small Horizontal Style',
  'Large Vertical Style',
  'Small Vertical Style',
];

export const STYLE_ICON_NAMES: (keyof BookmarkDefaultImages)[] = [
  'LargeHorizontalCardIcon',
  'SmallHorizontalCardIcon',
  'LargeVerticalCardIcon',
  'SmallVerticalCardIcon',
] as const;

type BookmarkDefaultImages = {
  LoadingIcon: TemplateResult<1>;
  BannerImage: TemplateResult<1>;
  LargeHorizontalCardIcon: TemplateResult<1>;
  SmallHorizontalCardIcon: TemplateResult<1>;
  LargeVerticalCardIcon: TemplateResult<1>;
  SmallVerticalCardIcon: TemplateResult<1>;
};

export function getBookmarkDefaultImages(): BookmarkDefaultImages {
  const theme = getThemeMode();
  if (theme === 'light') {
    return {
      LoadingIcon: LightLoadingIcon,
      BannerImage: LightBanner,
      LargeHorizontalCardIcon: LightLargeHorizontalCardIcon,
      SmallHorizontalCardIcon: LightSmallHorizontalCardIcon,
      LargeVerticalCardIcon: LightLargeVerticalCardIcon,
      SmallVerticalCardIcon: LightSmallVerticalCardIcon,
    };
  } else {
    return {
      LoadingIcon: DarkLoadingIcon,
      BannerImage: DarkBanner,
      LargeHorizontalCardIcon: DarkLargeHorizontalCardIcon,
      SmallHorizontalCardIcon: DarkSmallHorizontalCardIcon,
      LargeVerticalCardIcon: DarkLargeVerticalCardIcon,
      SmallVerticalCardIcon: DarkSmallVerticalCardIcon,
    };
  }
}
