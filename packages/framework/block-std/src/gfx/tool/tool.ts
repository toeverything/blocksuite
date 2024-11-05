import { type Container, createIdentifier } from '@blocksuite/global/di';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { DisposableGroup } from '@blocksuite/global/utils';

import type { PointerEventState } from '../../event/index.js';
import type { GfxController } from '../controller.js';
import type { ToolEventTarget } from './tool-controller.js';

import { Extension } from '../../extension/extension.js';
import { GfxControllerIdentifier } from '../identifiers.js';

export abstract class BaseTool<
  Option = Record<string, unknown>,
> extends Extension {
  static toolName: string = '';

  private readonly eventTarget!: ToolEventTarget;

  activatedOption: Option = {} as Option;

  addHook: ToolEventTarget['addHook'] = (evtName, handler) => {
    this.eventTarget.addHook(evtName, handler);
  };

  /**
   * The `disposable` will be disposed when the tool is unloaded.
   */
  protected readonly disposable = new DisposableGroup();

  get active() {
    return this.gfx.tool.currentTool$.peek() === this;
  }

  get allowDragWithRightButton() {
    return false;
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

  constructor(readonly gfx: GfxController) {
    super();
  }

  static override setup(di: Container): void {
    if (!this.toolName) {
      throw new BlockSuiteError(
        ErrorCode.ValueNotExists,
        `The tool constructor '${this.name}' should have a static 'toolName' property.`
      );
    }

    di.addImpl(ToolIdentifier(this.toolName), this, [GfxControllerIdentifier]);
  }

  /**
   * Called when the tool is activated.
   * @param _ - The data passed as second argument when calling `ToolController.use`.
   */
  activate(_: Option): void {}

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
  mounted(): void {}

  pointerDown(_: PointerEventState): void {}

  pointerMove(_: PointerEventState): void {}

  pointerOut(_: PointerEventState): void {}

  pointerUp(_: PointerEventState): void {}

  tripleClick(_: PointerEventState): void {}

  /**
   * Called when the tool is unloaded, usually when the whole `ToolController` is destroyed.
   */
  unmounted(): void {}
}

export const ToolIdentifier = createIdentifier<BaseTool>('GfxTool');

export interface GfxToolsMap {}

export interface GfxToolsOption {}

export type GfxToolsFullOption = {
  [Key in keyof GfxToolsMap]: Key extends keyof GfxToolsOption
    ? { type: Key } & GfxToolsOption[Key]
    : { type: Key };
};

export type GfxToolsFullOptionValue =
  GfxToolsFullOption[keyof GfxToolsFullOption];
