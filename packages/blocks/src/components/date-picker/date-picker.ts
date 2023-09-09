import { isSameDay, isToday } from 'date-fns';
import { html, LitElement, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { arrowLeftIcon } from './icons.js';
import { datePickerStyle } from './style.js';
import { getMonthMatrix, isCurrentMonth, toDate } from './utils.js';

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
}

/**
 * Date picker
 */
@customElement('date-picker')
export class DatePicker extends LitElement {
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
  /** date matrix */
  @property({ attribute: false })
  private _matrix: DateCell[][] = [];

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
    return this.size * rowNum + this.padding * 2 + this.gapV * (rowNum - 1);
  }

  get _cardStyle() {
    return {
      '--cell-size': `${this.size}px`,
      '--gap-h': `${this.gapH}px`,
      '--gap-v': `${this.gapV}px`,
      padding: `${this.padding}px`,
    };
  }

  private _moveMonth(offset: number) {
    this._cursor.setMonth(this._cursor.getMonth() + offset);
    this._getMatrix();
  }

  private _getMatrix() {
    this._matrix = getMonthMatrix(this._cursor).map(row =>
      row.map(
        date =>
          ({
            date,
            label: date.getDate().toString(),
            isToday: isToday(date),
            notCurrentMonth: !isCurrentMonth(date, this._cursor),
            selected: this.value ? isSameDay(date, toDate(this.value)) : false,
          }) satisfies DateCell
      )
    );
  }

  override updated(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('date')) {
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
      <div class="date-picker-header__date interactive">
        <div>${this.monthLabel} ${this.yearLabel}</div>
        <div class="date-picker-small-action down">${arrowLeftIcon}</div>
      </div>
      <div class="date-picker-header__action">
        <div
          class="date-picker-small-action interactive left"
          @click=${() => this._moveMonth(-1)}
        >
          ${arrowLeftIcon}
        </div>
        <div
          class="action-label interactive"
          @click=${() => {
            this._cursor = new Date();
            this._getMatrix();
          }}
        >
          TODAY
        </div>
        <div
          class="date-picker-small-action interactive right"
          @click=${() => this._moveMonth(1)}
        >
          ${arrowLeftIcon}
        </div>
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
    return html`<div
      data-date=${`${cell.date.getFullYear()}-${cell.date.getMonth()}`}
      class=${classes}
      @click=${() => {
        this.value = cell.date.getTime();
        if (cell.notCurrentMonth) this._cursor = cell.date;
        this.onChange?.(cell.date);
        this._getMatrix();
      }}
    >
      ${cell.label}
    </div>`;
  }

  private _weekRenderer(week: DateCell[]) {
    return html`<div class="date-picker-week">
      ${week.map(cell => this._cellRenderer(cell))}
    </div>`;
  }

  override render() {
    return html`<div class="date-picker" style=${styleMap(this._cardStyle)}>
      ${this._actionHeaderRenderer()} ${this._dayHeaderRenderer()}
      <div class="date-picker-weeks">
        ${this._matrix.map(week => this._weekRenderer(week))}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'date-picker': DatePicker;
  }
}
