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
    font-size: var(--affine-font-base);
    padding: 12px 8px;
    display: flex;
    flex-direction: column;

    background: var(--affine-popover-background);
    box-shadow: var(--affine-popover-shadow);
    border-radius: 0 10px 10px 10px;
    z-index: var(--affine-z-index-popover);
  }
`;
