import { PathFinder } from '@blocksuite/block-std';
import type { TemplateResult } from 'lit';
import { css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { html } from 'lit/static-html.js';

import type { ParagraphBlockComponent } from '../../../../paragraph-block/index.js';
import { BaseCellRenderer } from '../base-cell.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import {
  RichTextCell,
  RichTextCellEditing,
} from '../rich-text/cell-renderer.js';
import { titleColumnTypeName, titlePureColumnConfig } from './define.js';

@customElement('affine-database-title-cell')
export class TitleCell extends BaseCellRenderer<TemplateResult> {
  static override styles = css`
    affine-database-title-cell {
      position: relative;
    }

    affine-database-title-cell .mask {
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
    }

    .affine-database-block-row-cell-content {
      display: flex;
      align-items: center;
      height: 100%;
      min-height: 44px;
      transform: translateX(0);
    }

    .affine-database-block-row-cell-content > [data-block-id] {
      width: 100%;
    }

    .affine-database-block-row-cell-content > affine-paragraph {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
    }

    .affine-database-block-row-cell-content > affine-paragraph > .text {
      width: 100%;
      margin-top: unset;
    }

    .mock-focus {
      box-shadow: 0px 0px 0px 2px rgba(30, 150, 235, 0.3);
      border: 2px solid var(--affine-primary-color) !important;
      pointer-events: none;
      box-sizing: border-box;
    }
  `;

  @state()
  realEditing = false;
  @query('affine-paragraph')
  paragraph?: ParagraphBlockComponent;

  jumpOut() {
    this.paragraph?.root.selectionManager?.clear();
    getSelection()?.removeAllRanges();
    this.querySelector('rich-text')?.vEditor?.syncVRange();
    this.selectCurrentCell(false);
  }
  protected override firstUpdated() {
    this._disposables.addFromEvent(
      this,
      'keydown',
      e => {
        const block = this.paragraph;
        if (!block) {
          return;
        }
        const selectionManager = block.root.selectionManager;
        const selection = selectionManager?.value.find(v =>
          PathFinder.equals(v.path, block.path)
        );
        if (e.key === 'Escape') {
          if (!selection) {
            return;
          }
          e.stopPropagation();
          e.preventDefault();
          this.jumpOut();
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          if (selection) {
            e.stopPropagation();
            e.preventDefault();
            this.jumpOut();
            return;
          }
        }
      },
      true
    );
    this._disposables.addFromEvent(
      this,
      'click',
      e => {
        if (this.realEditing) {
          e.stopPropagation();
        }
      },
      true
    );
    // if (this.paragraph) {
    //   this.paragraph.bindHotKey({
    //     'Escape': () => {
    //       const selected = this.paragraph?.selected;
    //       if (selected) {
    //         return true;
    //       }
    //     },
    //   }, { flavour: true });
    // }
    this._disposables.addFromEvent(
      this,
      'pointerdown',
      e => {
        if (this.realEditing) {
          e.stopPropagation();
        }
      },
      true
    );
    requestAnimationFrame(() => {
      const editor = this.querySelector('rich-text')?.vEditor;
      if (editor) {
        this._disposables.add(
          editor.slots.vRangeUpdated.on(([range]) => {
            this.realEditing = !!range;
          })
        );
      }
    });
  }

  override focusCell() {
    const block = this.querySelector('affine-paragraph');
    const selectionManager = block?.root.selectionManager;
    if (selectionManager) {
      const length =
        block?.querySelector('rich-text')?.vEditor?.yText.length ?? 0;
      const selection = selectionManager.getInstance('text', {
        from: {
          path: block.path,
          index: length,
          length: 0,
        },
        to: null,
      });
      selectionManager.set([selection]);
    }
    return false;
  }

  override blurCell() {
    return false;
  }

  override render() {
    const className = classMap({
      'mock-focus': this.realEditing,
      mask: true,
    });
    return html`
      <div class="affine-database-block-row-cell-content">${this.value}</div>
      <div class="${className}"></div>
    `;
  }
}

columnRenderer.register({
  type: titleColumnTypeName,
  cellRenderer: {
    view: createFromBaseCellRenderer(RichTextCell),
    edit: createFromBaseCellRenderer(RichTextCellEditing),
  },
});

export const titleColumnConfig = titlePureColumnConfig;
