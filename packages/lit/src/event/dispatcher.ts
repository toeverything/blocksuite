import { DisposableGroup } from '@blocksuite/global/utils';

import type { UIEventHandler } from './base.js';
import { UIEventStateContext } from './base.js';
import { UIEventState } from './base.js';
import { PointerControl } from './pointer.js';
import { toLowerCase } from './utils.js';

const bypassEventNames = [
  'beforeInput',
  'compositionStart',
  'compositionUpdate',
  'compositionEnd',

  'keyDown',
  'keyUp',

  'paste',
  'copy',
  'blur',
  'focus',
  'drop',
  'selectionChange',
  'contextMenu',
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

  ...bypassEventNames,
] as const;

export type EventName = (typeof eventNames)[number];

export class UIEventDispatcher {
  disposables = new DisposableGroup();

  private _handlersMap = Object.fromEntries(
    eventNames.map((name): [EventName, Array<UIEventHandler>] => [name, []])
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
    bypassEventNames.forEach(eventName => {
      this.disposables.addFromEvent(this.root, toLowerCase(eventName), e => {
        this.run(eventName, UIEventStateContext.from(new UIEventState(e)));
      });
    });

    this._pointerControl.listen();
  }
}
