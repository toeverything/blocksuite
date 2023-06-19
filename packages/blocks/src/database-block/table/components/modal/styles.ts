import { css } from 'lit';

export const styles = css`
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
