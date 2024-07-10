import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';

import { PANEL_BASE } from '../../../../../styles.js';

const editLinkStyle = css`
  .affine-link-edit-popover {
    ${PANEL_BASE}
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: repeat(2, 1fr);
    grid-template-areas:
      'text-area .'
      'link-area btn';
    justify-items: center;
    align-items: center;
    width: 320px;
    gap: 8px 12px;
    padding: 12px;
    box-sizing: content-box;
  }

  .affine-link-edit-popover label {
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    font-size: var(--affine-font-sm);
    box-sizing: border-box;
    color: var(--affine-icon-color);
  }

  .affine-link-edit-popover input {
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    font-size: var(--affine-font-base);
    box-sizing: border-box;
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

  .affine-edit-area {
    width: 280px;
    padding: 4px 10px;
    display: grid;
    gap: 8px;
    grid-template-columns: 26px auto;
    grid-template-rows: repeat(1, 1fr);
    grid-template-areas: 'label input';
    user-select: none;
    box-sizing: border-box;

    font-size: var(--affine-font-xs);
    font-weight: 400;
    line-height: 20px;

    border: 1px solid var(--affine-border-color);
    outline: none;
    border-radius: 4px;
    background: transparent;
  }
  .affine-edit-area:focus-within {
    border-color: var(--affine-blue-700);
    box-shadow: var(--affine-active-shadow);
  }

  .affine-edit-area.text {
    grid-area: text-area;
  }

  .affine-edit-area.link {
    grid-area: link-area;
  }

  .affine-edit-label {
    grid-area: label;
  }

  .affine-edit-input {
    grid-area: input;
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

  .affine-link-preview {
    display: flex;
    justify-content: flex-start;
    width: 140px;
    padding: var(--1, 0px);
    border-radius: var(--1, 0px);
    opacity: var(--add, 1);
    user-select: none;
    cursor: pointer;

    color: var(--affine-link-color);
    font-feature-settings:
      'clig' off,
      'liga' off;
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-sm);
    font-style: normal;
    font-weight: 400;
    text-decoration: none;
    text-wrap: nowrap;
  }

  .affine-link-preview > span {
    display: inline-block;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;

    text-overflow: ellipsis;
    overflow: hidden;
    opacity: var(--add, 1);
  }

  .affine-link-popover.create {
    ${PANEL_BASE}
    gap: 12px;
    padding: 12px;
  }

  .affine-link-popover-input {
    min-width: 280px;
    height: 30px;
    box-sizing: border-box;
    padding: 4px 10px;
    background: var(--affine-white-10);
    border-radius: 4px;
    border-width: 1px;
    border-style: solid;
    border-color: transparent;
  }
  .affine-link-popover-input::placeholder {
    color: var(--affine-placeholder-color);
  }
  .affine-link-popover-input:focus {
    border-color: var(--affine-blue-700);
    box-shadow: var(--affine-active-shadow);
  }

  ${editLinkStyle}
`;
