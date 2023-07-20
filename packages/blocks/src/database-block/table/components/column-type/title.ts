import type { TemplateResult } from 'lit';
import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { DatabaseCellElement } from '../../register.js';

@customElement('affine-database-title-cell')
export class TitleCell extends DatabaseCellElement<TemplateResult> {
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
  `;

  protected override firstUpdated() {
    this._disposables.addFromEvent(
      this,
      'keydown',
      e => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          this.selectCurrentCell(false);
        }
      },
      true
    );
    setTimeout(() => {
      this.querySelector('rich-text')?.vEditor?.slots.vRangeUpdated.on(
        range => {
          this.selectCurrentCell(true);
        }
      );
    });
  }

  override focusCell() {
    this.querySelector('rich-text')?.vEditor?.focusEnd();
    return false;
  }
  override blurCell() {
    getSelection()?.removeAllRanges();
    return false;
  }

  override render() {
    return html`
      <div class="affine-database-block-row-cell-content">${this.value}</div>
      ${this.isEditing ? '' : html`<div class="mask"></div>`}
    `;
  }
}
