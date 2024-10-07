import {
  DisposableGroup,
  type IBound,
  type IPoint,
} from '@blocksuite/global/utils';
import { Signal } from '@preact/signals-core';

import type { PointerEventState } from '../../event/index.js';
import type { BlockStdScope } from '../../scope/block-std-scope.js';
import type { BaseTool } from './tool.js';

import { GfxControllerIdentifier } from '../controller.js';

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

export class ToolController {
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

  readonly [eventTarget]: ToolEventTarget;

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

  get gfx() {
    return this.std.get(GfxControllerIdentifier);
  }

  constructor(readonly std: BlockStdScope) {
    const { addHook } = this._initializeEvents();

    this[eventTarget] = {
      addHook,
    };
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
    } = {
      x: 0,
      y: 0,
    };

    this._disposableGroup.add(
      this.std.event.add('dragStart', ctx => {
        this.dragging$.value = true;
        const evt = ctx.get('pointerState');
        const [x, y] = this.gfx.viewport.toModelCoord(evt.x, evt.y);

        draggingStart = { x, y };

        this.draggingArea$.value = {
          startX: x,
          startY: y,
          endX: x,
          endY: y,
          x: draggingStart.x,
          y: draggingStart.y,
          w: Math.abs(x - draggingStart.x),
          h: Math.abs(y - draggingStart.y),
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
          endX: x,
          endY: y,
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
          console.warn('dragEnd handler throws an error', e);
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

  dispose() {
    this._tools.forEach(tool => {
      tool.onunload();
    });
  }

  register(tools: BaseTool) {
    if (this._tools.has(tools.toolName)) {
      this._tools.get(tools.toolName)?.onunload();
    }

    this._tools.set(tools.toolName, tools);
    tools.onload();
  }

  setTool<K extends keyof BlockSuite.GfxToolsMap>(
    toolName: K,
    ...options: K extends keyof BlockSuite.GfxToolsOption
      ? [option: BlockSuite.GfxToolsOption[K]]
      : [option: void]
  ) {
    this.currentTool$.peek()?.deactivate();
    this.currentToolName$.value = toolName;
    this.currentTool$.peek()?.activate(options[0] ?? {});
  }
}
