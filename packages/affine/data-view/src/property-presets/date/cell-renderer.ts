import { DatePicker } from '@blocksuite/affine-components/date-picker';
import { createLitPortal } from '@blocksuite/affine-components/portal';
import { flip, offset } from '@floating-ui/dom';
import { baseTheme } from '@toeverything/theme';
import { format } from 'date-fns/format';
import { css, html, unsafeCSS } from 'lit';
import { state } from 'lit/decorators.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import { datePropertyModelConfig } from './define.js';

export class DateCell extends BaseCellRenderer<number> {
  static override styles = css`
    affine-database-date-cell {
      width: 100%;
    }

    .affine-database-date {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0;
      border: none;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      color: var(--affine-text-primary-color);
      font-weight: 400;
      background-color: transparent;
      font-size: var(--data-view-cell-text-size);
      line-height: var(--data-view-cell-text-line-height);
      height: var(--data-view-cell-text-line-height);
    }

    input.affine-database-date[type='date']::-webkit-calendar-picker-indicator {
      display: none;
    }
  `;

  override render() {
    const value = this.value ? format(this.value, 'yyyy/MM/dd') : '';
    if (!value) {
      return '';
    }
    return html` <div class="affine-database-date date">${value}</div>`;
  }
}

export class DateCellEditing extends BaseCellRenderer<number> {
  static override styles = css`
    affine-database-date-cell-editing {
      width: 100%;
      cursor: text;
    }

    .affine-database-date:focus {
      outline: none;
    }
  `;

  private _prevPortalAbortController: AbortController | null = null;

  private openDatePicker = () => {
    if (
      this._prevPortalAbortController &&
      !this._prevPortalAbortController.signal.aborted
    )
      return;

    this._prevPortalAbortController?.abort();
    const abortController = new AbortController();
    abortController.signal.addEventListener(
      'abort',
      () => {
        this.selectCurrentCell(false);
      },
      { once: true }
    );
    this._prevPortalAbortController = abortController;
    const root = createLitPortal({
      abortController,
      closeOnClickAway: true,
      computePosition: {
        referenceElement: this,
        placement: 'bottom',
        middleware: [offset(10), flip()],
      },
      template: () => {
        const datePicker = new DatePicker();
        datePicker.value = this.value ?? Date.now();
        datePicker.onChange = (date: Date) => {
          this.tempValue = date;
        };
        datePicker.onEscape = () => {
          abortController.abort();
        };
        requestAnimationFrame(() => datePicker.focusDateCell());
        return datePicker;
      },
    });
    // TODO: use z-index from variable,
    //       for now the slide-layout-modal's z-index is `1001`
    //       the z-index of popover should be higher than it
    // root.style.zIndex = 'var(--affine-z-index-popover)';
    root.style.zIndex = '1002';
  };

  private updateValue = () => {
    const tempValue = this.tempValue;
    if (!tempValue) {
      return;
    }

    this.onChange(tempValue.getTime());
    this.tempValue = undefined;
  };

  get dateString() {
    const value = this.tempValue ?? this.value;
    return value ? format(value, 'yyyy/MM/dd') : '';
  }

  override firstUpdated() {
    this.openDatePicker();
  }

  override onExitEditMode() {
    this.updateValue();
    this._prevPortalAbortController?.abort();
  }

  override render() {
    return html` <div
      class="affine-database-date date"
      @click="${this.openDatePicker}"
    >
      ${this.dateString}
    </div>`;
  }

  @state()
  accessor tempValue: Date | undefined = undefined;
}

export const datePropertyConfig = datePropertyModelConfig.createPropertyMeta({
  icon: createIcon('DateTimeIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(DateCell),
    edit: createFromBaseCellRenderer(DateCellEditing),
  },
});
