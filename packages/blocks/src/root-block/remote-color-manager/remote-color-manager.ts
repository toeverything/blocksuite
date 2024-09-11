import type { BlockStdScope } from '@blocksuite/block-std';

import { EditPropsStore } from '@blocksuite/affine-shared/services';

import { multiPlayersColor } from './color-picker.js';

export class RemoteColorManager {
  private get awarenessStore() {
    return this.std.doc.collection.awarenessStore;
  }

  constructor(readonly std: BlockStdScope) {
    const sessionColor = this.std.get(EditPropsStore).getStorage('remoteColor');
    if (sessionColor) {
      this.awarenessStore.awareness.setLocalStateField('color', sessionColor);
      return;
    }

    const pickColor = multiPlayersColor.pick();
    this.awarenessStore.awareness.setLocalStateField('color', pickColor);
    this.std.get(EditPropsStore).setStorage('remoteColor', pickColor);
  }

  get(id: number) {
    const awarenessColor = this.awarenessStore.getStates().get(id)?.color;
    if (awarenessColor) {
      return awarenessColor;
    }

    if (id !== this.awarenessStore.awareness.clientID) return null;

    const sessionColor = this.std.get(EditPropsStore).getStorage('remoteColor');
    if (sessionColor) {
      this.awarenessStore.awareness.setLocalStateField('color', sessionColor);
      return sessionColor;
    }

    const pickColor = multiPlayersColor.pick();
    this.awarenessStore.awareness.setLocalStateField('color', pickColor);
    this.std.get(EditPropsStore).setStorage('remoteColor', pickColor);
    return pickColor;
  }
}
