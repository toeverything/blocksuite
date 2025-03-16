import { isInsideEdgelessEditor } from '@blocksuite/affine-shared/utils';
import type { Constructor } from '@blocksuite/global/utils';
import type { LitElement, TemplateResult } from 'lit';

import { PeekableController } from './controller.js';
import type { PeekableClass, PeekableOptions } from './type.js';

const symbol = Symbol('peekable');

export const isPeekable = <Element extends LitElement>(e: Element): boolean => {
  return Reflect.has(e, symbol) && (e as any)[symbol]?.peekable;
};

export const peek = <Element extends LitElement>(
  e: Element,
  template?: TemplateResult
): void => {
  isPeekable(e) && (e as any)[symbol]?.peek(template);
};

/**
 * Mark a class as peekable, which means the class can be peeked by the peek view service.
 *
 * Note: This class must be syntactically below the `@customElement` decorator (it will be applied before customElement).
 */
export const Peekable =
  <T extends PeekableClass, C extends Constructor<PeekableClass>>(
    options: PeekableOptions<T> = {
      action: ['double-click', 'shift-click'],
    }
  ) =>
  (Class: C, context: ClassDecoratorContext) => {
    if (context.kind !== 'class') {
      console.error('@Peekable() can only be applied to a class');
      return;
    }

    if (options.action === undefined)
      options.action = ['double-click', 'shift-click'];

    const actions = Array.isArray(options.action)
      ? options.action
      : options.action
        ? [options.action]
        : [];

    const derivedClass = class extends Class {
      [symbol] = new PeekableController(this as unknown as T, options.enableOn);

      override connectedCallback() {
        super.connectedCallback();

        const target: HTMLElement =
          (options.selector ? this.querySelector(options.selector) : this) ||
          this;

        if (actions.includes('double-click')) {
          this.disposables.addFromEvent(target, 'dblclick', e => {
            if (this[symbol].peekable) {
              e.stopPropagation();
              this[symbol].peek().catch(console.error);
            }
          });
        }
        if (
          actions.includes('shift-click') &&
          // shift click in edgeless should be selection
          !isInsideEdgelessEditor(this.std.host)
        ) {
          this.disposables.addFromEvent(target, 'click', e => {
            if (e.shiftKey && this[symbol].peekable) {
              e.stopPropagation();
              e.stopImmediatePropagation();
              this[symbol].peek().catch(console.error);
            }
          });
        }
      }
    };
    return derivedClass as unknown as C;
  };
