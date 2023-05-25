import { css } from 'lit';

export const styles = css`
  :host {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 480px;
    height: 316px;
    left: calc(50% - 480px / 2);
    top: calc(50% - 316px / 2);
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-base);
    line-height: var(--affine-line-height);
    padding: 24px 40px;
    display: flex;
    flex-direction: column;
    background: var(--affine-background-primary-color);
    box-shadow: var(--affine-shadow-2);
    border-radius: 16px;
    z-index: var(--affine-z-index-popover);
  }

  header {
    display: flex;
    justify-content: space-between;
    cursor: move;
    user-select: none;
    font-size: var(--affine-font-h-6);
    font-weight: 600;
  }

  .button-container {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .button-container icon-button {
    padding: 8px;
    justify-content: flex-start;
    gap: 8px;
    width: 190px;
    height: 40px;
    box-shadow: 0px 0px 4px rgba(66, 65, 73, 0.14);
  }

  .footer {
    color: var(--affine-text-secondary-color);
  }
`;
