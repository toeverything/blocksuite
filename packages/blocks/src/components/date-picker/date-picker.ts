import { WithDisposable } from '@blocksuite/lit';
import { isSameDay, isSameMonth, isToday } from 'date-fns';
import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { arrowLeftIcon } from './icons.js';
import { datePickerStyle } from './style.js';
import { getMonthMatrix, toDate } from './utils.js';

const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export interface DateCell {
  date: Date;
  label: string;
  isToday: boolean;
  notCurrentMonth: boolean;
  selected?: boolean;
  tabIndex?: number;
}

/**
 * Date picker
 */
@customElement('date-picker')
export class DatePicker extends WithDisposable(LitElement) {
  static override styles = datePickerStyle;

  /** Checked date timestamp */
  @property({ type: Number })
  value?: number;

  @property({ attribute: false })
  onChange?: (value: Date) => void;

  /** card padding in px */
  @property({ type: Number })
  padding = 20;
  /** cell size in px */
  @property({ type: Number })
  size = 28;
  /** horizontal gap between cells in px */
  @property({ type: Number })
  gapH = 10;
  /** vertical gap between cells in px */
  @property({ type: Number })
  gapV = 8;

  /** current active month */
  private _cursor = new Date();
  /** web-accessibility for month select */
  @property({ attribute: false })
  private _monthCursor = 0;
  /** date matrix */
  @property({ attribute: false })
  private _matrix: DateCell[][] = [];
  @property({ attribute: false })
  private _showMonthSelect = false;

  get year() {
    return this._cursor.getFullYear();
  }
  get month() {
    return this._cursor.getMonth();
  }
  get date() {
    return this._cursor.getDate();
  }
  get day() {
    return this._cursor.getDay();
  }
  get yearLabel() {
    return this.year;
  }
  get monthLabel() {
    return months[this.month];
  }
  get dayLabel() {
    return days[this.day];
  }

  get cardWidth() {
    const colNum = 7;
    return this.size * colNum + this.padding * 2 + this.gapH * (colNum - 1);
  }
  get cardHeight() {
    const rowNum = 7;
    return this.size * rowNum + this.padding * 2 + this.gapV * (rowNum - 1) + 2;
  }

  get _cardStyle() {
    return {
      '--cell-size': `${this.size}px`,
      '--gap-h': `${this.gapH}px`,
      '--gap-v': `${this.gapV}px`,
      'min-width': `${this.cardWidth}px`,
      'min-height': `${this.cardHeight}px`,
      padding: `${this.padding}px`,
    };
  }

  /**
   * Focus on date-cell
   */
  public focusDateCell() {
    const lastEl = this.shadowRoot?.querySelector(
      'button.date-cell[tabindex="0"]'
    ) as HTMLElement;
    lastEl?.focus();
  }

  /**
   * check if date-cell is focused
   * @returns
   */
  public isDateCellFocused() {
    const focused = this.shadowRoot?.activeElement as HTMLElement;
    return focused?.classList.contains('date-cell');
  }

  public focusMonthCell() {
    const lastEl = this.shadowRoot?.querySelector(
      'button.date-picker-month[tabindex="0"]'
    ) as HTMLElement;
    lastEl?.focus();
  }

  public isMonthCellFocused() {
    const focused = this.shadowRoot?.activeElement as HTMLElement;
    return focused?.classList.contains('date-picker-month');
  }

  public openMonthSelector() {
    this._showMonthSelect = true;
    this._monthCursor = this.month;
  }
  public closeMonthSelector() {
    this._showMonthSelect = false;
  }
  public toggleMonthSelector() {
    if (this._showMonthSelect) this.closeMonthSelector();
    else this.openMonthSelector();
  }

  private _moveMonth(offset: number) {
    this._cursor.setMonth(this._cursor.getMonth() + offset);
    this._getMatrix();
  }
  private _moveYear(offset: number) {
    this._cursor.setFullYear(this._cursor.getFullYear() + offset);
    this._getMatrix();
  }

  private _getMatrix() {
    this._matrix = getMonthMatrix(this._cursor).map(row => {
      return row.map(date => {
        const tabIndex = isSameDay(date, this._cursor) ? 0 : -1;
        return {
          date,
          label: date.getDate().toString(),
          isToday: isToday(date),
          notCurrentMonth: !isSameMonth(date, this._cursor),
          selected: this.value ? isSameDay(date, toDate(this.value)) : false,
          tabIndex,
        } satisfies DateCell;
      });
    });
  }

