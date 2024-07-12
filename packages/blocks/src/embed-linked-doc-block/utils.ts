import type { TemplateResult } from 'lit';

import type { EmbedLinkedDocStyles } from './embed-linked-doc-model.js';

import {
  DarkLoadingIcon,
  EmbedEdgelessIcon,
  EmbedPageIcon,
  LightLoadingIcon,
  ReloadIcon,
} from '../_common/icons/text.js';
import { getThemeMode } from '../_common/utils/query.js';
import {
  DarkSyncedDocErrorBanner,
  LightSyncedDocErrorBanner,
} from '../embed-synced-doc-block/styles.js';
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
} from './styles.js';

type EmbedCardImages = {
  LinkedDocDeletedBanner: TemplateResult<1>;
  LinkedDocDeletedIcon: TemplateResult<1>;
  LinkedDocEmptyBanner: TemplateResult<1>;
  LinkedDocIcon: TemplateResult<1>;
  LoadingIcon: TemplateResult<1>;
  ReloadIcon: TemplateResult<1>;
  SyncedDocErrorBanner: TemplateResult<1>;
};

export function getEmbedLinkedDocIcons(
  editorMode: 'edgeless' | 'page',
  style: (typeof EmbedLinkedDocStyles)[number]
): EmbedCardImages {
  const theme = getThemeMode();
  const small = style !== 'vertical';
  if (editorMode === 'page') {
    if (theme === 'light') {
      return {
        LinkedDocDeletedBanner: small
          ? LightLinkedPageDeletedSmallBanner
          : LightLinkedPageDeletedLargeBanner,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? LightLinkedPageEmptySmallBanner
          : LightLinkedPageEmptyLargeBanner,
        LinkedDocIcon: EmbedPageIcon,
        LoadingIcon: LightLoadingIcon,
        ReloadIcon,
        SyncedDocErrorBanner: LightSyncedDocErrorBanner,
      };
    } else {
      return {
        LinkedDocDeletedBanner: small
          ? DarkLinkedPageDeletedSmallBanner
          : DarkLinkedPageDeletedLargeBanner,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? DarkLinkedPageEmptySmallBanner
          : DarkLinkedPageEmptyLargeBanner,
        LinkedDocIcon: EmbedPageIcon,
        LoadingIcon: DarkLoadingIcon,
        ReloadIcon,
        SyncedDocErrorBanner: DarkSyncedDocErrorBanner,
      };
    }
  } else {
    if (theme === 'light') {
      return {
        LinkedDocDeletedBanner: small
          ? LightLinkedEdgelessDeletedSmallBanner
          : LightLinkedEdgelessDeletedLargeBanner,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? LightLinkedEdgelessEmptySmallBanner
          : LightLinkedEdgelessEmptyLargeBanner,
        LinkedDocIcon: EmbedEdgelessIcon,
        LoadingIcon: LightLoadingIcon,
        ReloadIcon,
        SyncedDocErrorBanner: LightSyncedDocErrorBanner,
      };
    } else {
      return {
        LinkedDocDeletedBanner: small
          ? DarkLinkedEdgelessDeletedSmallBanner
          : DarkLinkedEdgelessDeletedLargeBanner,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? DarkLinkedEdgelessEmptySmallBanner
          : DarkLinkedEdgelessEmptyLargeBanner,
        LinkedDocIcon: EmbedEdgelessIcon,
        LoadingIcon: DarkLoadingIcon,
        ReloadIcon,
        SyncedDocErrorBanner: DarkSyncedDocErrorBanner,
      };
    }
  }
}
