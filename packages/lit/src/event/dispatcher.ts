import { DisposableGroup } from '@blocksuite/global/utils';

import type { UIEventHandler } from './base.js';
import { UIEventStateContext } from './base.js';
import { UIEventState } from './base.js';
import { PointerControl } from './pointer.js';

const eventName = [
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

  'keydown',
  'paste',
  'copy',
  'blur',
  'focus',
  'drop',
  'selectionchange',
  'contextmenu',
] as const;

export type EventName = (typeof eventName)[number];

export class UIEventDispatcher {
  disposables = new DisposableGroup();

  private _handlersMap = Object.fromEntries(
    eventName.map((name): [EventName, Array<UIEventHandler>] => [name, []])
  ) as Record<EventName, Array<UIEventHandler>>;

  private _pointerControl: PointerControl;

  constructor(public root: HTMLElement) {
    this._pointerControl = new PointerControl(this);
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
    const handlers = this._handlersMap[name];
    if (!handlers) return;

    for (const handler of handlers) {
      const result = handler(context);
      if (result) {
        return;
      }
    }
  }

  add(name: EventName, handler: UIEventHandler) {
    this._handlersMap[name].unshift(handler);
    return () => {
      if (this._handlersMap[name].includes(handler)) {
        this._handlersMap[name] = this._handlersMap[name].filter(
          f => f !== handler
        );
      }
    };
  }

  private _bindEvents() {
    const byPassEvent = [
      'keydown',
      'paste',
      'copy',
      'blur',
      'focus',
      'drop',
      'selectionchange',
      'contextmenu',
    ] as const satisfies readonly EventName[];
    byPassEvent.forEach(eventName => {
      this.disposables.addFromEvent(this.root, eventName, e => {
        this.run(eventName, UIEventStateContext.from(new UIEventState(e)));
      });
    });

    this._pointerControl.listen();
  }
}
