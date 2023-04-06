import { css } from 'lit';

export const styles = css`
  :host * {
    box-sizing: border-box;
  }
  .overlay-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    z-index: var(--affine-z-index-modal);
  }
  .modal-container {
    position: absolute;
    z-index: var(--affine-z-index-modal);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 673px;
    padding: 10px 18px 14px;
    height: 288px;
    border-radius: 5px;
    background: var(--affine-hub-background);
    font-family: 'Avenir Next';
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .modal-header-title {
    font-size: 20px;
    font-weight: 600;
  }
  .modal-header-close-icon {
    display: flex;
    align-items: center;
    color: var(--affine-icon-color);
    cursor: pointer;
  }
  .modal-footer {
    color: var(--affine-text-color);
    font-size: 14px;
  }
  .modal-body {
    display: flex;
    justify-content: center;
    gap: 18px;
  }
  .modal-view-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    cursor: pointer;
  }
  .modal-view-item.coming-soon {
    cursor: not-allowed;
  }
  .modal-view-item.more {
    cursor: default;
  }
  .modal-view-item.more > .modal-view-item-content {
    justify-content: center;
    width: 142px;
  }
  .modal-view-item-content.selected {
    background: rgba(0, 0, 0, 0.04);
  }
  .modal-view-item-content.selected svg {
    fill: #5438ff;
  }
  .modal-view-item-content.selected .modal-view-item-text {
    color: #5438ff;
  }
  .modal-view-item-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 18px 0;
    gap: 6px;
    width: 108px;
    height: 108px;
    border: 2px solid var(--affine-border-color);
    border-radius: 8px;
  }
  .modal-view-item-icon {
    width: 42px;
    height: 42px;
  }
  .modal-view-item-icon svg {
    width: 42px;
    height: 42px;
  }
  .modal-view-item-text {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.5);
  }
  .modal-view-item-description {
    font-size: 12px;
    color: var(--affine-secondary-text-color);
    text-align: center;
  }
`;
