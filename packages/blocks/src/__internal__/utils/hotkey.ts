import hotkeys, { KeyHandler } from 'hotkeys-js';

hotkeys.filter = () => true;

// Singleton
class HotkeyManager {
  private _hotkeys: typeof hotkeys;
  constructor() {
    this._hotkeys = hotkeys;
  }
  private _setScope(scope: string) {
    this._hotkeys.setScope(scope);
  }
  addListener(hotkey: string, listener: KeyHandler, scope?: string) {
    this._hotkeys(hotkey, { scope: scope ?? 'page' }, listener);
  }

  removeListener(hotkey: string | Array<string>, scope?: string) {
    this._hotkeys.unbind(
      (Array.isArray(hotkey) ? hotkey : [hotkey]).join(','),
      scope ?? 'page'
    );
  }
  disableHotkey() {
    this._hotkeys.setScope('other');
  }
  enableHotkey() {
    this._setScope('page');
  }

  /**
   * Create a context to shielding against global hotkey
   */
  async withHotkeyShield(fn: () => void | Promise<unknown>) {
    this.disableHotkey();
    try {
      const ret = await fn();
      return ret;
    } finally {
      this.enableHotkey();
    }
  }
}

export const hotkey = new HotkeyManager();
