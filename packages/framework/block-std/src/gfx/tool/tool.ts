import type { UIEventStateContext } from '../../event/base.js';

import {
  eventTarget,
  type SupportedEvents,
  type ToolController,
} from './tool-controller.js';

export abstract class AbstractTool {
  abstract readonly name: string;

  get active() {
    return this.controller.currentTool$.peek() === this;
  }

  constructor(readonly controller: ToolController) {}

  /**
   * Called when the tool is activated.
   * @param option - The data passed as second argument when calling `ToolController.use`.
   */
  activate(_: Record<string, unknown>): void {}

  addHook(
    evtName: SupportedEvents,
    handler: (evtState: UIEventStateContext) => undefined | boolean
  ): void {
    this.controller[eventTarget].addHook(evtName, handler);
  }

  click(_: UIEventStateContext): void {}

  contextMenu(_: UIEventStateContext): void {}

  /**
   * Called when the tool is deactivated.
   */
  deactivate(): void {}

  doubleClick(_: UIEventStateContext): void {}

  dragEnd(_: UIEventStateContext): void {}

  dragMove(_: UIEventStateContext): void {}

  dragStart(_: UIEventStateContext): void {}

  /**
   * Called when the tool is registered.
   */
  onload(): void {}

  /**
   * Called when the tool is unloaded, usually when the whole `ToolController` is destroyed.
   */
  onunload(): void {}

  pointerDown(_: UIEventStateContext): void {}

  pointerMove(_: UIEventStateContext): void {}

  pointerOut(_: UIEventStateContext): void {}

  pointerUp(_: UIEventStateContext): void {}

  tripleClick(_: UIEventStateContext): void {}
}
