import type { EditorHost } from '@blocksuite/lit';

import type { PageService } from '../page-service.js';
import { multiPlayersColor } from './color-picker.js';

export class RemoteColorManager {
  private get awareness() {
    return this.host.page.workspace.awarenessStore;
  }

  private get pageService() {
    return this.host.spec.getService('affine:page') as PageService;
  }

  constructor(public readonly host: EditorHost) {
    const sessionColor = this.pageService.editSession.getItem('remoteColor');
    if (sessionColor) {
      this.awareness.awareness.setLocalStateField('color', sessionColor);
      return;
    }

    const pickColor = multiPlayersColor.pick();
    this.awareness.awareness.setLocalStateField('color', pickColor);
    this.pageService.editSession.setItem('remoteColor', pickColor);
  }

  get(id: number) {
    const awarenessColor = this.awareness.getStates().get(id)?.color;
    if (awarenessColor) {
      return awarenessColor;
    }

    if (id !== this.awareness.awareness.clientID) return null;

    const sessionColor = this.pageService.editSession.getItem('remoteColor');
    if (sessionColor) {
      this.awareness.awareness.setLocalStateField('color', sessionColor);
      return sessionColor;
    }

    const pickColor = multiPlayersColor.pick();
    this.awareness.awareness.setLocalStateField('color', pickColor);
    this.pageService.editSession.setItem('remoteColor', pickColor);
    return pickColor;
  }
}
