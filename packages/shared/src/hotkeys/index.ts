
import hotkeys, { KeyHandler } from 'hotkeys-js';

export class Hotkeys {
  private _hotkeys: any;
  private _hotkeyScope: any ;
  constructor() {
    this._hotkeys = hotkeys;
  }

  addHotkey(hotkey:string,scope:string,element:any,callback:KeyHandler) {
    this._hotkeys(hotkey, {element},callback);
  }

  removeHotkey(hotkey:string|Array<string>) {
    this._hotkeys.unbind(hotkey);
  }
  
  setScope(scope:string) {
    this._hotkeyScope = scope;
    this._hotkeys.setScope(scope);
  }
}

