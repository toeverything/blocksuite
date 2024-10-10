import type { ServiceIdentifier } from '@blocksuite/global/di';

import {
  DisposableGroup,
  type IBound,
  type IPoint,
} from '@blocksuite/global/utils';
import { Signal } from '@preact/signals-core';

import type { PointerEventState } from '../../event/index.js';
import type { GfxController } from '../controller.js';

import { GfxExtension, GfxExtensionIdentifier } from '../controller.js';
import { type BaseTool, ToolIdentifier } from './tool.js';

const supportedEvents = [
  'dragStart',
  'dragEnd',
  'dragMove',
  'pointerMove',
  'pointerDown',
  'pointerUp',
  'click',
  'doubleClick',
  'tripleClick',
  'pointerOut',
  'contextMenu',
] as const;

export interface ToolEventTarget {
  addHook(
    evtName: (typeof supportedEvents)[number],
    handler: (evtState: PointerEventState) => undefined | boolean
  ): () => void;
}

export type SupportedEvents = (typeof supportedEvents)[number];

export const eventTarget = Symbol('eventTarget');

export class ToolController extends GfxExtension {
  static override key = 'ToolController';

  private _disposableGroup = new DisposableGroup();

  private _tools = new Map<string, BaseTool>();

  readonly currentToolName$ = new Signal<keyof BlockSuite.GfxToolsMap>();

  readonly dragging$ = new Signal<boolean>(false);

  /**
   * The area that is being dragged.
   * The coordinates are in model space.
   */
  readonly draggingArea$ = new Signal<
    IBound & {
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }
  >({
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    endX: 0,
    endY: 0,
  });

  readonly draggingClientArea$ = new Signal<
    IBound & {
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }
  >({
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    endX: 0,
    endY: 0,
  });

  /**
   * The last mouse move position
   * The coordinates are in browser space
   */
  readonly lastMousePos$ = new Signal<IPoint>({
    x: 0,
    y: 0,
  });

