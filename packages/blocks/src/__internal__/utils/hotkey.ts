import hotkeys, { KeyHandler } from 'hotkeys-js';

hotkeys.filter = () => true;

// Singleton
class HotkeyManager {
  private _hotkeys: typeof hotkeys;
  private _activeScope: string;
  constructor() {
    this._hotkeys = hotkeys;
    this._activeScope = 'page';
  }

  addListener(hotkey: string, listener: KeyHandler, scope: string) {
    this._activeScope = scope;
    this._hotkeys(hotkey, { scope: scope }, listener);
  }

  removeListener(hotkey: string | Array<string>, scope: string) {
    this._hotkeys.unbind(
      (Array.isArray(hotkey) ? hotkey : [hotkey]).join(','),
      scope
    );
  }
  private _setScope(scope: string) {
    this._hotkeys.setScope(scope);
  }

  disabledHotkey() {
    this._hotkeys.deleteScope(this._activeScope);
  }

  enableHotkey() {
    this._setScope(this._activeScope);
  }
}

export const hotkey = new HotkeyManager();
