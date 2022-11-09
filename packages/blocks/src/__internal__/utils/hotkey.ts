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
    this._hotkeys(hotkey, { scope: scope ?? 'affine:page' }, listener);
  }

  removeListener(hotkey: string | Array<string>, scope?: string) {
    this._hotkeys.unbind(
      (Array.isArray(hotkey) ? hotkey : [hotkey]).join(','),
      scope ?? 'affine:page'
    );
  }
  disableHotkey() {
    this._hotkeys.setScope('other');
  }
  enableHotkey() {
    this._setScope('affine:page');
  }

  /**
   * Create a context to shielding against global hotkey.
   *
   * The param `fn` will be executed immediately.
   * @example
   * ```ts
   * const ret = await hotkey.withDisableHotkey(async () => {
   *   const result = await createLink(space);
   *   return result;
   * });
   * ```
   */
  async withDisableHotkey<T = void>(fn: () => Promise<T>) {
    this.disableHotkey();
    try {
      const ret = await fn();
      return ret;
    } finally {
      this.enableHotkey();
    }
  }

  /**
   * Similar to {@link withDisableHotkey}, but return a function instead of execute immediately.
   * @example
   * ```ts
   * const createLinkWithoutHotkey = withDisableHotkeyFn((space) => createLink(space));
   * await createLinkWithoutHotkey(space);
   * ```
   */
  withDisableHotkeyFn<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends (...args: any[]) => Promise<any> = (
      ...args: unknown[]
    ) => Promise<unknown>
  >(fn: T) {
    return ((...args: Parameters<T>) =>
      this.withDisableHotkey<ReturnType<T>>(() =>
        fn(...args)
      ) as ReturnType<T>) as unknown as T;
  }
}

export const hotkey = new HotkeyManager();
