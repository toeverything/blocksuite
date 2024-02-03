import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';

const editLinkStyle = css`
  .affine-link-edit-popover {
    box-sizing: border-box;
    width: 404px;
    height: 112px;
    padding: 12px;
    box-shadow: var(--affine-shadow-2);
    background: var(--affine-background-overlay-panel-color);
    border-radius: 8px;
    display: grid;
    grid-template-columns: auto auto auto;
    grid-template-rows: repeat(2, 1fr);
    gap: 12px;
    grid-template-areas:
      'text-area .'
      'link-area btn';
    justify-items: center;
    align-items: center;
    /* breaks 'basic link' test in chromium */
    /* user-select: none; */
  }

  .affine-link-edit-popover label {
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    font-size: var(--affine-font-sm);
    box-sizing: border-box;
    padding: 6px 0 6px 12px;
    color: var(--affine-icon-color);
  }

  .affine-link-edit-popover input {
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    font-size: var(--affine-font-base);
    box-sizing: border-box;
    padding: 6px 12px 6px 0;
    width: 260px;
    height: 34px;
    color: inherit;
    border: none;
    background: transparent;
  }
  .affine-link-edit-popover input::placeholder {
    color: var(--affine-placeholder-color);
  }
  input:focus {
    outline: none;
  }
  .affine-link-edit-popover input:focus ~ label,
  .affine-link-edit-popover input:active ~ label {
    color: var(--affine-primary-color);
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
    user-select: none;
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
  .affine-edit-link-area {
    border: 1px solid var(--affine-border-color);
    outline: none;
    border-radius: 10px;
    background: transparent;
  }
  .affine-edit-link-area:focus-within {
    border: 1px solid var(--affine-primary-color);
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
    user-select: none;
  }
`;

export const linkPopupStyle = css`
  :host {
    box-sizing: border-box;
  }

  .mock-selection {
    position: absolute;
    background-color: rgba(35, 131, 226, 0.28);
  }

  .affine-link-popover-container {
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    font-size: var(--affine-font-base);
    font-style: normal;
    line-height: 24px;
    color: var(--affine-text-primary-color);
    z-index: var(--affine-z-index-popover);
    animation: affine-popover-fade-in 0.2s ease;
    position: absolute;
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

  .affine-link-popover-overlay-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: var(--affine-z-index-popover);
  }

  .affine-link-popover {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    height: 40px;

    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
    border-radius: 8px;
  }

  .affine-link-preview {
    display: flex;
    width: 180px;
    padding: var(--1, 0px);
    align-items: flex-start;
    gap: 10px;
    border-radius: var(--1, 0px);
    opacity: var(--add, 1);
    user-select: none;
    cursor: pointer;
  }

  .affine-link-popover-input {
    background: transparent;
    border: none;
  }
  .affine-link-popover-input::placeholder {
    color: var(--affine-placeholder-color);
  }
  .affine-link-popover-input:focus {
    border: none;
  }

  .affine-link-preview > span {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;

    color: var(--affine-link-color);
    font-feature-settings:
      'clig' off,
      'liga' off;
    font-family: var(--affine-font-family);
    font-size: 15px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    text-overflow: ellipsis;
    overflow: hidden;
    opacity: var(--add, 1);
  }

  .affine-link-popover-dividing-line {
    margin: 0 6px;
    width: 1px;
    height: 20px;
    background-color: var(--affine-border-color);
  }

  .affine-link-popover-view-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 2px;
    border-radius: 6px;
    background: var(--affine-hover-color);
  }
  .affine-link-popover-view-selector > icon-button {
    padding: 0px;
  }
  .affine-link-popover-view-selector .current-view {
    background: var(--affine-background-overlay-panel-color);
  }

  ${editLinkStyle}
`;
