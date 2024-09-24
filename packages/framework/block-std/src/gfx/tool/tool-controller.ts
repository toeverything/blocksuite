import {
  type Constructor,
  DisposableGroup,
  type IBound,
} from '@blocksuite/global/utils';
import { Signal } from '@preact/signals-core';

import type { UIEventStateContext } from '../../event/index.js';
import type { BlockStdScope } from '../../scope/block-std-scope.js';
import type { AbstractTool } from './tool.js';

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
  addEvent(
    toolName: string,
    event: string,
    handler: (evt: UIEventStateContext) => void
  ): void;
  addHook(
    evtName: (typeof supportedEvents)[number],
    handler: (evtState: UIEventStateContext) => undefined | boolean
  ): void;
}

export type SupportedEvents = (typeof supportedEvents)[number];

export const eventTarget = Symbol('eventTarget');

export class ToolController {
  private _disposableGroup = new DisposableGroup();

  private readonly _toolName$ = new Signal<string>('');

  private _tools = new Map<string, AbstractTool>();

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
        return self._tools.get(self._toolName$.value);
      },
      peek() {
        return self._tools.get(self._toolName$.peek());
      },
    };
  }

  get host() {
    return this.std.host;
  }

  constructor(readonly std: BlockStdScope) {
    const { addEvent, addHook } = this._initializeEvents();
    this[eventTarget] = {
      addEvent,
      addHook,
    };
  }

  private _initializeEvents() {
    const handlers: Record<
      string,
      Record<string, (evtState: UIEventStateContext) => void>
    > = {};
    const hooks: Record<
      string,
      ((evtState: UIEventStateContext) => undefined | boolean)[]
    > = {};
    const invokeToolHandler = (evtName: string, ctx: UIEventStateContext) => {
      const toolName = this.currentTool$.value?.name;
      if (!toolName) {
        return;
      }

      const evtHooks = hooks[evtName];
      const stopHandler = evtHooks?.reduce((pre, hook) => {
        return pre || hook(ctx) === false;
      }, false);

      if (stopHandler) {
        return;
      }

      const handler = handlers[toolName]?.[evtName];
      handler?.(ctx);
    };

    /**
     * Add an event handler to the tool.
     * @param toolName
     * @param evtName
     * @param handler
     */
    const addEvent = (
      toolName: string,
      evtName: (typeof supportedEvents)[number],
      handler: (evtState: UIEventStateContext) => void
    ) => {
      if (!handlers[toolName]) {
        handlers[toolName] = {};
      }

      handlers[toolName][evtName] = handler;
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
      addEvent,
      addHook,
    };
  }

  dispose() {
    this._tools.forEach(tool => {
      tool.onunload();
    });
  }

  register(toolCtors: Constructor<AbstractTool>[]) {
    toolCtors.forEach(ctor => {
      const tool = new ctor(this);

      if (this._tools.has(tool.name)) {
        throw new Error(`Tool "${tool.name}" is already registered`);
      }

      this._tools.set(tool.name, tool);
      tool.onload();
    });
  }

  use(toolName: string, options: Record<string, unknown> = {}) {
    this.currentTool$.peek()?.deactivate();
    this._toolName$.value = toolName;
    this.currentTool$.peek()?.activate(options);
  }
}
