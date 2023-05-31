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
    cursor: pointer;
    background: var(--affine-white);
    transform: translateX(0);
  }
  .database-cell {
    min-width: ${DEFAULT_COLUMN_MIN_WIDTH}px;
  }
  .database-cell.add-column-button {
    flex: 1;
    min-width: ${DEFAULT_ADD_BUTTON_WIDTH}px;
    min-height: 100%;
    display: flex;
    align-items: center;
  }
  .affine-database-column-content {
    display: flex;
    align-items: center;
    gap: 6px;
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
  .affine-database-column-content:hover,
  .affine-database-column-content.edit {
    background: linear-gradient(
        0deg,
        var(--affine-hover-color),
        var(--affine-hover-color)
      ),
      var(--affine-white);
  }
  .affine-database-column-content.edit .affine-database-column-text-icon {
    opacity: 1;
  }
  .affine-database-column-text {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    /* https://stackoverflow.com/a/36247448/15443637 */
    overflow: hidden;
    color: var(--affine-text-secondary-color);
    font-size: 14px;
    font-weight: 600;
  }
  .affine-database-column-type-icon {
    display: flex;
    align-items: center;
    border: 1px solid transparent;
    border-radius: 4px;
  }
  .affine-database-column-type-icon.edit {
    background: linear-gradient(
        0deg,
        var(--affine-hover-color),
        var(--affine-hover-color)
      ),
      var(--affine-white);
    border-color: var(--affine-border-color);
  }
  .affine-database-column-type-icon.edit:hover {
    background: var(--affine-white);
  }
  .affine-database-column-type-icon svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
  }
  .affine-database-column-text-content {
    flex: 1;
    display: flex;
    align-items: center;
    overflow: hidden;
  }
  .affine-database-column-content:hover .affine-database-column-text-icon {
    opacity: 1;
  }
  .affine-database-column-text-input {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .affine-database-column-text-icon {
    display: flex;
    align-items: center;
    width: 16px;
    height: 16px;
    background: var(--affine-white);
    border: 1px solid var(--affine-border-color);
    border-radius: 4px;
    opacity: 0;
  }
  .affine-database-column-text-save-icon {
    display: flex;
    align-items: center;
    width: 16px;
    height: 16px;
    border: 1px solid transparent;
    border-radius: 4px;
    fill: var(--affine-icon-color);
  }
  .affine-database-column-text-save-icon:hover {
    background: var(--affine-white);
    border-color: var(--affine-border-color);
  }
  .affine-database-column-text-icon svg {
    fill: var(--affine-icon-color);
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
    cursor: grab;
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
    width: 40px;
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
