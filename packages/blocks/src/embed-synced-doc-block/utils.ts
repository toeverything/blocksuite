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
  DarkSyncedDocDeletedBanner,
  DarkSyncedDocEmptyBanner,
  DarkSyncedDocErrorBanner,
  LightSyncedDocDeletedBanner,
  LightSyncedDocEmptyBanner,
  LightSyncedDocErrorBanner,
  SyncedDocDeletedIcon,
  SyncedDocErrorIcon,
} from './styles.js';

type SyncedCardImages = {
  LoadingIcon: TemplateResult<1>;
  ReloadIcon: TemplateResult<1>;
  SyncedDocDeletedBanner: TemplateResult<1>;
  SyncedDocDeletedIcon: TemplateResult<1>;
  SyncedDocEmptyBanner: TemplateResult<1>;
  SyncedDocErrorBanner: TemplateResult<1>;
  SyncedDocErrorIcon: TemplateResult<1>;
  SyncedDocIcon: TemplateResult<1>;
};

export function getSyncedDocIcons(
  editorMode: 'edgeless' | 'page'
): SyncedCardImages {
  const theme = getThemeMode();
  if (theme === 'light') {
    return {
      LoadingIcon: LightLoadingIcon,
      ReloadIcon,
      SyncedDocDeletedBanner: LightSyncedDocDeletedBanner,
      SyncedDocDeletedIcon,
      SyncedDocEmptyBanner: LightSyncedDocEmptyBanner,
      SyncedDocErrorBanner: LightSyncedDocErrorBanner,
      SyncedDocErrorIcon,
      SyncedDocIcon: editorMode === 'page' ? EmbedPageIcon : EmbedEdgelessIcon,
    };
  } else {
    return {
      LoadingIcon: DarkLoadingIcon,
      ReloadIcon,
      SyncedDocDeletedBanner: DarkSyncedDocDeletedBanner,
      SyncedDocDeletedIcon,
      SyncedDocEmptyBanner: DarkSyncedDocEmptyBanner,
      SyncedDocErrorBanner: DarkSyncedDocErrorBanner,
      SyncedDocErrorIcon,
      SyncedDocIcon: editorMode === 'page' ? EmbedPageIcon : EmbedEdgelessIcon,
    };
  }
}
