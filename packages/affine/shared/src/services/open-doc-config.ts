import { createIdentifier } from '@blocksuite/global/di';
import { CenterPeekIcon, ExpandFullIcon } from '@blocksuite/icons/lit';
import { type ExtensionType } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

export type OpenDocMode =
  | 'open-in-active-view'
  | 'open-in-new-view'
  | 'open-in-new-tab'
  | 'open-in-center-peek';

// todo: later this will be used to generate the menu items.
// for now we only use it as a hint for whether or not to show the open doc buttons.
export interface OpenDocConfigItem {
  type: OpenDocMode;
  label: string;
  icon: TemplateResult<1>;
}
export interface OpenDocConfig {
  items: OpenDocConfigItem[];
}

export interface OpenDocService {
  isAllowed: (mode: OpenDocMode) => boolean;
  items: OpenDocConfig['items'];
}

export const OpenDocExtensionIdentifier = createIdentifier<OpenDocService>(
  'AffineOpenDocExtension'
);

const defaultConfig: OpenDocConfig = {
  items: [
    {
      type: 'open-in-active-view',
      label: 'Open this doc',
      icon: ExpandFullIcon(),
    },
    {
      type: 'open-in-center-peek',
      label: 'Open in center peek',
      icon: CenterPeekIcon(),
    },
  ],
};

export const OpenDocExtension = (config: OpenDocConfig): ExtensionType => ({
  setup: di => {
    di.override(OpenDocExtensionIdentifier, () => {
      const allowedOpenDocModes = new Set(config.items.map(item => item.type));
      return {
        isAllowed: (mode: OpenDocMode) => allowedOpenDocModes.has(mode),
        items: config.items,
      };
    });
  },
});

export const DefaultOpenDocExtension = OpenDocExtension(defaultConfig);
