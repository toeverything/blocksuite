import {
  popMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { DatePicker } from '@blocksuite/affine-components/date-picker';
import { createLitPortal } from '@blocksuite/affine-components/portal';
import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { IS_MOBILE } from '@blocksuite/global/env';
import { flip, offset } from '@floating-ui/dom';
import { signal } from '@preact/signals-core';
import { baseTheme } from '@toeverything/theme';
import { format } from 'date-fns/format';
import { css, html, unsafeCSS } from 'lit';

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

    this.tempValue$.value = this.value ? new Date(this.value) : undefined;

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
    if (IS_MOBILE) {
      popMenu(popupTargetFromElement(this), {
        options: {
          title: {
            text: this.property.name$.value,
          },
          onClose: () => {
            abortController.abort();
          },
          items: [
            () =>
              html`<div
                style="
padding: 12px;
background-color: ${unsafeCSSVarV2('layer/background/primary')};
border-radius: 12px;
color: ${unsafeCSSVarV2('text/secondary')};
font-size: 17px;
line-height: 22px;
height: 46px;
"
              >
                ${this.dateString}
              </div>`,
            () => {
              const datePicker = new DatePicker();
              datePicker.padding = 0;
              datePicker.value = this.tempValue$.value?.getTime() ?? Date.now();
              datePicker.onChange = (date: Date) => {
                this.tempValue$.value = date;
              };
              datePicker.onClear = () => {
                this.tempValue$.value = undefined;
              };
              datePicker.onEscape = () => {
                abortController.abort();
              };
              requestAnimationFrame(() => datePicker.focusDateCell());
              return html`<div
                style="padding: 12px;background-color: ${unsafeCSSVarV2(
                  'layer/background/primary'
                )};border-radius: 12px"
              >
                ${datePicker}
              </div>`;
            },
          ],
        },
      });
    } else {
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
          datePicker.value = this.tempValue$.value?.getTime() ?? Date.now();
          datePicker.popup = true;
          datePicker.onClear = () => {
            this.tempValue$.value = undefined;
          };
          datePicker.onChange = (date: Date) => {
            this.tempValue$.value = date;
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
    }
  };

  private updateValue = () => {
    const tempValue = this.tempValue$.value;
    const currentValue = this.value;

    if (
      (!tempValue && !currentValue) ||
      (tempValue && currentValue && tempValue.getTime() === currentValue)
    ) {
      return;
    }

    this.onChange(tempValue?.getTime());
    this.tempValue$.value = undefined;
  };

  tempValue$ = signal<Date>();

  get dateString() {
    const value = this.tempValue;
    return value ? format(value, 'yyyy/MM/dd') : '';
  }

  get tempValue() {
    return this.tempValue$.value;
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
}

export const datePropertyConfig = datePropertyModelConfig.createPropertyMeta({
  icon: createIcon('DateTimeIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(DateCell),
    edit: createFromBaseCellRenderer(DateCellEditing),
  },
});
