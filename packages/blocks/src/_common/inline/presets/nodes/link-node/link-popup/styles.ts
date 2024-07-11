import { css } from 'lit';

import { INPUT_FONT_BASE, PANEL_BASE } from '../../../../../styles.js';

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
    box-sizing: border-box;
    color: var(--affine-icon-color);
    ${INPUT_FONT_BASE}
    font-weight: 400;
  }

  .affine-link-edit-popover input {
    color: inherit;
    padding: 0;
    border: none;
    background: transparent;
    ${INPUT_FONT_BASE}
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

    border: 1px solid var(--affine-border-color);
    box-sizing: border-box;

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

    color: var(--affine-text-primary-color);
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
    ${INPUT_FONT_BASE}
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
