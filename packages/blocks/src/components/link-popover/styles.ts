import { css } from 'lit';

import { tooltipStyle } from '../tooltip/tooltip.js';

export const editLinkStyle = css`
  .affine-link-edit-popover {
    box-sizing: border-box;
    width: 404px;
    height: 112px;
    padding: 12px;
    box-shadow: var(--affine-popover-shadow);
    background: var(--affine-popover-background);
    border-radius: 10px;
    display: grid;
    grid-template-columns: auto auto auto;
    grid-template-rows: repeat(2, 1fr);
    gap: 12px;
    grid-template-areas:
      'text-area .'
      'link-area btn';
    justify-items: center;
    align-items: center;
  }

  .affine-edit-text-area {
    grid-area: text-area;
    width: 338px;
    display: grid;
    gap: 6px;
    grid-template-columns: auto auto auto;
    grid-template-rows: repeat(1, 1fr);
    grid-template-areas: 'text span text-input';
    justify-items: center;
    align-items: center;
  }

  .affine-edit-link-area {
    grid-area: link-area;
    width: 338px;
    display: grid;
    gap: 6px;
    grid-template-columns: auto auto auto;
    grid-template-rows: repeat(1, 1fr);
    grid-template-areas: 'link span link-input';
    justify-items: center;
    align-items: center;
  }

  .affine-link-popover-dividing-line {
    grid-area: span;
  }
  .affine-edit-text-text {
    grid-area: text;
  }

  .affine-edit-text-input {
    grid-area: text-input;
  }

  .affine-edit-link-text {
    grid-area: link;
  }

  .affine-edit-link-input {
    grid-area: link-input;
  }

  .affine-confirm-button {
    grid-area: btn;
    fill: var(--affine-primary-color);
  }
  .affine-confirm-button[disabled],
  .affine-confirm-button:disabled {
    fill: var(--affine-icon-color);
  }
`;

export const linkPopoverStyle = css`
  .popover-container {
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-base);
    font-style: normal;
    line-height: 24px;
    color: var(--affine-popover-color);
    z-index: var(--affine-z-index-popover);
    animation: affine-popover-fade-in 0.2s ease;
  }

  @keyframes affine-popover-fade-in {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .overlay-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: var(--affine-z-index-popover);
  }
  .affine-edit-text-area {
    border: 1px solid var(--affine-border-color);
    outline: none;
    border-radius: 10px;
    background: transparent;
  }
  .affine-edit-text-area:focus-within {
    border: 1px solid var(--affine-primary-color);
  }
  .affine-edit-link-area {
    border: 1px solid var(--affine-border-color);
    outline: none;
    border-radius: 10px;
    background: transparent;
  }
  .affine-edit-link-area:focus-within {
    border: 1px solid var(--affine-primary-color);
  }

  label {
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-sm);
    box-sizing: border-box;
    padding: 6px 0 6px 12px;
    color: var(--affine-icon-color);
  }

  input {
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-base);
    box-sizing: border-box;
    padding: 6px 12px 6px 0;
    width: 260px;
    height: 34px;
    color: inherit;
    border: none;
    background: transparent;
  }
  input::placeholder {
    color: var(--affine-placeholder-color);
  }
  input:focus {
    outline: none;
  }
  input:focus ~ label,
  input:active ~ label {
    color: var(--affine-primary-color);
  }

  .affine-link-popover {
    display: flex;
    align-items: center;
    height: 34px;
    padding: 0 12px;

    background: var(--affine-popover-background);
    box-shadow: var(--affine-popover-shadow);
    border-radius: 0 10px 10px 10px;
  }

  .affine-link-popover-input {
    border: none;
  }
  .affine-link-popover-input::placeholder {
    color: var(--affine-placeholder-color);
  }
  .affine-link-popover-input:focus {
    border: none;
  }

  .affine-link-preview {
    width: 260px;
    height: 28px;
    display: flex;
    align-items: center;
    user-select: none;
    cursor: pointer;
    white-space: nowrap;
  }

  .affine-link-popover-dividing-line {
    margin: 0 6px;
    width: 1px;
    height: 20px;
    background-color: var(--affine-border-color);
  }

  ${editLinkStyle}
  ${tooltipStyle}
`;
