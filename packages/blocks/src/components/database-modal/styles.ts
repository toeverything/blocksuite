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
    z-index: var(--affine-z-index-popover);
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
    background: #fbfbfc;
    font-family: 'Avenir Next';
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .modal-footer {
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
  .modal-view-item.more > .modal-view-item-content {
    justify-content: center;
    width: 142px;
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
    background: rgba(0, 0, 0, 0.04);
    border: 2px solid #e3e2e4;
    border-radius: 8px;
  }
  .modal-view-item-icon {
    width: 42px;
    height: 42px;
  }
  .modal-view-item-icon svg {
    width: 42px;
    height: 42px;
    fill: var(--affine-icon-color);
  }
  .modal-view-item-text {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.5);
  }
  .modal-view-item-description {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.5);
    text-align: center;
  }
`;
