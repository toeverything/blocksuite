import hotkeys from 'hotkeys-js';
import type { KeyHandler } from 'hotkeys-js';

hotkeys.filter = (event: KeyboardEvent) => {
  const target = event.target;
  if (
    target &&
    target instanceof Element &&
    ['INPUT'].includes(target.tagName) &&
    shouldFilter(event)
  ) {
    return false;
  }
  return true;
};

const shouldFilter = (event: KeyboardEvent) => {
  // If undo or redo: when event.shiftKey is false => undo, when event.shiftKey is true => redo
  if (event.metaKey && !event.altKey && event.key === 'z') {
    return true;
  }

  if (event.key === 'Backspace') {
    return true;
  }

  return false;
};

const SCOPE = {
  AFFINE_PAGE: 'affine:page',
  OTHER: 'other',
};

// Singleton
class HotkeyManager {
  private readonly _hotkeys: typeof hotkeys;

  constructor() {
    this._hotkeys = hotkeys;
  }

  private _setScope(scope: string): void {
    this._hotkeys.setScope(scope);
  }

  addListener(
    hotkey: string,
    listener: KeyHandler,
    scope: string = SCOPE.AFFINE_PAGE
  ): void {
    this._hotkeys(hotkey, { scope }, listener);
  }

  removeListener(
    hotkey: string | Array<string>,
    scope: string = SCOPE.AFFINE_PAGE
  ): void {
    this._hotkeys.unbind(
      (Array.isArray(hotkey) ? hotkey : [hotkey]).join(','),
      scope
    );
  }

  disableHotkey(): void {
    this._hotkeys.setScope(SCOPE.OTHER);
  }

  enableHotkey(): void {
    this._setScope(SCOPE.AFFINE_PAGE);
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
  async withDisabledHotkey<T = void>(fn: () => Promise<T>) {
    this.disableHotkey();
    try {
      return await fn();
    } finally {
      this.enableHotkey();
    }
  }

  /**
   * Similar to {@link withDisableHotkey}, but return a function instead of execute immediately.
   * @example
   * ```ts
   * const createLinkWithoutHotkey = withDisabledHotkeyFn((space) => createLink(space));
   * await createLinkWithoutHotkey(space);
   * ```
   */
  withDisabledHotkeyFn<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends (...args: any[]) => Promise<any> = (
      ...args: unknown[]
    ) => Promise<unknown>
  >(fn: T) {
    return ((...args: Parameters<T>) =>
      this.withDisabledHotkey<ReturnType<T>>(() =>
        fn(...args)
      ) as ReturnType<T>) as unknown as T;
  }
}

export const hotkey = new HotkeyManager();
