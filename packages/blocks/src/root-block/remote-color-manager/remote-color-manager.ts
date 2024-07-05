import type { EditorHost } from '@blocksuite/block-std';

import { multiPlayersColor } from './color-picker.js';

export class RemoteColorManager {
  private get awareness() {
    return this.host.doc.collection.awarenessStore;
  }

  private get rootService() {
    return this.host.spec.getService('affine:page');
  }

  constructor(readonly host: EditorHost) {
    const sessionColor =
      this.rootService.editPropsStore.getStorage('remoteColor');
    if (sessionColor) {
      this.awareness.awareness.setLocalStateField('color', sessionColor);
      return;
    }

    const pickColor = multiPlayersColor.pick();
    this.awareness.awareness.setLocalStateField('color', pickColor);
    this.rootService.editPropsStore.setStorage('remoteColor', pickColor);
  }

  get(id: number) {
    const awarenessColor = this.awareness.getStates().get(id)?.color;
    if (awarenessColor) {
      return awarenessColor;
    }

    if (id !== this.awareness.awareness.clientID) return null;

    const sessionColor =
      this.rootService.editPropsStore.getStorage('remoteColor');
    if (sessionColor) {
      this.awareness.awareness.setLocalStateField('color', sessionColor);
      return sessionColor;
    }

    const pickColor = multiPlayersColor.pick();
    this.awareness.awareness.setLocalStateField('color', pickColor);
    this.rootService.editPropsStore.setStorage('remoteColor', pickColor);
    return pickColor;
  }
}
