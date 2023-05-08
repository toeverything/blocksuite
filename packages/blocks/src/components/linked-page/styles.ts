import { css } from 'lit';

export const styles = css`
  :host {
    position: absolute;
  }

  .linked-page-popover {
    position: fixed;
    left: 0;
    top: 0;
    box-sizing: border-box;
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-base);
    padding: 12px 8px;
    display: flex;
    flex-direction: column;

    background: var(--affine-white);
    box-shadow: var(--affine-menu-shadow);
    border-radius: 12px;
    z-index: var(--affine-z-index-popover);
  }

  .linked-page-popover icon-button {
    padding: 8px;
    justify-content: flex-start;
    gap: 8px;
  }

  .linked-page-popover .group-title {
    color: var(--affine-text-secondary-color);
    margin: 8px 12px;
  }

  .linked-page-popover .divider {
    margin: 6px 12px;
    height: 1px;
    background: var(--affine-border-color);
  }

  ::-webkit-scrollbar {
    -webkit-appearance: none;
    width: 4px;
  }
  ::-webkit-scrollbar-thumb {
    border-radius: 2px;
    background-color: #b1b1b1;
  }
`;
