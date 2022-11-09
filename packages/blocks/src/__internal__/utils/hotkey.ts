import hotkeys, { KeyHandler } from 'hotkeys-js';

hotkeys.filter = () => true;

const SCOPE = {
  AFFINE_PAGE: 'affine:page',
  OTHER: 'other',
};

// Singleton
class HotkeyManager {
  private readonly hotkeys: typeof hotkeys;

  constructor() {
    this.hotkeys = hotkeys;
  }

  private setScope(scope: string): void {
    this.hotkeys.setScope(scope);
  }

  addListener(
    hotkey: string,
    listener: KeyHandler,
    scope: string = SCOPE.AFFINE_PAGE
  ): void {
    this.hotkeys(hotkey, { scope }, listener);
  }

  removeListener(
    hotkey: string | Array<string>,
    scope: string = SCOPE.AFFINE_PAGE
  ): void {
    this.hotkeys.unbind(
      (Array.isArray(hotkey) ? hotkey : [hotkey]).join(','),
      scope
    );
  }

  disableHotkey(): void {
    this.hotkeys.setScope(SCOPE.OTHER);
  }

  enableHotkey(): void {
    this.setScope(SCOPE.AFFINE_PAGE);
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
      return await fn();
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
