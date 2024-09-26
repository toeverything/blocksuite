import type { ServiceIdentifier } from '@blocksuite/global/di';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import {
  DisposableGroup,
  type IBound,
  type IPoint,
  Slot,
} from '@blocksuite/global/utils';
import { Signal } from '@preact/signals-core';

import type { PointerEventState } from '../../event/index.js';
import type { GfxController } from '../controller.js';

import { GfxExtension, GfxExtensionIdentifier } from '../extension.js';
import { type BaseTool, type GfxToolsFullOptionValue, type GfxToolsMap, type GfxToolsOption, ToolIdentifier } from './tool.js';

type BuiltInHookEvent<T> = {
  data: T;
  preventDefault(): void;
};

type BuiltInEventMap = {
  beforeToolUpdate: BuiltInHookEvent<{
    toolName: keyof GfxToolsMap;
  }>;
  toolUpdate: BuiltInHookEvent<{ toolName: keyof GfxToolsMap }>;
};

type BuiltInSlotContext = {
  [K in keyof BuiltInEventMap]: { event: K } & BuiltInEventMap[K];
}[SupportedHooks];

export type SupportedHooks = keyof BuiltInEventMap;

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

export type SupportedEvents = (typeof supportedEvents)[number];

export interface ToolEventTarget {
  addHook<K extends SupportedHooks | SupportedEvents>(
    evtName: K,
    handler: (
      evtState: K extends SupportedHooks
        ? BuiltInEventMap[K]
        : PointerEventState
    ) => void | boolean
  ): void;
}

export const eventTarget = Symbol('eventTarget');

export class ToolController extends GfxExtension {
  static override key = 'ToolController';

  private _builtInHookSlot = new Slot<BuiltInSlotContext>();

  private _disposableGroup = new DisposableGroup();

  private _toolOption$ = new Signal<GfxToolsFullOptionValue>(
    {} as GfxToolsFullOptionValue
  );

  private _tools = new Map<string, BaseTool>();

  readonly currentToolName$ = new Signal<keyof GfxToolsMap>();

  readonly dragging$ = new Signal<boolean>(false);

  /**
   * The area that is being dragged.
   * The coordinates are in browser space.
   */
  readonly draggingViewArea$ = new Signal<
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
      peek() {
        const option = self._toolOption$.peek() as unknown as { type: string };

        if (!option.type) {
          option.type = '';
        }

        return option as GfxToolsFullOptionValue;
      },