  get currentTool$() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    return {
      get value() {
        return self._tools.get(self.currentToolName$.value);
      },
      peek() {
        return self._tools.get(self.currentToolName$.peek());
      },
    };
  }

  get currentToolOption$() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    return {
      peek(): BlockSuite.GfxToolsFullOptionValue | null {
        const currentTool = self.currentTool$.peek();
        const option = currentTool?.activatedOption ?? {};

        if (currentTool) {
          return {
            type: currentTool.toolName,
            ...option,
          } as unknown as BlockSuite.GfxToolsFullOptionValue;
        }

        return null;
      },

      get value(): BlockSuite.GfxToolsFullOptionValue | null {
        const currentTool = self.currentTool$.value;
        const option = currentTool?.activatedOption ?? {};

        if (currentTool) {
          return {
            type: currentTool.toolName,
            ...option,
          } as unknown as BlockSuite.GfxToolsFullOptionValue;
        }

        return null;
      },
    };
  }

  static override extendGfx(gfx: GfxController) {
    if (gfx.tool) {
      throw new Error('The "tool" field has been taken in GfxController');
    }

    Object.defineProperty(gfx, 'tool', {
      get() {
        return gfx.std.provider.get(ToolControllerIdentifier);
      },
    });
  }

  private _initializeEvents() {
    const hooks: Record<
      string,
      ((evtState: PointerEventState) => undefined | boolean)[]
    > = {};
    const invokeToolHandler = (
      evtName: SupportedEvents,
      evt: PointerEventState
    ) => {
      const evtHooks = hooks[evtName];
      const stopHandler = evtHooks?.reduce((pre, hook) => {
        return pre || hook(evt) === false;
      }, false);

      if (stopHandler || !this.currentTool$.peek()) {
        return;
      }

      this.currentTool$.peek()?.[evtName](evt);
    };

    /**
     * Hook into the event lifecycle.
     * All hooks will be executed despite the current active tool.
     * This is useful for tools that need to perform some action before an event is handled.
     * @param evtName
     * @param handler
     */
    const addHook = (
      evtName: (typeof supportedEvents)[number],
      handler: (evtState: PointerEventState) => undefined | boolean
    ) => {
      hooks[evtName] = hooks[evtName] ?? [];
      hooks[evtName].push(handler);

      return () => {
        const idx = hooks[evtName].indexOf(handler);
        if (idx !== -1) {
          hooks[evtName].splice(idx, 1);
        }
      };
    };

    let draggingStart: {
      x: number;
      y: number;
      originX: number;
      originY: number;
    } = {
      x: 0,
      y: 0,
      originX: 0,
      originY: 0,
    };

    this._disposableGroup.add(
      this.std.event.add('dragStart', ctx => {
        this.dragging$.value = true;
        const evt = ctx.get('pointerState');
        const [x, y] = this.gfx.viewport.toModelCoord(evt.x, evt.y);

        draggingStart = { x, y, originX: evt.x, originY: evt.y };

        this.draggingArea$.value = {
          startX: x,
          startY: y,
          endX: x,
          endY: y,
          x: draggingStart.x,
          y: draggingStart.y,
          w: 0,
          h: 0,
        };

        this.draggingClientArea$.value = {
          startX: evt.x,
          startY: evt.y,
          endX: evt.x,
          endY: evt.y,
          x: evt.x,
          y: evt.y,
          w: 0,
          h: 0,
        };

        invokeToolHandler('dragStart', evt);
      })
    );

    this._disposableGroup.add(
      this.std.event.add('dragMove', ctx => {
        this.dragging$.value = true;
        const evt = ctx.get('pointerState');
        const [x, y] = this.gfx.viewport.toModelCoord(evt.x, evt.y);

        this.draggingArea$.value = {
          ...this.draggingArea$.peek(),
          w: Math.abs(x - draggingStart.x),
          h: Math.abs(y - draggingStart.y),
          x: Math.min(x, draggingStart.x),
          y: Math.min(y, draggingStart.y),
          startX: Math.min(x, draggingStart.x),
          startY: Math.min(y, draggingStart.y),
          endX: Math.max(x, draggingStart.x),
          endY: Math.max(y, draggingStart.y),
        };

        this.draggingClientArea$.value = {
          ...this.draggingClientArea$.peek(),
          w: Math.abs(evt.x - draggingStart.originX),
          h: Math.abs(evt.y - draggingStart.originY),
          x: Math.min(evt.x, draggingStart.originX),
          y: Math.min(evt.y, draggingStart.originY),
          startX: Math.min(evt.x, draggingStart.originX),
          startY: Math.min(evt.y, draggingStart.originY),
          endX: Math.max(evt.x, draggingStart.originX),
          endY: Math.max(evt.y, draggingStart.originY),
        };

        invokeToolHandler('dragMove', evt);
      })
    );

    this._disposableGroup.add(
      this.std.event.add('dragEnd', ctx => {
        this.dragging$.value = false;
        const evt = ctx.get('pointerState');

        try {
          invokeToolHandler('dragEnd', evt);
        } catch (e) {
          console.warn(
            `dragEnd handler of ${this.currentToolName$.peek()} throws an error`,
            e
          );
        }

        this.draggingArea$.value = {
          x: 0,
          y: 0,
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0,
          w: 0,
          h: 0,
        };

        this.draggingClientArea$.value = {
          x: 0,
          y: 0,
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0,
          w: 0,
          h: 0,
        };
      })
    );

    this._disposableGroup.add(
      this.std.event.add('pointerMove', ctx => {
        this.dragging$.value = false;
        const evt = ctx.get('pointerState');

        this.lastMousePos$.value = {
          x: evt.x,
          y: evt.y,
        };

        invokeToolHandler('pointerMove', evt);
      })
    );

    supportedEvents.slice(4).forEach(evtName => {
      this._disposableGroup.add(
        this.std.event.add(evtName, ctx => {
          const evt = ctx.get('pointerState');

          invokeToolHandler(evtName, evt);
        })
      );
    });

    return {
      addHook,
    };
  }

  private _register(tools: BaseTool) {
    if (this._tools.has(tools.toolName)) {
      this._tools.get(tools.toolName)?.onunload();
    }

    this._tools.set(tools.toolName, tools);
    tools.onload();
  }

  get<K extends keyof BlockSuite.GfxToolsMap>(
    key: K
  ): BlockSuite.GfxToolsMap[K] {
    return this._tools.get(key) as BlockSuite.GfxToolsMap[K];
  }

  override mounted(): void {
    const { addHook } = this._initializeEvents();

    const eventTarget: ToolEventTarget = {
      addHook,
    };

    this.std.provider.getAll(ToolIdentifier).forEach(tool => {
      // @ts-ignore
      tool['eventTarget'] = eventTarget;
      this._register(tool);
    });
  }

  // @ts-ignore
  setTool(toolName: BlockSuite.GfxToolsFullOptionValue): void;

  setTool<K extends keyof BlockSuite.GfxToolsMap>(
    toolName: K,
    ...args: K extends keyof BlockSuite.GfxToolsOption
      ? [option: BlockSuite.GfxToolsOption[K]]
      : [void]
  ): void;
  setTool<K extends keyof BlockSuite.GfxToolsMap>(
    toolName: K | BlockSuite.GfxToolsFullOptionValue,
    ...args: K extends keyof BlockSuite.GfxToolsOption
      ? [option: BlockSuite.GfxToolsOption[K]]
      : [void]
  ): void {
    this.currentTool$.peek()?.deactivate();

    const option = typeof toolName === 'string' ? args[0] : toolName;

    this.currentToolName$.value =
      typeof toolName === 'string'
        ? toolName
        : // @ts-ignore
          (toolName.type as K);

    const currentTool = this.currentTool$.peek();
    if (!currentTool) {
      throw new Error(`Tool "${this.currentToolName$.value}" is not defined`);
    }

    currentTool.activatedOption = option ?? {};
    currentTool.activate(currentTool.activatedOption);
  }

  override unmounted(): void {
    this.currentTool$.peek()?.deactivate();
    this._tools.forEach(tool => {
      tool.onunload();
      tool['disposable'].dispose();
    });
  }
}

export const ToolControllerIdentifier = GfxExtensionIdentifier(
  'ToolController'
) as ServiceIdentifier<ToolController>;

declare module '../controller.js' {
  interface GfxController {
    readonly tool: ToolController;
  }
}
