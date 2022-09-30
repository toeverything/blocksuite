import hotkeys, { KeyHandler } from 'hotkeys-js';
import { HotkeyMapType, MacHotkeyMap } from '../consts';
hotkeys.filter = () => true;
type Options = {
  scope: string;
  element?: HTMLElement | null;
  keyup?: boolean | null;
  keydown?: boolean | null;
  capture?: boolean;
  splitKey?: string;
};

export class Hotkeys {
  private _hotkeys: typeof hotkeys;

  public hotkeyScope: Options['scope'];

  public hotkeysMap: HotkeyMapType;
  constructor() {
    this._hotkeys = hotkeys;
    this.hotkeyScope = 'all';
    this.hotkeysMap =
      // TODO add more system hotkeys here
      this.hotkeysMap = MacHotkeyMap;
  }

  addHotkey(hotkey: string, scope: Options['scope'], callback: KeyHandler) {
    this._hotkeys(hotkey, { scope }, callback);
  }

  removeHotkey(hotkey: string | Array<string>) {
    this._hotkeys.unbind(...(Array.isArray(hotkey) ? hotkey : [hotkey]));
  }

  switchScope(scope: string) {
    this.hotkeyScope = scope;
    this._hotkeys.setScope(this.hotkeyScope);
  }

  cancelScope(scope: string, newScope: string) {
    this._hotkeys.deleteScope(scope ?? (this.hotkeyScope as string), newScope);
  }
}
export const HotKeysManage = new Hotkeys();
