import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';

export const bookmarkModalStyles = css`
  .bookmark-modal {
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
  }
  .bookmark-modal-container {
    position: fixed;
    width: 100vw;
    height: 100vh;
    display: flex;
  }
  .bookmark-modal-mask {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    z-index: 1;
  }
  .bookmark-modal-wrapper {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    z-index: 2;

    width: 360px;
    height: 230px;
    background: var(--affine-background-primary-color);
    box-shadow: var(--affine-menu-shadow);
    border-radius: var(--affine-popover-radius);
    padding: 36px 40px 24px;
  }
  .bookmark-modal-close-button {
    position: absolute;
    right: 20px;
    top: 12px;
  }
  .bookmark-modal-title {
    font-size: var(--affine-font-h-6);
    font-weight: 600;
  }
  .bookmark-modal-desc {
    font-size: var(--affine-font-base);
    margin-top: 20px;
    caret-color: var(--affine-primary-color);
    margin-bottom: 15px;
  }
  .bookmark-modal-input-wrapper {
    margin-top: 20px;
    display: flex;
    align-items: center;
  }
  .bookmark-modal-input-wrapper label {
    font-size: var(--affine-font-base);
    color: var(--affine-text-secondary-color);
    margin-right: 15px;
  }
  .bookmark-modal-input {
    width: 100%;
    height: 32px;
    font-size: var(--affine-font-base);
    caret-color: var(--affine-primary-color);
    transition: border-color 0.15s;
    line-height: 22px;
    padding: 8px 12px;
    color: var(--affine-text-primary-color);
    border: 1px solid;
    border-color: var(--affine-border-color);
    background-color: var(--affine-white);
    border-radius: 10px;
    outline: medium;
  }
  .bookmark-modal-input:focus {
    border-color: var(--affine-primary-color);
  }

  .bookmark-modal-input::placeholder {
    color: var(--affine-placeholder-color);
    font-size: var(--affine-font-base);
  }

  .bookmark-modal-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 40px;
  }
  .bookmark-modal-confirm-button {
    padding: 4px 20px;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: var(--affine-font-base);
    background: var(--affine-primary-color);
    color: var(--affine-white);
    border-color: var(--affine-primary-color);
    border-radius: 8px;
    cursor: pointer;
  }
`;
