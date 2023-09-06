import type { ImageBlockModel } from '../../index.js';

export type AddonEntry = (
  div: HTMLDivElement,
  image: Blob
) => {
  onClose: () => Promise<void>;
  onSave: () => Promise<Blob | null>;
};

export type ImageAddonRegistion = {
  name: string;
  icon: string;
  title: string;
  callback: (model: ImageBlockModel, blob: Blob) => void;
};

export class AddonManager {
  addons: ImageAddonRegistion[] = [];

  register(registion: ImageAddonRegistion) {
    if (this.addons.find(addon => addon.name === registion.name)) {
      return;
    }

    this.addons.push(registion);
  }
}
