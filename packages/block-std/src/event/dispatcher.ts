import { DisposableGroup } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import type { SelectionManager } from '../selection/index.js';
import type { UIEventHandler } from './base.js';
import { UIEventStateContext } from './base.js';
import { UIEventState } from './base.js';
import { KeyboardControl } from './keyboard.js';
import { bindKeymap } from './keymap.js';
import { PointerControl } from './pointer.js';
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
};
export type EventHandlerRunner = {
  fn: UIEventHandler;
  flavour?: string;
};

export class UIEventDispatcher {
  disposables = new DisposableGroup();

  private _handlersMap = Object.fromEntries(
    eventNames.map((name): [EventName, Array<EventHandlerRunner>] => [name, []])
  ) as Record<EventName, Array<EventHandlerRunner>>;

  private _pointerControl: PointerControl;
  private _keyboardControl: KeyboardControl;

  constructor(
    public root: HTMLElement,
    private selection: SelectionManager,
    private page: Page
  ) {
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

  run(name: EventName, context: UIEventStateContext) {
    const runners = this._buildEventRunner(name);
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

  bindHotkey(keymap: Record<string, UIEventHandler>) {
    return this.add('keyDown', bindKeymap(keymap));
  }

  private get _currentSelections() {
    return this.selection.value;
  }

  private _buildEventRunner(name: EventName) {
    const handlers = this._handlersMap[name];
    if (!handlers) return;

    const selections = this._currentSelections;
    const seen: Record<string, boolean> = {};

    const paths = selections
      .flatMap(selection => {
        return selection.path.map(blockId => {
          return this.page.getBlockById(blockId)?.flavour;
        });
      })
      .filter((flavour): flavour is string => {
        if (!flavour) return false;
        if (seen[flavour]) return false;
        seen[flavour] = true;
        return true;
      })
      .reverse();

    const globalEvents = handlers.filter(
      handler => handler.flavour === undefined
    );

    const pathEvents = paths.flatMap(flavour => {
      return handlers.filter(handler => handler.flavour === flavour);
    });

    return pathEvents.concat(globalEvents);
  }

  private _bindEvents() {
    bypassEventNames.forEach(eventName => {
      this.disposables.addFromEvent(this.root, toLowerCase(eventName), e => {
        this.run(eventName, UIEventStateContext.from(new UIEventState(e)));
      });
    });
    globalEventNames.forEach(eventName => {
      this.disposables.addFromEvent(document, toLowerCase(eventName), e => {
        this.run(eventName, UIEventStateContext.from(new UIEventState(e)));
      });
    });
    this._pointerControl.listen();
    this._keyboardControl.listen();
  }
}
