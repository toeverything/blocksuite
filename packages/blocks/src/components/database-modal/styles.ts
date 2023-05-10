import { css } from 'lit';

export const styles = css`
  :host {
    font-family: var(--affine-font-family);
  }
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
    width: 720px;
    padding: 24px 40px;
    border-radius: 24px;
    background: var(--affine-background-overlay-panel-color);
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .modal-header-title {
    color: var(--affine-text-primary-color);
    font-size: 20px;
    font-weight: 600;
  }
  .modal-header-close-icon {
    display: flex;
    align-items: center;
    color: var(--affine-icon-color);
    cursor: pointer;
  }
  .modal-header-close-icon svg {
    width: 24px;
    height: 24px;
  }
  .modal-footer {
    color: var(--affine-text-secondary-color);
    font-size: 14px;
    text-align: center;
  }
  .modal-body {
    padding: 24px 0;
  }
  .modal-desc {
    margin-bottom: 38px;
    color: var(--affine-text-primary-color);
    font-size: 14px;
  }
  .modal-view-container {
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
  .modal-view-item.coming-soon .modal-view-item-content {
    pointer-events: none;
  }
  .modal-view-item-content:hover {
    background: var(--affine-hover-color);
  }
  .modal-view-item-content:hover .modal-view-item-text,
  .modal-view-item-content:hover svg {
    fill: var(--affine-primary-color);
    color: var(--affine-primary-color);
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
    fill: var(--affine-black-50);
  }
  .modal-view-item-text {
    font-size: 14px;
    color: var(--affine-black-50);
  }
  .modal-view-item-description {
    font-size: 12px;
    color: var(--affine-text-secondary-color);
    text-align: center;
  }
`;
