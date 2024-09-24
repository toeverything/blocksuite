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
  abstract activate(option: Record<string, unknown>): void;

  addEvent(
    event: SupportedEvents,
    handler: (evt: UIEventStateContext) => void
  ): void {
    this.controller[eventTarget].addEvent(this.name, event, handler);
  }

  addHook(
    evtName: SupportedEvents,
    handler: (evtState: UIEventStateContext) => undefined | boolean
  ): void {
    this.controller[eventTarget].addHook(evtName, handler);
  }

  /**
   * Called when the tool is deactivated.
   */
  abstract deactivate(): void;

  /**
   * Called when the tool is registered.
   */
  abstract onload(): void;

  /**
   * Called when the tool is unloaded, usually when the whole `ToolController` is destroyed.
   */
  abstract onunload(): void;
}
