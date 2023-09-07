import type { ImageBlockModel } from '../../index.js';

export type EntryRegistion = {
  name: string;
  icon: string;
  title: string;
  callback: (model: ImageBlockModel, blob: Blob) => void;
};

export class EntryManager {
  entries: EntryRegistion[] = [];

  add(registion: EntryRegistion) {
    if (this.entries.find(entry => entry.name === registion.name)) {
      return;
    }

    this.entries.push(registion);
  }
}
