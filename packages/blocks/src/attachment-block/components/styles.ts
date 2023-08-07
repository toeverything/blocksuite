import { css } from 'lit';

import { tooltipStyle } from '../../components/tooltip/tooltip.js';

const renameStyles = css`
  .attachment-rename-container {
    position: absolute;
    right: 0;
    top: 0;

    display: flex;
    align-items: center;
    gap: 12px;
    width: 340px;

    font-family: var(--affine-font-family);
    color: var(--affine-text-primary-color);
    border-radius: 8px;
    padding: 12px;
    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
  }

  .attachment-rename-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 4px 10px;
    gap: 8px;

    border-radius: 8px;
    border: var(--affine-border-color) solid 1px;
  }

  .attachment-rename-input-wrapper input {
    width: 100%;
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
  }

  .attachment-rename-extension {
    font-size: var(--affine-font-xs);
    color: var(--affine-text-secondary-color);
  }
`;

const moreMenuStyles = css`
  .attachment-options-more {
    position: absolute;
    right: 0;
    top: 0;
    transform: translateY(calc(-100% - 4px));

    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--affine-text-primary-color);

    border-radius: 8px;
    padding: 8px;
    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
  }

  .attachment-options-more icon-button {
    display: flex;
    align-items: center;
    padding: 8px;
    gap: 8px;
  }

  .attachment-options-more icon-button:hover.danger {
    background: var(--affine-background-error-color);
    fill: var(--affine-error-color);
    color: var(--affine-error-color);
  }
`;

export const styles = css`
  .affine-attachment-options {
    position: fixed;
    left: 0;
    top: 0;

    display: flex;
    align-items: center;
    padding: 8px;
    gap: 8px;
    border-radius: 8px;
    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
  }

  .affine-attachment-options .divider {
    width: 1px;
    height: 24px;
    background-color: var(--affine-border-color);
  }

  .affine-attachment-options > div[hidden] {
    display: none;
  }

  ${tooltipStyle}
  ${renameStyles}
  ${moreMenuStyles}
`;
