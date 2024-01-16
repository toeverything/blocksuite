import type { TemplateResult } from 'lit';

import { DarkLoadingIcon, LightLoadingIcon } from '../_common/icons/text.js';
import { getThemeMode } from '../_common/utils/query.js';
import type { EmbedLinkedDocStyles } from './embed-linked-doc-model.js';
import {
  DarkLinkedEdgelessDeletedLargeBanner,
  DarkLinkedEdgelessDeletedSmallBanner,
  DarkLinkedEdgelessEmptyLargeBanner,
  DarkLinkedEdgelessEmptySmallBanner,
  DarkLinkedPageDeletedLargeBanner,
  DarkLinkedPageDeletedSmallBanner,
  DarkLinkedPageEmptyLargeBanner,
  DarkLinkedPageEmptySmallBanner,
  LightLinkedEdgelessDeletedLargeBanner,
  LightLinkedEdgelessDeletedSmallBanner,
  LightLinkedEdgelessEmptyLargeBanner,
  LightLinkedEdgelessEmptySmallBanner,
  LightLinkedPageDeletedLargeBanner,
  LightLinkedPageDeletedSmallBanner,
  LightLinkedPageEmptyLargeBanner,
  LightLinkedPageEmptySmallBanner,
  LinkedDocDeletedIcon,
  LinkedEdgelessIcon,
  LinkedPageIcon,
} from './styles.js';

type EmbedCardImages = {
  LoadingIcon: TemplateResult<1>;
  LinkedDocIcon: TemplateResult<1>;
  LinkedDocDeletedIcon: TemplateResult<1>;
  LinkedDocEmptyBanner: TemplateResult<1>;
  LinkedDocDeletedBanner: TemplateResult<1>;
};

export const getEmbedLinkedDocIcons = (
  pageType: 'page' | 'edgeless',
  style: (typeof EmbedLinkedDocStyles)[number]
): EmbedCardImages => {
  const theme = getThemeMode();
  const small = style !== 'vertical';
  if (pageType === 'page') {
    if (theme === 'light') {
      return {
        LoadingIcon: LightLoadingIcon,
        LinkedDocIcon: LinkedPageIcon,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? LightLinkedPageEmptySmallBanner
          : LightLinkedPageEmptyLargeBanner,
        LinkedDocDeletedBanner: small
          ? LightLinkedPageDeletedSmallBanner
          : LightLinkedPageDeletedLargeBanner,
      };
    } else {
      return {
        LoadingIcon: DarkLoadingIcon,
        LinkedDocIcon: LinkedPageIcon,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? DarkLinkedPageEmptySmallBanner
          : DarkLinkedPageEmptyLargeBanner,
        LinkedDocDeletedBanner: small
          ? DarkLinkedPageDeletedSmallBanner
          : DarkLinkedPageDeletedLargeBanner,
      };
    }
  } else {
    if (theme === 'light') {
      return {
        LoadingIcon: LightLoadingIcon,
        LinkedDocIcon: LinkedEdgelessIcon,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? LightLinkedEdgelessEmptySmallBanner
          : LightLinkedEdgelessEmptyLargeBanner,
        LinkedDocDeletedBanner: small
          ? LightLinkedEdgelessDeletedSmallBanner
          : LightLinkedEdgelessDeletedLargeBanner,
      };
    } else {
      return {
        LoadingIcon: DarkLoadingIcon,
        LinkedDocIcon: LinkedEdgelessIcon,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? DarkLinkedEdgelessEmptySmallBanner
          : DarkLinkedEdgelessEmptyLargeBanner,
        LinkedDocDeletedBanner: small
          ? DarkLinkedEdgelessDeletedSmallBanner
          : DarkLinkedEdgelessDeletedLargeBanner,
      };
    }
  }
};
