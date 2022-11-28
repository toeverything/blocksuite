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
   * Create a context to shielding against global hotkey
   */
  async withDisabledHotkey(
    fn: () => void | Promise<unknown>
  ): Promise<void | unknown> {
    this.disableHotkey();
    try {
      return await fn();
    } finally {
      this.enableHotkey();
    }
  }
}

export const hotkey = new HotkeyManager();