  override firstUpdated(): void {
    this._disposables.addFromEvent(
      this,
      'keydown',
      e => {
        e.stopPropagation();
        const directions = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
        if (directions.includes(e.key) && this.isDateCellFocused()) {
          e.preventDefault();

          if (e.key === 'ArrowLeft') {
            this._cursor.setDate(this._cursor.getDate() - 1);
          } else if (e.key === 'ArrowRight') {
            this._cursor.setDate(this._cursor.getDate() + 1);
          } else if (e.key === 'ArrowUp') {
            this._cursor.setDate(this._cursor.getDate() - 7);
          } else if (e.key === 'ArrowDown') {
            this._cursor.setDate(this._cursor.getDate() + 7);
          }
          this._getMatrix();
          setTimeout(this.focusDateCell.bind(this));
        }

        if (directions.includes(e.key) && this.isMonthCellFocused()) {
          e.preventDefault();
          if (e.key === 'ArrowLeft') {
            this._monthCursor = (this._monthCursor - 1 + 12) % 12;
          } else if (e.key === 'ArrowRight') {
            this._monthCursor = (this._monthCursor + 1) % 12;
          } else if (e.key === 'ArrowUp') {
            this._monthCursor = (this._monthCursor - 3 + 12) % 12;
          } else if (e.key === 'ArrowDown') {
            this._monthCursor = (this._monthCursor + 3) % 12;
          }
          setTimeout(this.focusMonthCell.bind(this));
        }

        if (e.key === 'Tab') {
          setTimeout(() => {
            const focused = this.shadowRoot?.activeElement as HTMLElement;
            const firstEl = this.shadowRoot?.querySelector('button');

            // check if focus the last element, then focus the first element
            if (!e.shiftKey && !focused) firstEl?.focus();
            // check if focused element is inside current date-picker
            if (e.shiftKey && !this.shadowRoot?.contains(focused))
              this.focusDateCell();
          });
        }
      },
      true
    );
  }

  override updated(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('value')) {
      this._getMatrix();
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.value) this._cursor = toDate(this.value);
    this._getMatrix();
  }

  /** Actions */
  private _actionHeaderRenderer() {
    return html`<div class="date-picker-header">
      <button
        class="date-picker-header__date interactive"
        @click=${() => this.toggleMonthSelector()}
      >
        <div>
          ${this._showMonthSelect ? nothing : this.monthLabel} ${this.yearLabel}
        </div>
        ${this._showMonthSelect
          ? nothing
          : html`<div class="date-picker-small-action down">
              ${arrowLeftIcon}
            </div>`}
      </button>
      <div class="date-picker-header__action">
        <button
          aria-label="previous month"
          class="date-picker-small-action interactive left"
          @click=${() =>
            this._showMonthSelect ? this._moveYear(-1) : this._moveMonth(-1)}
        >
          ${arrowLeftIcon}
        </button>
        <button
          tabindex=${this._showMonthSelect ? -1 : 0}
          aria-label="today"
          class="action-label interactive today"
          @click=${() => {
            this._cursor = new Date();
            this._getMatrix();
          }}
        >
          <span>TODAY</span>
        </button>
        <button
          aria-label="next month"
          class="date-picker-small-action interactive right"
          @click=${() =>
            this._showMonthSelect ? this._moveYear(1) : this._moveMonth(1)}
        >
          ${arrowLeftIcon}
        </button>
      </div>
    </div>`;
  }

  /** Week header */
  private _dayHeaderRenderer() {
    return html`<div class="days-header">
      ${days.map(day => html`<div class="date-cell">${day}</div>`)}
    </div>`;
  }

  /** Cell */
  private _cellRenderer(cell: DateCell) {
    const classes = classMap({
      interactive: true,
      'date-cell': true,
      'date-cell--today': cell.isToday,
      'date-cell--not-curr-month': cell.notCurrentMonth,
      'date-cell--selected': !!cell.selected,
    });
    const dateRaw = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}(${cell.date.getDay()})`;
    return html`<button
      tabindex=${cell.tabIndex ?? -1}
      aria-label=${dateRaw}
      data-date=${dateRaw}
      class=${classes}
      @click=${() => {
        this.value = cell.date.getTime();
        if (cell.notCurrentMonth) this._cursor = cell.date;
        this.onChange?.(cell.date);
        this._getMatrix();
      }}
    >
      ${cell.label}
    </button>`;
  }

  private _weekRenderer(week: DateCell[]) {
    return html`<div class="date-picker-week">
      ${week.map(cell => this._cellRenderer(cell))}
    </div>`;
  }

  private _monthSelectRenderer() {
    return html`<div class="date-picker-month">
      ${months.map((month, index) => {
        const isActive = index === this._cursor.getMonth();
        const classes = classMap({
          'date-picker-month': true,
          interactive: true,
          active: isActive,
        });
        return html`<button
          tabindex=${this._monthCursor === index ? 0 : -1}
          aria-label=${month}
          class=${classes}
          @click=${() => {
            this._cursor.setMonth(index);
            this._showMonthSelect = false;
            this._getMatrix();
          }}
        >
          ${month}
        </button>`;
      })}
    </div>`;
  }

  override render() {
    const classes = classMap({
      'date-picker': true,
      'date-picker--show-month': this._showMonthSelect,
    });
    return html`<div class=${classes} style=${styleMap(this._cardStyle)}>
      ${this._actionHeaderRenderer()}
      ${this._showMonthSelect
        ? this._monthSelectRenderer()
        : html` ${this._dayHeaderRenderer()}
            <div class="date-picker-weeks">
              ${this._matrix.map(week => this._weekRenderer(week))}
            </div>`}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'date-picker': DatePicker;
  }
}
