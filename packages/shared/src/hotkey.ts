import hotkeys, { KeyHandler } from 'hotkeys-js';
import { DefaultHotkeyMap } from './consts';

hotkeys.filter = () => true;

type HotkeyOptions = {
  scope: string;
  element?: HTMLElement;
  keyup?: boolean;
  keydown?: boolean;
  capture?: boolean;
  splitKey?: string;
};

// Singleton
class HotkeyManager {
  private _hotkeys: typeof hotkeys;
  public hotkeyScope: HotkeyOptions['scope'];
  public hotkeysMap: typeof DefaultHotkeyMap;

  constructor() {
    this._hotkeys = hotkeys;
    this.hotkeyScope = 'all';
    // TODO add more platform hotkeys
    this.hotkeysMap = DefaultHotkeyMap;
  }

  addListener(
    hotkey: string,
    scope: HotkeyOptions['scope'],
    listener: KeyHandler
  ) {
    this._hotkeys(hotkey, { scope }, listener);
  }

  removeListener(hotkey: string | Array<string>) {
    this._hotkeys.unbind(...(Array.isArray(hotkey) ? hotkey : [hotkey]));
  }

  setScope(scope: string) {
    this.hotkeyScope = scope;
    this._hotkeys.setScope(this.hotkeyScope);
  }

  cancelScope(scope: string, newScope: string) {
    this._hotkeys.deleteScope(scope ?? (this.hotkeyScope as string), newScope);
  }
}

export const hotkeyManager = new HotkeyManager();
