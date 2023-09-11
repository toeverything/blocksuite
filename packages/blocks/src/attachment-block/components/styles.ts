import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';

import { tooltipStyle } from '../../components/tooltip/tooltip.js';

export const renameStyles = css`
  .affine-attachment-rename-container {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    width: 340px;

    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    color: var(--affine-text-primary-color);
    border-radius: 8px;
    padding: 12px;
    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
    z-index: var(--affine-z-index-popover);
  }

  .affine-attachment-rename-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 4px 10px;
    gap: 8px;

    border-radius: 8px;
    border: var(--affine-border-color) solid 1px;
  }

  .affine-attachment-rename-input-wrapper input {
    width: 100%;
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
  }

  .affine-attachment-rename-extension {
    font-size: var(--affine-font-xs);
    color: var(--affine-text-secondary-color);
  }

  .affine-attachment-rename-overlay-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: var(--affine-z-index-popover);
  }
`;

export const moreMenuStyles = css`
  .affine-attachment-options-more {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--affine-text-primary-color);

    border-radius: 8px;
    padding: 8px;
    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
  }

  .affine-attachment-options-more icon-button {
    display: flex;
    align-items: center;
    padding: 8px;
    gap: 8px;
  }
  .affine-attachment-options-more icon-button[hidden] {
    display: none;
  }

  .affine-attachment-options-more icon-button:hover.danger {
    background: var(--affine-background-error-color);
    color: var(--affine-error-color);
  }
  .affine-attachment-options-more icon-button:hover.danger > svg {
    color: var(--affine-error-color);
  }
`;

export const styles = css`
  .affine-attachment-options {
    display: flex;
    align-items: center;
    padding: 8px;
    gap: 8px;
    border-radius: 8px;
    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
    z-index: var(--affine-z-index-popover);
  }

  /* hover guardian */
  .affine-attachment-options::before {
    position: absolute;
    content: ' ';
    left: 0;
    top: 0;
    transform: translateY(-100%);
    width: 100%;
    height: 4px;
  }
  .affine-attachment-options::after {
    position: absolute;
    content: ' ';
    left: 0;
    bottom: 0;
    transform: translateY(100%);
    width: 100%;
    height: 4px;
  }

  .affine-attachment-options .divider {
    width: 1px;
    margin: 0 1.5px;
    height: 24px;
    background-color: var(--affine-border-color);
  }

  .affine-attachment-options > div[hidden],
  icon-button[hidden] {
    display: none;
  }

  ${tooltipStyle}
`;
