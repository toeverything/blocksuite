import type { EditorHost } from '@blocksuite/lit';

import type { SurfaceService } from '../../surface-block/surface-service.js';
import { multiPlayersColor } from './color-picker.js';

export class RemoteColorManager {
  private get awareness() {
    return this.host.page.workspace.awarenessStore;
  }

  private get surfaceService() {
    return this.host.spec.getService('affine:surface') as SurfaceService;
  }

  constructor(public readonly host: EditorHost) {
    const sessionColor =
      this.surfaceService.editSessionManager.getItem('remoteColor');
    if (sessionColor) {
      this.awareness.awareness.setLocalStateField('color', sessionColor);
      return;
    }

    const pickColor = multiPlayersColor.pick();
    this.awareness.awareness.setLocalStateField('color', pickColor);
    this.surfaceService.editSessionManager.setItem('remoteColor', pickColor);
  }

  get(id: number) {
    const awarenessColor = this.awareness.getStates().get(id)?.color;
    if (awarenessColor) {
      return awarenessColor;
    }

    if (id !== this.awareness.awareness.clientID) return null;

    const sessionColor =
      this.surfaceService.editSessionManager.getItem('remoteColor');
    if (sessionColor) {
      this.awareness.awareness.setLocalStateField('color', sessionColor);
      return sessionColor;
    }

    const pickColor = multiPlayersColor.pick();
    this.awareness.awareness.setLocalStateField('color', pickColor);
    this.surfaceService.editSessionManager.setItem('remoteColor', pickColor);
    return pickColor;
  }
}
