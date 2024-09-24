import { type Container, createIdentifier } from '@blocksuite/global/di';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

import type { UIEventStateContext } from '../../event/base.js';
import type { ExtensionType } from '../../extension/extension.js';

import { type GfxController, GfxControllerIdentifier } from '../controller.js';
import { eventTarget, type SupportedEvents } from './tool-controller.js';

export abstract class BaseTool {
  static toolName: string = '';

  get active() {
    return this.gfx.tool.currentTool$.peek() === this;
  }

  get toolName() {
    return (this.constructor as typeof BaseTool).toolName;
  }

  constructor(readonly gfx: GfxController) {}

  /**
   * Called when the tool is activated.
   * @param option - The data passed as second argument when calling `ToolController.use`.
   */
  activate(_: Record<string, unknown>): void {}

  addHook(
    evtName: SupportedEvents,
    handler: (evtState: UIEventStateContext) => undefined | boolean
  ): void {
    this.gfx.tool[eventTarget].addHook(evtName, handler);
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

export const ToolIdentifier = createIdentifier<BaseTool>('GfxTool');

export function GfxToolExtension(
  toolCtors: (typeof BaseTool)[]
): ExtensionType {
  return {
    setup: (di: Container) => {
      toolCtors.forEach(Ctor => {
        if (!Ctor.toolName) {
          throw new BlockSuiteError(
            ErrorCode.ValueNotExists,
            'The tool must have a static property `toolName`'
          );
        }

        di.addImpl(ToolIdentifier(Ctor.toolName), Ctor, [
          GfxControllerIdentifier,
        ]);
      });
    },
  };
}
