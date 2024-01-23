import type {
  EventName,
  UIEventHandler,
  UIEventStateContext,
} from '@blocksuite/block-std';

import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import type { EdgelessPageService } from '../edgeless-page-service.js';

type HookContext = {
  store: Record<string, unknown>;
  abort: () => void;
};
type HookHandler = (event: UIEventStateContext, ctx: HookContext) => void;

export class EdgelessToolsManager {
  private _tools: Map<string, ToolController> = new Map();
  private _handlers: Map<ToolController, Record<string, UIEventHandler>> =
    new Map();
  private _hooks: Map<string, HookHandler[]> = new Map();
  private _mounted = false;
  private _service!: EdgelessPageService;
  private _container!: EdgelessPageBlockComponent;
  private _current!: string;
  private _dragging = false;

  get dragging() {
    return this._dragging;
  }

  get currentTool() {
    return this._tools.get(this._current);
  }

  constructor(service: EdgelessPageService) {
    this._service = service;
  }

  private _mountController(tool: ToolController) {
    tool['_container'] = this._container;
    tool['_service'] = this._service;
    tool['_tool'] = this;
    tool.mount();
  }

  private _initEvent() {
    const hookCtxStore: Record<string, unknown> = {};

    const setupHandler = (
      eventName: EventName,
      handler?: UIEventHandler,
      options?: {
        stopDefaultHandler?: boolean;
      }
    ) => {
      this._container.dispatcher.add(eventName, evtCtx => {
        if (handler) {
          handler(evtCtx);
        }

        const hooks = this._hooks.get(eventName);
        let aborted = false;
        if (hooks?.length) {
          hooks.forEach(hook => {
            hook(evtCtx, {
              store: hookCtxStore,
              abort: () => (aborted = true),
            });
          });

          if (aborted) return;
        }

        const tool = this.currentTool;
        if (tool && options?.stopDefaultHandler !== true) {
          this._handlers.get(tool)?.[eventName]?.(evtCtx);
        }
      });
    };

    const eventsUseDefaultHandler: EventName[] = [
      'dragMove',
      'click',
      'tripleClick',
      'pointerMove',
      'pointerDown',
      'pointerUp',
      'pointerOut',
      'contextMenu',
    ];

    eventsUseDefaultHandler.forEach(eventName => {
      setupHandler(eventName);
    });

    setupHandler('dragStart', () => {
      this._dragging = true;
    });
    setupHandler('dragEnd', () => {
      this._dragging = false;
    });
  }

  mount(container: EdgelessPageBlockComponent, currentTool?: string) {
    if (this._mounted) return;

    this._container = container;
    this._initEvent();
    this._mounted = true;
    this._tools.forEach(tool => {
      this._mountController(tool);
    });
    this._current = currentTool ?? '';
  }

  register(tool: ToolController) {
    this._tools.set(tool.name, tool);

    if (this._mounted) {
      this._mountController(tool);
    }
  }

  protected _add(
    eventName: EventName,
    handler: UIEventHandler,
    tool: ToolController
  ) {
    const handlers = this._handlers.get(tool) || {};
    handlers[eventName] = handler;
    this._handlers.set(tool, handlers);
  }

  protected _hook(eventName: EventName, handler: HookHandler) {
    const hooks = this._hooks.get(eventName) || [];
    hooks.push(handler);
    this._hooks.set(eventName, hooks);
  }
}

export abstract class ToolController {
  protected _container!: EdgelessPageBlockComponent;
  protected _service!: EdgelessPageService;
  protected _tool!: EdgelessToolsManager;

  protected on(eventName: EventName, handler: UIEventHandler) {
    this._tool['_add'](eventName, handler, this);
  }

  protected hook(eventName: EventName, handler: HookHandler) {
    this._tool['_hook'](eventName, handler);
  }

  abstract readonly name: string;

  abstract mount(): void;

  abstract unmount(): void;
}
