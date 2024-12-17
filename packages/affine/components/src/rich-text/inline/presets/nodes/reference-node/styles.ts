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

  editor-icon-button.doc-title .label {
    max-width: 110px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: none;
    cursor: pointer;
    color: var(--affine-link-color);
    font-feature-settings:
      'clig' off,
      'liga' off;
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-sm);
    font-style: normal;
    font-weight: 400;
    text-decoration: none;
    text-wrap: nowrap;
  }
`;
