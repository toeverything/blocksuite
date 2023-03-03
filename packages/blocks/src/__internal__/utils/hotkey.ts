import type { KeyHandler } from 'hotkeys-js';
import hotkeys from 'hotkeys-js';

import {
  isCaptionElement,
  isInsidePageTitle,
  isInsideRichText,
} from './query.js';

hotkeys.filter = (event: KeyboardEvent) => {
  if (shouldFilterHotkey(event)) return false;
  return true;
};

function isUndoRedo(event: KeyboardEvent) {
  // If undo or redo: when event.shiftKey is false => undo, when event.shiftKey is true => redo
  if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key === 'z') {
    return true;
  }
  return false;
}

function shouldFilterHotkey(event: KeyboardEvent) {
  const target = event.target;
  // Not sure if this is the right thing to do
  if (!target) {
    return true;
  }
  // Skip input element
  // including
  // - code block language search input
  // - image caption
  // - link create/edit popover
  if (!isInsideRichText(event.target)) {
    // TODO Remove ad-hoc
    // This ad-hoc should be moved to the caption input for processing
    // Enter on caption should jump out of input
    // See also `hotkey.addListener(ENTER, handler)`
    if (isCaptionElement(event.target) && event.key === 'Enter') {
      return false;
    }
    // undo/redo should work in page title
    if (isInsidePageTitle(event.target) && isUndoRedo(event)) {
      return false;
    }
    // Some event dispatch from body
    // for example, press backspace to remove block-level selection
    if (event.target === document.body) {
      // TODO filter arrow key
      return false;
    }
    return true;
  }
  // if (
  //   target instanceof Element &&
  //   ['INPUT', 'EDIT-LINK-PANEL'].includes(target.tagName)
  // ) {
  //   return true;
  // }
  return false;
}

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
    options: {
      scope?: string;
      keyup?: boolean;
      keydown?: boolean;
    } = {}
  ): void {
    const scope = options.scope ?? SCOPE.AFFINE_PAGE;
    this._hotkeys(hotkey, { ...options, scope }, listener);
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
