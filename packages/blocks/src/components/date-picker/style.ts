import { css } from 'lit';

export const datePickerStyle = css`
  :host {
    display: block;
  }

  .date-picker {
    background: var(--affine-background-overlay-panel-color);
    border-radius: 12px;
    box-sizing: border-box;
    box-shadow: var(--affine-menu-shadow);
    display: flex;
    flex-direction: column;
    gap: var(--gap-v);
    font-family: var(--affine-font-family);
  }

  /* small action */
  .date-picker-small-action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: var(--affine-icon-color);
    border-radius: 4px;
  }
  .date-picker-small-action:hover {
    color: var(--affine-icon-hover-color);
    background: var(--affine-icon-hover-background);
  }
  .date-picker-small-action.left > svg {
    transform: rotate(0deg);
  }
  .date-picker-small-action.right > svg {
    transform: rotate(180deg);
  }
  .date-picker-small-action.down > svg {
    transform: rotate(-90deg);
  }

  /* action-header */
  .date-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .date-picker-header__date {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--affine-text-primary-color);
    font-weight: 600;
    padding: 4px 6px;
    border-radius: 8px;
    font-size: 14px;
    line-height: 22px;
  }
  .date-picker-header__action {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--affine-icon-color);
  }
  .date-picker-header__action .action-label {
    font-size: 10px;
    padding: 2px;
    border-radius: 4px;
  }

  /** days header */
  .days-header {
    display: flex;
    gap: var(--gap-h);
  }
  .days-header > div {
    color: var(--affine-text-secondary-color);
    font-weight: 500;
    font-size: 12px;
    cursor: default;
  }

  /** week */
  .date-picker-weeks {
    display: flex;
    flex-direction: column;
    gap: var(--gap-v);
  }
  .date-picker-week {
    display: flex;
    gap: var(--gap-h);
  }

  /** cell */
  .date-cell {
    width: var(--cell-size);
    height: var(--cell-size);
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    border-radius: 8px;
  }
  .date-cell[data-date] {
    font-weight: 400;
    font-size: 14px;
  }
  .date-cell.date-cell--not-curr-month {
    opacity: 0.1;
  }
  .date-cell.date-cell--today {
    color: var(--affine-primary-color);
    font-weight: 600;
  }
  .date-cell.date-cell--selected {
    background: var(--affine-primary-color);
    color: var(--affine-pure-white);
    font-weight: 500;
  }

  /** interactive  */
  .interactive {
    cursor: pointer;
    transition:
      background 0.23s ease,
      color 0.23s ease;
    user-select: none;
    position: relative;
    border: none;
    background-color: unset;
    font-family: var(--affine-font-family);
  }
  /* --hover */
  .interactive::after,
  .interactive::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.23s ease;
  }
  .interactive::after {
    background: currentColor;
  }
  .interactive:hover::after {
    opacity: 0.1;
    /* background: var(--affine-hover-color); */
  }
  /* --focus */
  .interactive::before {
    transition: none;
    box-shadow: 0 0 0 3px var(--affine-primary-color);
  }
  /* .interactive:active, */
  .interactive:focus-visible {
    outline: none;
    outline: 1px solid var(--affine-primary-color);
  }
  /* .interactive:active::before, */
  .interactive:focus-visible::before {
    opacity: 0.5;
  }
`;
