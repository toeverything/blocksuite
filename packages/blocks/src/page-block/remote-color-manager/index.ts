import { multiPlayersColor } from './color-picker.js';

const REMOTE_COLOR_KEY = 'blocksuite:remote-colors';

class RemoteColorManager {
  private _remoteColors: Map<string, string> = new Map();

  _normalize(id: number | string) {
    return typeof id === 'number' ? id.toString() : id;
  }

  get(id: string | number) {
    if (!this._remoteColors.has(this._normalize(id))) {
      this.set(id, multiPlayersColor.pick());
    }

    return this._remoteColors.get(this._normalize(id));
  }

  set(id: string | number, color: string) {
    this._remoteColors.set(this._normalize(id), color);
    this._save();
  }

  delete(id: number) {
    this._remoteColors.delete(this._normalize(id));
    this._save();
  }

  size() {
    return this._remoteColors.size;
  }

  _save() {
    localStorage.setItem(
      REMOTE_COLOR_KEY,
      JSON.stringify([...this._remoteColors.entries()])
    );
  }

  _load() {
    const mapData = localStorage.getItem(REMOTE_COLOR_KEY);

    try {
      if (mapData) {
        this._remoteColors = new Map(JSON.parse(mapData));
      } else {
        this._remoteColors = new Map();
      }
    } catch {
      this._remoteColors = new Map();
    }
  }
}

export const remoteColorManager = new RemoteColorManager();
