import { DisposableGroup, type IBound } from '@blocksuite/global/utils';
import { Signal } from '@preact/signals-core';

import type { UIEventStateContext } from '../../event/index.js';
import type { BlockStdScope } from '../../scope/block-std-scope.js';
import type { BaseTool } from './tool.js';

const supportedEvents = [
  'dragStart',
  'dragEnd',
  'dragMove',
  'click',
  'doubleClick',
  'tripleClick',
  'pointerMove',
  'pointerDown',
  'pointerUp',
  'pointerOut',
  'contextMenu',
] as const;

export interface ToolEventTarget {
  addHook(
    evtName: (typeof supportedEvents)[number],
    handler: (evtState: UIEventStateContext) => undefined | boolean
  ): () => void;
}

export type SupportedEvents = (typeof supportedEvents)[number];

export const eventTarget = Symbol('eventTarget');

export class ToolController {
  private _disposableGroup = new DisposableGroup();

  private _tools = new Map<string, BaseTool>();

  readonly currentToolName$ = new Signal<string>('');

  readonly dragging$ = new Signal<boolean>(false);

  readonly draggingArea$ = new Signal<IBound>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  });

  readonly [eventTarget]: ToolEventTarget;

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

  constructor(readonly std: BlockStdScope) {
    const { addHook } = this._initializeEvents();

    this[eventTarget] = {
      addHook,
    };
  }

  private _initializeEvents() {
    const hooks: Record<
      string,
      ((evtState: UIEventStateContext) => undefined | boolean)[]
    > = {};
    const invokeToolHandler = (
      evtName: SupportedEvents,
      ctx: UIEventStateContext
    ) => {
      const evtHooks = hooks[evtName];
      const stopHandler = evtHooks?.reduce((pre, hook) => {
        return pre || hook(ctx) === false;
      }, false);

      if (stopHandler || !this.currentTool$.peek()) {
        return;
      }

      this.currentTool$.peek()?.[evtName](ctx);
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
      handler: (evtState: UIEventStateContext) => undefined | boolean
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

    this._disposableGroup.add(
      this.std.event.add('dragStart', ctx => {
        this.dragging$.value = true;
        invokeToolHandler('dragStart', ctx);
      })
    );

    this._disposableGroup.add(
      this.std.event.add('dragEnd', ctx => {
        this.dragging$.value = false;
        invokeToolHandler('dragEnd', ctx);
      })
    );

    supportedEvents.slice(2).forEach(evtName => {
      this._disposableGroup.add(
        this.std.event.add(evtName, ctx => {
          invokeToolHandler(evtName, ctx);
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

  use(toolName: string, options: Record<string, unknown> = {}) {
    this.currentTool$.peek()?.deactivate();
    this.currentToolName$.value = toolName;
    this.currentTool$.peek()?.activate(options);
  }
}
