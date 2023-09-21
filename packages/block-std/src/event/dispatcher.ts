import { DisposableGroup } from '@blocksuite/global/utils';

import { PathFinder } from '../utils/index.js';
import type { UIEventHandler } from './base.js';
import { UIEventState, UIEventStateContext } from './base.js';
import { ClipboardControl } from './control/clipboard.js';
import { KeyboardControl } from './control/keyboard.js';
import { PointerControl } from './control/pointer.js';
import { RangeControl } from './control/range.js';
import { toLowerCase } from './utils.js';

const bypassEventNames = [
  'beforeInput',

  'blur',
  'focus',
  'drop',
  'contextMenu',
  'wheel',
] as const;

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

  'selectionChange',
  'compositionStart',
  'compositionUpdate',
  'compositionEnd',

  'cut',
  'copy',
  'paste',

  ...bypassEventNames,
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

export type EventScope = {
  runners: EventHandlerRunner[];
  flavours: string[];
  paths: string[][];
};

export class UIEventDispatcher {
  disposables = new DisposableGroup();

  private _handlersMap = Object.fromEntries(
    eventNames.map((name): [EventName, Array<EventHandlerRunner>] => [name, []])
  ) as Record<EventName, Array<EventHandlerRunner>>;

  private _pointerControl: PointerControl;
  private _keyboardControl: KeyboardControl;
  private _rangeControl: RangeControl;
  private _clipboardControl: ClipboardControl;

  constructor(public std: BlockSuite.Std) {
    this._pointerControl = new PointerControl(this);
    this._keyboardControl = new KeyboardControl(this);
    this._rangeControl = new RangeControl(this);
    this._clipboardControl = new ClipboardControl(this);
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
    return this.std.root;
  }

  run(name: EventName, context: UIEventStateContext, scope?: EventScope) {
    const { event } = context.get('defaultState');
    if (!scope) {
      scope = this._getEventScope(name, event);
      if (!scope) {
        return;
      }
    }

    for (const runner of scope.runners) {
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

  bindHotkey = (...args: Parameters<KeyboardControl['bindHotkey']>) =>
    this._keyboardControl.bindHotkey(...args);

  private get _currentSelections() {
    return this.std.selection.value;
  }

  private _getEventScope(name: EventName, event: Event) {
    const handlers = this._handlersMap[name];
    if (!handlers) return;

    let output: EventScope | undefined;

    if (event.target && event.target instanceof Node) {
      output = this._buildEventScopeByTarget(name, event.target);
    }

    if (!output) {
      output = this._buildEventScopeBySelection(name);
    }

    return output;
  }

  buildEventScope(
    name: EventName,
    flavours: string[],
    paths: string[][]
  ): EventScope | undefined {
    const handlers = this._handlersMap[name];
    if (!handlers) return;

    const globalEvents = handlers.filter(
      handler => handler.flavour === undefined && handler.path === undefined
    );

    const pathEvents = handlers.filter(handler => {
      const _path = handler.path;
      if (_path === undefined) return false;
      return paths.some(path => PathFinder.includes(path, _path));
    });

    const flavourEvents = handlers.filter(
      handler => handler.flavour && flavours.includes(handler.flavour)
    );

    return {
      runners: pathEvents.concat(flavourEvents).concat(globalEvents),
      flavours,
      paths,
    };
  }

  private _buildEventScopeByTarget(name: EventName, target: Node) {
    const handlers = this._handlersMap[name];
    if (!handlers) return;

    const path = this.std.view.getNodeView(target)?.path;
    if (!path) return;

    const flavours = path
      .map(blockId => {
        return this.std.page.getBlockById(blockId)?.flavour;
      })
      .filter((flavour): flavour is string => {
        return !!flavour;
      })
      .reverse();

    return this.buildEventScope(name, flavours, [path]);
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
          return this.std.page.getBlockById(blockId)?.flavour;
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

    return this.buildEventScope(name, flavours, paths);
  }

  private _bindEvents() {
    bypassEventNames.forEach(eventName => {
      this.disposables.addFromEvent(
        this.root,
        toLowerCase(eventName),
        event => {
          this.run(
            eventName,
            UIEventStateContext.from(new UIEventState(event))
          );
        }
      );
    });

    this._pointerControl.listen();
    this._keyboardControl.listen();
    this._rangeControl.listen();
    this._clipboardControl.listen();
  }
}
