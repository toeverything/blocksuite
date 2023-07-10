import { css } from 'lit';

import { scrollbarStyle } from '../utils.js';

export const styles = css`
  .overlay-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: var(--affine-z-index-popover);
  }

  .slash-menu-container {
    z-index: var(--affine-z-index-popover);
    user-select: none;
  }

  .slash-menu {
    position: fixed;
    left: 0;
    top: 0;
    box-sizing: border-box;
    font-size: var(--affine-font-base);
    padding: 12px 0;
    display: flex;

    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
    border-radius: 12px;
    z-index: var(--affine-z-index-popover);
    /* transition: max-height 0.2s ease-in-out; */
  }

  .slash-category {
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
    width: 150px;
    max-width: 150px;
    display: flex;
    flex-direction: column;
    color: var(--affine-text-secondary-color);
    gap: 5px;
    margin-bottom: 20px;
    /* transition: max-width 0.2s ease-in-out; */
  }
  .slash-category::before {
    content: '';
    position: absolute;
    top: 10px;
    right: 0;
    height: 100%;
    width: 1px;
    background-color: var(--affine-border-color);
  }

  .slash-category-hide {
    max-width: 0;
    padding: 0;
    margin: 0;
    height: 0;
  }

  .slash-category-name {
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-sm);
    white-space: nowrap;
    cursor: pointer;
    padding: 4px 20px;
  }

  .slash-active-category {
    position: relative;
    box-sizing: border-box;
    color: var(--affine-primary-color);
  }

  .slash-active-category::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 12px;
    background: linear-gradient(
      180deg,
      var(--affine-text-emphasis-color) 0%,
      var(--affine-palette-purple) 100%
    );
    border-radius: 1px;
  }

  .slash-item-container {
    box-sizing: border-box;
    overflow-y: auto;
    padding: 0 8px;
    width: 200px;
  }

  ${scrollbarStyle}

  .slash-item-divider {
    border-top: 1px dashed var(--affine-border-color);
    margin: 8px 0;
  }
`;
