import type { KeyHandler } from 'hotkeys-js';
import hotkeys from 'hotkeys-js';

import {
  isCaptionElement,
  isDatabaseInput,
  isInsideDatabaseTitle,
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
    // undo/redo should work in database title or cell container
    if (
      (isInsideDatabaseTitle(event.target) || isDatabaseInput(event.target)) &&
      isUndoRedo(event)
    ) {
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

export const HOTKEY_SCOPE_TYPE = {
  AFFINE_PAGE: 'affine:page',
  AFFINE_EDGELESS: 'affine:edgeless',
} as const;
export type HOTKEY_SCOPE_TYPE =
  (typeof HOTKEY_SCOPE_TYPE)[keyof typeof HOTKEY_SCOPE_TYPE];
export type HOTKEY_SCOPE =
  | `affine:page-${number}`
  | `affine:edgeless-${number}`;

const HOTKEY_DISABLED_SCOPE = 'hotkey_disabled';

/**
 * Singleton
 *
 * When rendering a page or an edgeless view,
 * `setScope` is called to set a unique scope for each view.
 * All hotkeys are then bound to this scope.
 * When a page or an edgeless view is disconnected,
 * all hotkeys registered during the view's lifetime are destroyed.
 */
class HotkeyManager {
  private readonly _hotkeys: typeof hotkeys;
  private _scope: string = HOTKEY_DISABLED_SCOPE;
  private _disabled = false;
  private counter = 0;

  constructor() {
    this._hotkeys = hotkeys;
  }

  get disabled() {
    return this._disabled;
  }

  newScope(type: HOTKEY_SCOPE_TYPE): HOTKEY_SCOPE {
    return `${type}-${this.counter++}`;
  }

  setScope(scope: HOTKEY_SCOPE) {
    this._scope = scope;
    this._hotkeys.setScope(scope);
  }

  deleteScope(scope: HOTKEY_SCOPE) {
    this._hotkeys.deleteScope(scope);
  }

  addListener(
    hotkey: string,
    listener: KeyHandler,
    options: {
      keyup?: boolean;
      keydown?: boolean;
    } = {}
  ): void {
    this._hotkeys(hotkey, { ...options, scope: this._scope }, listener);
  }

  removeListener(hotkey: string | Array<string>): void {
    this._hotkeys.unbind(
      (Array.isArray(hotkey) ? hotkey : [hotkey]).join(','),
      this._scope
    );
  }

  disableHotkey(): void {
    this._disabled = true;
    this._hotkeys.setScope(HOTKEY_DISABLED_SCOPE);
  }

  enableHotkey(): void {
    this._disabled = false;
    this._hotkeys.setScope(this._scope);
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

  withScope(scope: HOTKEY_SCOPE, fn: () => void) {
    const pre = this._scope;
    try {
      this._scope = scope;
      fn();
    } finally {
      this._scope = pre;
    }
  }
}

export const hotkey = new HotkeyManager();
