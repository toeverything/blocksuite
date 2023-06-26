import type { BaseBlockModel } from '@blocksuite/store';
import type { Page } from '@blocksuite/store';
import type { TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';

import { WithDisposable } from '../width-disposable.js';
import type { BlockSuiteRoot } from './lit-root.js';
import { ShadowlessElement } from './shadowless-element.js';

export type FocusContext = (
  | {
      multi?: false;
    }
  | {
      /**
       * Please note that this parameter only suggests that the operation is a multi-select operation,
       * and does not mean that multiple blocks will be selected every time.
       *
       * For example, select all blocks by pressing `Ctrl+A` or clicking the drag handler.
       */
      multi: true;
      /**
       * Please check the length of the array before using it.
       */
      blocks: BlockElement<BaseBlockModel>;
    }
) &
  (
    | {
        type: 'pointer';
        event: PointerEvent;
      }
    | {
        type: 'keyboard';
        event: KeyboardEvent;
      }
    | {
        // Please update the type name
        // for example, 'api' or 'others'
        type: 'UNKNOWN';
        // TODO: add more information
      }
  );

export class BlockElement<Model extends BaseBlockModel> extends WithDisposable(
  ShadowlessElement
) {
  @property({ attribute: false })
  root!: BlockSuiteRoot;

  @property({ attribute: false })
  model!: Model;

  @property({ attribute: false })
  content!: TemplateResult;

  @property({ attribute: false })
  widgets!: TemplateResult;

  @property({ attribute: false })
  page!: Page;

  /**
   * This is different from `element.focus()`
   */
  @property({ attribute: false })
  focused = false;

  focusBlock(focusContext: FocusContext): void | boolean {
    this.focused = true;
    // Return false to prevent default focus behavior
  }

  blurBlock(focusContext: FocusContext): boolean {
    this.focused = false;
    // Return false to prevent default focus behavior
    return true;
  }

  override render(): unknown {
    return null;
  }
}
