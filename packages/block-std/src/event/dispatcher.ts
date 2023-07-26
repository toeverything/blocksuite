import { DisposableGroup } from '@blocksuite/global/utils';

import type { BlockStore } from '../store/index.js';
import { PathMap } from '../store/index.js';
import type { UIEventHandler } from './base.js';
import { UIEventStateContext } from './base.js';
import { UIEventState } from './base.js';
import { KeyboardControl } from './keyboard.js';
import { bindKeymap } from './keymap.js';
import { PointerControl } from './pointer.js';
import { BlockEventState } from './state.js';
import { toLowerCase } from './utils.js';

const bypassEventNames = [
  'beforeInput',
  'compositionStart',
  'compositionUpdate',
  'compositionEnd',

  'paste',
  'copy',
  'blur',
  'focus',
  'drop',
  'contextMenu',
  'wheel',
] as const;

const globalEventNames = ['selectionChange'] as const;

const eventNames = [
  'click',
  'doubleClick',
  'tripleClick',

  'pointerDown',
  'pointerMove',
  'pointerUp',
  'pointerOut',

  'dragStart',
  'dragMove',
  'dragEnd',

  'keyDown',
  'keyUp',

  ...bypassEventNames,
  ...globalEventNames,
] as const;

export type EventName = (typeof eventNames)[number];
export type EventOptions = {
  flavour?: string;
  path?: string[];
};
export type EventHandlerRunner = {
  fn: UIEventHandler;
  flavour?: string;
  path?: string[];
};

export class UIEventDispatcher {
  disposables = new DisposableGroup();

  private _handlersMap = Object.fromEntries(
    eventNames.map((name): [EventName, Array<EventHandlerRunner>] => [name, []])
  ) as Record<EventName, Array<EventHandlerRunner>>;

  private _pointerControl: PointerControl;
  private _keyboardControl: KeyboardControl;

  constructor(public blockStore: BlockStore) {
    this._pointerControl = new PointerControl(this);
    this._keyboardControl = new KeyboardControl(this);
  }

  mount() {
    if (this.disposables.disposed) {
      this.disposables = new DisposableGroup();
    }
    this._bindEvents();
  }

  unmount() {
    this.disposables.dispose();
  }

  get root() {
    return this.blockStore.root;
  }

  run(name: EventName, context: UIEventStateContext) {
    const runners = this.getEventScope(name, context.get('defaultState').event);
    if (!runners) {
      return;
    }

    for (const runner of runners) {
      const { fn } = runner;
      const result = fn(context);
      if (result) {
        return;
      }
    }
  }

  add(name: EventName, handler: UIEventHandler, options?: EventOptions) {
    const runner: EventHandlerRunner = {
      fn: handler,
      flavour: options?.flavour,
      path: options?.path,
    };
    this._handlersMap[name].unshift(runner);
    return () => {
      if (this._handlersMap[name].includes(runner)) {
        this._handlersMap[name] = this._handlersMap[name].filter(
          x => x !== runner
        );
      }
    };
  }

  bindHotkey(keymap: Record<string, UIEventHandler>, options?: EventOptions) {
    return this.add('keyDown', bindKeymap(keymap), options);
  }

  private get _currentSelections() {
    return this.blockStore.selectionManager.value;
  }

  getEventScope(name: EventName, event: Event) {
    const handlers = this._handlersMap[name];
    if (!handlers) return;

    if (
      !event.target ||
      event.target === this.root ||
      event.target === document ||
      event.target === window ||
      event.target === document.body ||
      !(event.target instanceof Node)
    ) {
      return this._buildEventScopeBySelection(name);
    }

    return this._buildEventScopeByTarget(name, event.target);
  }

  createEventBlockState(event: Event) {
    const targetMap = new PathMap();
    this._currentSelections.forEach(selection => {
      const _path = selection.path;
      const instance = this.blockStore.viewStore.blockViewMap.get(_path);
      if (instance) {
        targetMap.set(_path, instance);
      }
    });

    return new BlockEventState({
      event,
      target: targetMap,
    });
  }

  private _buildEventScope(
    name: EventName,
    flavours: string[],
    paths: string[][]
  ) {
    const handlers = this._handlersMap[name];
    if (!handlers) return;

    const globalEvents = handlers.filter(
      handler => handler.flavour === undefined && handler.path === undefined
    );

    const pathEvents = paths.flatMap(path => {
      return handlers.filter(handler => {
        if (handler.path === undefined) return false;
        return PathMap.includes(path, handler.path);
      });
    });

    const flavourEvents = flavours.flatMap(flavour => {
      return handlers.filter(handler => handler.flavour === flavour);
    });

    return pathEvents.concat(flavourEvents).concat(globalEvents);
  }

  private _buildEventScopeByTarget(name: EventName, target: Node) {
    const handlers = this._handlersMap[name];
    if (!handlers) return;

    const blockView = this.blockStore.config.getBlockViewByNode(target);
    const path = this.blockStore.viewStore.blockViewMap.getPath(blockView);
    if (!path) return;

    const flavours = path
      .map(blockId => {
        return this.blockStore.page.getBlockById(blockId)?.flavour;
      })
      .filter((flavour): flavour is string => {
        return !!flavour;
      });

    return this._buildEventScope(name, flavours, [path]);
  }

  private _buildEventScopeBySelection(name: EventName) {
    const handlers = this._handlersMap[name];
    if (!handlers) return;

    const selections = this._currentSelections;
    const seen: Record<string, boolean> = {};

    const flavours = selections
      .map(selection => selection.path)
      .flatMap(path => {
        return path.map(blockId => {
          return this.blockStore.page.getBlockById(blockId)?.flavour;
        });
      })
      .filter((flavour): flavour is string => {
        if (!flavour) return false;
        if (seen[flavour]) return false;
        seen[flavour] = true;
        return true;
      })
      .reverse();

    const paths = selections.map(selection => selection.path);

    return this._buildEventScope(name, flavours, paths);
  }

  private _bindEvents() {
    bypassEventNames.forEach(eventName => {
      this.disposables.addFromEvent(
        this.root,
        toLowerCase(eventName),
        event => {
          this.run(
            eventName,
            UIEventStateContext.from(
              new UIEventState(event),
              this.createEventBlockState(event)
            )
          );
        }
      );
    });
    globalEventNames.forEach(eventName => {
      this.disposables.addFromEvent(document, toLowerCase(eventName), event => {
        this.run(
          eventName,
          UIEventStateContext.from(
            new UIEventState(event),
            this.createEventBlockState(event)
          )
        );
      });
    });
    this._pointerControl.listen();
    this._keyboardControl.listen();
  }
}
