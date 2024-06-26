import { css } from 'lit';

export const styles = css`
  :host {
    box-sizing: border-box;
  }

  .affine-reference-popover-container {
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

  .affine-reference-popover-open-button > svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .affine-reference-popover-view-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 2px;
    border-radius: 6px;
    background: var(--affine-hover-color);
  }
  .affine-reference-popover-view-selector > icon-button {
    padding: 0px;
  }
  .affine-reference-popover-view-selector .current-view {
    background: var(--affine-background-overlay-panel-color);
  }
`;
