import type { TemplateResult } from 'lit';

import { DarkLoadingIcon, LightLoadingIcon } from '../_common/icons/text.js';
import { getThemeMode } from '../_common/utils/query.js';
import type { EmbedLinkedPageStyles } from './embed-linked-page-model.js';
import {
  DarkLinkedDocDeletedLargeBanner,
  DarkLinkedDocDeletedSmallBanner,
  DarkLinkedDocEmptyLargeBanner,
  DarkLinkedDocEmptySmallBanner,
  DarkLinkedEdgelessDeletedLargeBanner,
  DarkLinkedEdgelessDeletedSmallBanner,
  DarkLinkedEdgelessEmptyLargeBanner,
  DarkLinkedEdgelessEmptySmallBanner,
  LightLinkedDocDeletedLargeBanner,
  LightLinkedDocDeletedSmallBanner,
  LightLinkedDocEmptyLargeBanner,
  LightLinkedDocEmptySmallBanner,
  LightLinkedEdgelessDeletedLargeBanner,
  LightLinkedEdgelessDeletedSmallBanner,
  LightLinkedEdgelessEmptyLargeBanner,
  LightLinkedEdgelessEmptySmallBanner,
  LinkedDocIcon,
  LinkedEdgelessIcon,
  LinkedPageDeletedIcon,
} from './styles.js';

type EmbedCardImages = {
  LoadingIcon: TemplateResult<1>;
  LinkedPageIcon: TemplateResult<1>;
  LinkedPageDeletedIcon: TemplateResult<1>;
  LinkedPageEmptyBanner: TemplateResult<1>;
  LinkedPageDeletedBanner: TemplateResult<1>;
};

export const getEmbedLinkedPageIcons = (
  pageType: 'page' | 'edgeless',
  style: (typeof EmbedLinkedPageStyles)[number]
): EmbedCardImages => {
  const theme = getThemeMode();
  const small = style !== 'vertical';
  if (pageType === 'page') {
    if (theme === 'light') {
      return {
        LoadingIcon: LightLoadingIcon,
        LinkedPageIcon: LinkedDocIcon,
        LinkedPageDeletedIcon,
        LinkedPageEmptyBanner: small
          ? LightLinkedDocEmptySmallBanner
          : LightLinkedDocEmptyLargeBanner,
        LinkedPageDeletedBanner: small
          ? LightLinkedDocDeletedSmallBanner
          : LightLinkedDocDeletedLargeBanner,
      };
    } else {
      return {
        LoadingIcon: DarkLoadingIcon,
        LinkedPageIcon: LinkedDocIcon,
        LinkedPageDeletedIcon,
        LinkedPageEmptyBanner: small
          ? DarkLinkedDocEmptySmallBanner
          : DarkLinkedDocEmptyLargeBanner,
        LinkedPageDeletedBanner: small
          ? DarkLinkedDocDeletedSmallBanner
          : DarkLinkedDocDeletedLargeBanner,
      };
    }
  } else {
    if (theme === 'light') {
      return {
        LoadingIcon: LightLoadingIcon,
        LinkedPageIcon: LinkedEdgelessIcon,
        LinkedPageDeletedIcon,
        LinkedPageEmptyBanner: small
          ? LightLinkedEdgelessEmptySmallBanner
          : LightLinkedEdgelessEmptyLargeBanner,
        LinkedPageDeletedBanner: small
          ? LightLinkedEdgelessDeletedSmallBanner
          : LightLinkedEdgelessDeletedLargeBanner,
      };
    } else {
      return {
        LoadingIcon: DarkLoadingIcon,
        LinkedPageIcon: LinkedEdgelessIcon,
        LinkedPageDeletedIcon,
        LinkedPageEmptyBanner: small
          ? DarkLinkedEdgelessEmptySmallBanner
          : DarkLinkedEdgelessEmptyLargeBanner,
        LinkedPageDeletedBanner: small
          ? DarkLinkedEdgelessDeletedSmallBanner
          : DarkLinkedEdgelessDeletedLargeBanner,
      };
    }
  }
};
