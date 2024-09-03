import type { DocMode, ReferenceInfo } from '@blocksuite/affine-model';
import type { TemplateResult } from 'lit';

import {
  DarkLoadingIcon,
  EmbedCardDarkBannerIcon,
  EmbedCardDarkCubeIcon,
  EmbedCardDarkHorizontalIcon,
  EmbedCardDarkListIcon,
  EmbedCardDarkVerticalIcon,
  EmbedCardLightBannerIcon,
  EmbedCardLightCubeIcon,
  EmbedCardLightHorizontalIcon,
  EmbedCardLightListIcon,
  EmbedCardLightVerticalIcon,
  LightLoadingIcon,
} from '@blocksuite/affine-components/icons';
import { DocModes } from '@blocksuite/affine-model';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';

type EmbedCardIcons = {
  LoadingIcon: TemplateResult<1>;
  EmbedCardBannerIcon: TemplateResult<1>;
  EmbedCardHorizontalIcon: TemplateResult<1>;
  EmbedCardListIcon: TemplateResult<1>;
  EmbedCardVerticalIcon: TemplateResult<1>;
  EmbedCardCubeIcon: TemplateResult<1>;
};

export function getEmbedCardIcons(): EmbedCardIcons {
  const theme = ThemeObserver.mode;
  if (theme === 'light') {
    return {
      LoadingIcon: LightLoadingIcon,
      EmbedCardBannerIcon: EmbedCardLightBannerIcon,
      EmbedCardHorizontalIcon: EmbedCardLightHorizontalIcon,
      EmbedCardListIcon: EmbedCardLightListIcon,
      EmbedCardVerticalIcon: EmbedCardLightVerticalIcon,
      EmbedCardCubeIcon: EmbedCardLightCubeIcon,
    };
  } else {
    return {
      LoadingIcon: DarkLoadingIcon,
      EmbedCardBannerIcon: EmbedCardDarkBannerIcon,
      EmbedCardHorizontalIcon: EmbedCardDarkHorizontalIcon,
      EmbedCardListIcon: EmbedCardDarkListIcon,
      EmbedCardVerticalIcon: EmbedCardDarkVerticalIcon,
      EmbedCardCubeIcon: EmbedCardDarkCubeIcon,
    };
  }
}

export function extractSearchParams(link: string) {
  try {
    const url = new URL(link);
    const mode = url.searchParams.get('mode') as DocMode | undefined;

    if (mode && DocModes.includes(mode)) {
      const params: ReferenceInfo['params'] = { mode: mode as DocMode };
      const blockIds = url.searchParams
        .get('blockIds')
        ?.trim()
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length);
      const elementIds = url.searchParams
        .get('elementIds')
        ?.trim()
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length);

      if (blockIds?.length) {
        params.blockIds = blockIds;
      }

      if (elementIds?.length) {
        params.elementIds = elementIds;
      }

      return { params };
    }
  } catch (err) {
    console.error(err);
  }

  return null;
}
