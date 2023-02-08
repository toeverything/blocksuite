import { css } from 'lit';

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
    position: fixed;
    z-index: var(--affine-z-index-popover);
  }

  .slash-menu {
    font-size: var(--affine-font-sm);
    position: absolute;
    padding: 8px 4px;
    display: flex;

    background: var(--affine-popover-background);
    box-shadow: var(--affine-popover-shadow);
    border-radius: 0px 10px 10px 10px;
    z-index: var(--affine-z-index-popover);
  }

  .slash-category {
    overflow: hidden;
    box-sizing: border-box;
    width: 150px;
    max-width: 150px;
    transition: max-width 0.2s ease-in-out;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 12px 16px;
  }

  .slash-category-name {
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-sm);
    color: #8e8d91;
    white-space: nowrap;
    cursor: pointer;
    padding: 5px 8px;
    width: 100%;
  }

  .slash-item-container {
    overflow-y: auto;
    width: 200px;
  }
`;
