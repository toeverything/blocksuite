export class ActivateManager {
  private _active = false;
  get active() {
    return this._active;
  }

  activate() {
    this._active = true;
  }

  deactivate() {
    this._active = false;
  }
}
