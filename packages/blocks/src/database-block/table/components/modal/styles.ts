import { css } from 'lit';

export const modelStyles = css`
  .table-view-modal-overlay {
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-base);
    line-height: var(--affine-line-height);
    color: var(--affine-text-primary-color);
    font-weight: 400;
  }
  .table-view-modal-overlay-mask {
    position: fixed;
    z-index: var(--affine-z-index-modal);
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--affine-background-modal-color);
  }
  .table-view-modal-container {
    position: absolute;
    z-index: var(--affine-z-index-modal);
    top: 50%;
    left: 50%;
    width: 100vw;
    transform: translate(-50%, -50%);
  }
  .table-view-content {
    width: calc(100% - 128px);
    margin: 12px 64px;
    padding: 24px 21px;
    overflow-y: auto;
    border-radius: 8px;
    background-color: var(--affine-white);
    box-shadow: var(--affine-shadow-2);
  }

  .action-buttons {
    position: absolute;
    right: 12px;
    top: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .action-button {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--affine-border-color);
    border-radius: 7px;
    background-color: var(--affine-white);
  }
  .action-button svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
  }
`;

export const fullModelStyles = css`
  .table-view-full-modal-overlay {
    position: fixed;
    z-index: var(--affine-z-index-modal);
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    padding: 24px;
    border: 1px solid var(--affine-border-color);
    border-radius: 6px;
    background: var(--affine-white);
    box-shadow: var(--affine-shadow-2);

    font-family: var(--affine-font-family);
    font-size: var(--affine-font-base);
    line-height: var(--affine-line-height);
    color: var(--affine-text-primary-color);
    font-weight: 400;
  }

  .table-view-full-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 0.5px solid var(--affine-divider-color);
    color: var(--affine-text-secondary-color);
    font-size: 12px;
  }

  .titles {
    display: flex;
    align-items: center;
  }

  .titles .separator {
    margin: 0 8px;
  }

  .titles .title {
    display: flex;
    align-items: center;
  }

  .titles svg {
    margin-right: 6px;
  }

  .table-view-full-header .close {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }

  .table-view-full-header svg {
    width: 14px;
    height: 14px;
    fill: var(--affine-icon-color);
  }
`;
