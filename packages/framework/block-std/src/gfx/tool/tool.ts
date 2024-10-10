import { type Container, createIdentifier } from '@blocksuite/global/di';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import {
  assertType,
  type Constructor,
  DisposableGroup,
} from '@blocksuite/global/utils';

import type { PointerEventState } from '../../event/index.js';
import type { ExtensionType } from '../../extension/extension.js';

import { type GfxController, GfxControllerIdentifier } from '../controller.js';
import { eventTarget, type SupportedEvents } from './tool-controller.js';

export abstract class BaseTool<Option = Record<string, unknown>> {
  static toolName: string = '';

  activatedOption: Option = {} as Option;

  /**
   * The `disposable` will be disposed when the tool is unloaded.
   */
  protected readonly disposable = new DisposableGroup();

  get active() {
    return this.gfx.tool.currentTool$.peek() === this;
  }

  get controller() {
    return this.gfx.tool;
  }

  get doc() {
    return this.gfx.doc;
  }

  get std() {
    return this.gfx.std;
  }

  get toolName() {
    return (this.constructor as typeof BaseTool).toolName;
  }

  constructor(readonly gfx: GfxController) {}

  /**
   * Called when the tool is activated.
   * @param _ - The data passed as second argument when calling `ToolController.use`.
   */
  activate(_: Option): void {}

  addHook(
    evtName: SupportedEvents,
    handler: (evtState: PointerEventState) => undefined | boolean
  ): void {
    this.gfx.tool[eventTarget].addHook(evtName, handler);
  }

  click(_: PointerEventState): void {}

  contextMenu(_: PointerEventState): void {}

  /**
   * Called when the tool is deactivated.
   */
  deactivate(): void {}

  doubleClick(_: PointerEventState): void {}

  dragEnd(_: PointerEventState): void {}

  dragMove(_: PointerEventState): void {}

  dragStart(_: PointerEventState): void {}

  /**
   * Called when the tool is registered.
   */
  onload(): void {}

  /**
   * Called when the tool is unloaded, usually when the whole `ToolController` is destroyed.
   */
  onunload(): void {}

  pointerDown(_: PointerEventState): void {}

  pointerMove(_: PointerEventState): void {}

  pointerOut(_: PointerEventState): void {}

  pointerUp(_: PointerEventState): void {}

  tripleClick(_: PointerEventState): void {}
}

export const ToolIdentifier = createIdentifier<BaseTool>('GfxTool');

export function GfxToolExtension(
  toolCtors: Constructor<BaseTool>[]
): ExtensionType {
  return {
    setup: (di: Container) => {
      toolCtors.forEach(Ctor => {
        assertType<typeof BaseTool>(Ctor);
        if (!Ctor.toolName) {
          throw new BlockSuiteError(
            ErrorCode.ValueNotExists,
            `The tool ${Ctor.name} must have a static property 'toolName'`
          );
        }

        di.addImpl(ToolIdentifier(Ctor.toolName), Ctor, [
          GfxControllerIdentifier,
        ]);
      });
    },
  };
}

declare global {
  namespace BlockSuite {
    interface GfxToolsMap {}

    interface GfxToolsOption {}

    type GfxToolsFullOption = {
      [Key in keyof GfxToolsMap]: Key extends keyof GfxToolsOption
        ? { type: Key } & GfxToolsOption[Key]
        : { type: Key };
    };

    type GfxToolsFullOptionValue = GfxToolsFullOption[keyof GfxToolsFullOption];
  }
}
