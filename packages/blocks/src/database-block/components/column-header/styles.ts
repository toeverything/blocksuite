import { css } from 'lit';

import {
  DEFAULT_ADD_BUTTON_WIDTH,
  DEFAULT_COLUMN_MIN_WIDTH,
} from '../../consts.js';

export const styles = css`
  .affine-database-column-header {
    position: relative;
    display: flex;
    flex-direction: row;
    height: 40px;
    border-bottom: 1px solid var(--affine-border-color);
  }
  .affine-database-column-header > .affine-database-column:first-child {
    background: var(--affine-hover-color);
  }

  .affine-database-column {
    position: relative;
    z-index: 1;
    transform: translateX(0);
    background: var(--affine-white);
  }
  .database-cell {
    min-width: ${DEFAULT_COLUMN_MIN_WIDTH}px;
  }
  .database-cell.add-column-button {
    width: auto;
    min-width: ${DEFAULT_ADD_BUTTON_WIDTH}px;
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .affine-database-column-content {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 8px;
    border-right: 1px solid var(--affine-border-color);
  }
  .affine-database-column:last-child .affine-database-column-content {
    border-right: none;
  }
  .affine-database-column-drag-handle {
    position: absolute;
    z-index: 1;
    top: 0;
    left: -8px;
    width: 16px;
    height: 100%;
    cursor: col-resize;
  }
  .affine-database-column-drag-handle::before {
    content: ' ';
    display: none;
    position: absolute;
    width: 2px;
    height: 100%;
    left: 7px;
    background: var(--affine-text-emphasis-color);
    box-shadow: 0px 0px 8px rgba(84, 56, 255, 0.35);
  }
  .affine-database-column-drag-handle:hover::before,
  .affine-database-column-drag-handle.dragging::before {
    display: block;
  }
  .affine-database-column-content:hover {
    background: linear-gradient(
        0deg,
        var(--affine-hover-background),
        var(--affine-hover-background)
      ),
      var(--affine-white);
  }
  .affine-database-column-content.edit {
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.08)),
      var(--affine-white);
  }
  .affine-database-column-text {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--affine-secondary-text-color);
    font-size: 14px;
    font-weight: 600;
  }
  .affine-database-column-text svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
  }
  .affine-database-column-text.select svg {
    fill: none;
  }
  .affine-database-column-text-input {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .affine-database-column-input {
    width: 100%;
    height: 24px;
    padding: 0;
    border: none;
    color: inherit;
    font-weight: 600;
    font-size: 14px;
    font-family: var(--affine-font-family);
    background: transparent;
  }
  .affine-database-column-input:focus {
    outline: none;
  }
  .affine-database-column-move {
    display: flex;
    align-items: center;
  }
  .affine-database-column-move svg {
    width: 10px;
    height: 14px;
    color: var(--affine-black-10);
    cursor: move;
    opacity: 0;
  }
  .affine-database-column-content:hover svg {
    opacity: 1;
  }

  .affine-database-add-column-button {
    visibility: hidden;
    position: fixed;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 38px;
    cursor: pointer;
  }
  .header-add-column-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .affine-database-column-move-preview {
    position: fixed;
    z-index: 100;
    width: 100px;
    height: 100px;
    background: var(--affine-text-emphasis-color);
  }
`;
