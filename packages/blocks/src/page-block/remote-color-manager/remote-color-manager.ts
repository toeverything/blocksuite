import type { AwarenessStore } from '@blocksuite/store';

import { multiPlayersColor } from './color-picker.js';

const REMOTE_COLOR_KEY = 'blocksuite:remote-color';

export class RemoteColorManager {
  constructor(public readonly awareness: AwarenessStore) {
    const sessionColor = window.sessionStorage.getItem(REMOTE_COLOR_KEY);
    if (sessionColor) {
      this.awareness.awareness.setLocalStateField('color', sessionColor);
      return;
    }

    const pickColor = multiPlayersColor.pick();
    this.awareness.awareness.setLocalStateField('color', pickColor);
    window.sessionStorage.setItem(REMOTE_COLOR_KEY, pickColor);
  }

  get(id: number) {
    const awarenessColor = this.awareness.getStates().get(id)?.color;
    if (awarenessColor) {
      return awarenessColor;
    }

    if (id !== this.awareness.awareness.clientID) return null;

    const sessionColor = window.sessionStorage.getItem(REMOTE_COLOR_KEY);
    if (sessionColor) {
      this.awareness.awareness.setLocalStateField('color', sessionColor);
      return sessionColor;
    }

    const pickColor = multiPlayersColor.pick();
    this.awareness.awareness.setLocalStateField('color', pickColor);
    window.sessionStorage.setItem(REMOTE_COLOR_KEY, pickColor);
    return pickColor;
  }
}
