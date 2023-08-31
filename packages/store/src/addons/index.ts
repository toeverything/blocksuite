export type AddonEntry = (
  div: HTMLDivElement,
  image: Blob
) => {
  onClose: () => Promise<void>;
  onSave: () => Promise<Blob | null>;
};

export type AddonRegistion = {
  name: string;
  type: 'image-addon';
  icon: string;
  title: string;
  load: () => Promise<{
    main: AddonEntry;
  }>;
};

export class AddonManager {
  addons: AddonRegistion[] = [];

  register(registion: AddonRegistion) {
    this.addons.push(registion);
  }

  getAddonByType(type: AddonRegistion['type']) {
    return this.addons.filter(addon => addon.type === type);
  }

  async load() {
    await Promise.all(this.addons.map(addon => addon.load()));
  }
}
