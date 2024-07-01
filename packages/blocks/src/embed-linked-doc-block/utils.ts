import type { TemplateResult } from 'lit';

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
} from './styles.js';

type EmbedCardImages = {
  LoadingIcon: TemplateResult<1>;
  ReloadIcon: TemplateResult<1>;
  LinkedDocIcon: TemplateResult<1>;
  LinkedDocDeletedIcon: TemplateResult<1>;
  LinkedDocEmptyBanner: TemplateResult<1>;
  LinkedDocDeletedBanner: TemplateResult<1>;
  SyncedDocErrorBanner: TemplateResult<1>;
};

export function getEmbedLinkedDocIcons(
  editorMode: 'page' | 'edgeless',
  style: (typeof EmbedLinkedDocStyles)[number]
): EmbedCardImages {
  const theme = getThemeMode();
  const small = style !== 'vertical';
  if (editorMode === 'page') {
    if (theme === 'light') {
      return {
        LoadingIcon: LightLoadingIcon,
        ReloadIcon,
        LinkedDocIcon: EmbedPageIcon,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? LightLinkedPageEmptySmallBanner
          : LightLinkedPageEmptyLargeBanner,
        LinkedDocDeletedBanner: small
          ? LightLinkedPageDeletedSmallBanner
          : LightLinkedPageDeletedLargeBanner,
        SyncedDocErrorBanner: LightSyncedDocErrorBanner,
      };
    } else {
      return {
        ReloadIcon,
        LoadingIcon: DarkLoadingIcon,
        LinkedDocIcon: EmbedPageIcon,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? DarkLinkedPageEmptySmallBanner
          : DarkLinkedPageEmptyLargeBanner,
        LinkedDocDeletedBanner: small
          ? DarkLinkedPageDeletedSmallBanner
          : DarkLinkedPageDeletedLargeBanner,
        SyncedDocErrorBanner: DarkSyncedDocErrorBanner,
      };
    }
  } else {
    if (theme === 'light') {
      return {
        ReloadIcon,
        LoadingIcon: LightLoadingIcon,
        LinkedDocIcon: EmbedEdgelessIcon,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? LightLinkedEdgelessEmptySmallBanner
          : LightLinkedEdgelessEmptyLargeBanner,
        LinkedDocDeletedBanner: small
          ? LightLinkedEdgelessDeletedSmallBanner
          : LightLinkedEdgelessDeletedLargeBanner,
        SyncedDocErrorBanner: LightSyncedDocErrorBanner,
      };
    } else {
      return {
        ReloadIcon,
        LoadingIcon: DarkLoadingIcon,
        LinkedDocIcon: EmbedEdgelessIcon,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? DarkLinkedEdgelessEmptySmallBanner
          : DarkLinkedEdgelessEmptyLargeBanner,
        LinkedDocDeletedBanner: small
          ? DarkLinkedEdgelessDeletedSmallBanner
          : DarkLinkedEdgelessDeletedLargeBanner,
        SyncedDocErrorBanner: DarkSyncedDocErrorBanner,
      };
    }
  }
}
