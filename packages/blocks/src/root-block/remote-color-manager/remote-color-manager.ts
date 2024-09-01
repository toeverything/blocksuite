import type { EditorHost } from '@blocksuite/block-std';

import { multiPlayersColor } from './color-picker.js';

export class RemoteColorManager {
  constructor(readonly host: EditorHost) {
    const sessionColor =
      this.rootService.editPropsStore.getStorage('remoteColor');
    if (sessionColor) {
      this.awarenessStore.awareness.setLocalStateField('color', sessionColor);
      return;
    }

    const pickColor = multiPlayersColor.pick();
    this.awarenessStore.awareness.setLocalStateField('color', pickColor);
    this.rootService.editPropsStore.setStorage('remoteColor', pickColor);
  }

  private get awarenessStore() {
    return this.host.doc.collection.awarenessStore;
  }

  private get rootService() {
    return this.host.spec.getService('affine:page');
  }

  get(id: number) {
    const awarenessColor = this.awarenessStore.getStates().get(id)?.color;
    if (awarenessColor) {
      return awarenessColor;
    }

    if (id !== this.awarenessStore.awareness.clientID) return null;

    const sessionColor =
      this.rootService.editPropsStore.getStorage('remoteColor');
    if (sessionColor) {
      this.awarenessStore.awareness.setLocalStateField('color', sessionColor);
      return sessionColor;
    }

    const pickColor = multiPlayersColor.pick();
    this.awarenessStore.awareness.setLocalStateField('color', pickColor);
    this.rootService.editPropsStore.setStorage('remoteColor', pickColor);
    return pickColor;
  }
}