      get value(): GfxToolsFullOptionValue {
        const option = self._toolOption$.value as unknown as { type: string };

        if (!option.type) {
          option.type = '';
        }

        return option as GfxToolsFullOptionValue;
      },
    };
  }

  /**
   * The area that is being dragged.
   * The coordinates are in model space.
   */
  get draggingArea$() {
    const compute = (peek: boolean) => {
      const area = peek
        ? this.draggingViewArea$.peek()
        : this.draggingViewArea$.value;
      const [startX, startY] = this.gfx.viewport.toModelCoord(
        area.startX,
        area.startY
      );
      const [endX, endY] = this.gfx.viewport.toModelCoord(area.endX, area.endY);

      return {
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        w: Math.abs(endX - startX),
        h: Math.abs(endY - startY),
        startX,
        startY,
        endX,
        endY,
      };
    };

    return {
      value() {
        return compute(false);
      },
      peek() {
        return compute(true);
      },
    };
  }

  static override extendGfx(gfx: GfxController) {
    Object.defineProperty(gfx, 'tool', {
      get() {
        return this.std.provider.get(ToolControllerIdentifier);
      },
    });
  }

  private _createBuiltInHookCtx<K extends keyof BuiltInEventMap>(
    eventName: K,
    data: BuiltInEventMap[K]['data']
  ): {
    prevented: boolean;
    slotCtx: BuiltInSlotContext;
  } {
    const ctx = {
      prevented: false,
      slotCtx: {
        event: eventName,
        data,
        preventDefault() {
          ctx.prevented = true;
        },
      } as BuiltInSlotContext,
    };

    return ctx;
  }

  private _initializeEvents() {
    const hooks: Record<
      string,
      ((
        evtState: PointerEventState | BuiltInSlotContext
      ) => undefined | boolean)[]
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
    const addHook: ToolEventTarget['addHook'] = (evtName, handler) => {
      hooks[evtName] = hooks[evtName] ?? [];
      hooks[evtName].push(
        handler as (
          evtState: PointerEventState | BuiltInSlotContext
        ) => undefined | boolean
      );

      return () => {
        const idx = hooks[evtName].indexOf(
          handler as (
            evtState: PointerEventState | BuiltInSlotContext
          ) => undefined | boolean
        );
        if (idx !== -1) {
          hooks[evtName].splice(idx, 1);
        }
      };
    };

    this._disposableGroup.add(
      this.std.event.add('dragStart', ctx => {
        this.dragging$.value = true;
        const evt = ctx.get('pointerState');

        this.draggingViewArea$.value = {
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
        const draggingStart = {
          x: this.draggingArea$.peek().startX,
          y: this.draggingArea$.peek().startY,
          originX: this.draggingViewArea$.peek().startX,
          originY: this.draggingViewArea$.peek().startY,
        };

        this.draggingViewArea$.value = {
          ...this.draggingViewArea$.peek(),
          w: Math.abs(evt.x - draggingStart.originX),
          h: Math.abs(evt.y - draggingStart.originY),
          x: Math.min(evt.x, draggingStart.originX),
          y: Math.min(evt.y, draggingStart.originY),
          endX: evt.x,
          endY: evt.y,
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
          throw new Error(
            `dragEnd handler of ${this.currentToolName$.peek()} throws an error`,
            {
              cause: e,
            }
          );
        }

        this.draggingViewArea$.value = {
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

    this._builtInHookSlot.on(evt => {
      hooks[evt.event]?.forEach(hook => hook(evt));
    });

    return {
      addHook,
    };
  }

  private _register(tools: BaseTool) {
    if (this._tools.has(tools.toolName)) {
      this._tools.get(tools.toolName)?.unmounted();
    }

    this._tools.set(tools.toolName, tools);
    tools.mounted();
  }

  get<K extends keyof GfxToolsMap>(
    key: K
  ): GfxToolsMap[K] {
    return this._tools.get(key) as GfxToolsMap[K];
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

  setTool(toolName: GfxToolsFullOptionValue, ...args: [void]): void;
  setTool<K extends keyof GfxToolsMap>(
    toolName: K,
    ...args: K extends keyof GfxToolsOption
      ? [option: GfxToolsOption[K]]
      : [void]
  ): void;
  setTool<K extends keyof GfxToolsMap>(
    toolName: K | GfxToolsFullOptionValue,
    ...args: K extends keyof GfxToolsOption
      ? [option: GfxToolsOption[K]]
      : [void]
  ): void {
    const option = typeof toolName === 'string' ? args[0] : toolName;
    const toolNameStr =
      typeof toolName === 'string'
        ? toolName
        : ((toolName as { type: string }).type as K);

    const beforeUpdateCtx = this._createBuiltInHookCtx('beforeToolUpdate', {
      toolName: toolNameStr,
    });
    this._builtInHookSlot.emit(beforeUpdateCtx.slotCtx);

    this.currentTool$.peek()?.deactivate();
    this.currentToolName$.value = toolNameStr;

    const currentTool = this.currentTool$.peek();
    if (!currentTool) {
      throw new BlockSuiteError(
        ErrorCode.ValueNotExists,
        `Tool "${this.currentToolName$.value}" is not defined`
      );
    }

    currentTool.activatedOption = option ?? {};
    this._toolOption$.value = {
      ...currentTool.activatedOption,
      type: toolNameStr,
    } as GfxToolsFullOptionValue;
    currentTool.activate(currentTool.activatedOption);

    const afterUpdateCtx = this._createBuiltInHookCtx('toolUpdate', {
      toolName: toolNameStr,
    });
    this._builtInHookSlot.emit(afterUpdateCtx.slotCtx);
  }

  override unmounted(): void {
    this.currentTool$.peek()?.deactivate();
    this._tools.forEach(tool => {
      tool.unmounted();
      tool['disposable'].dispose();
    });
    this._builtInHookSlot.dispose();
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
