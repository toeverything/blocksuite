import hotkeys, { KeyHandler } from 'hotkeys-js';

hotkeys.filter = () => true;

// Singleton
class HotkeyManager {
  private _hotkeys: typeof hotkeys;

  constructor() {
    this._hotkeys = hotkeys;
  }

  addListener(hotkey: string, listener: KeyHandler) {
    this._hotkeys(hotkey, { scope: 'all' }, listener);
  }

  removeListener(hotkey: string | Array<string>) {
    this._hotkeys.unbind(
      (Array.isArray(hotkey) ? hotkey : [hotkey]).join(','),
      'all'
    );
  }
}

export const hotkey = new HotkeyManager();
