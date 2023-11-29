import { css } from 'lit';

export const styles = css`
  :host {
    z-index: 1;
  }

  .affine-html-options {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    gap: 4px;
    border-radius: 8px;
    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
  }

  .affine-html-options .divider {
    width: 1px;
    margin: 0 1.5px;
    height: 24px;
    background-color: var(--affine-border-color);
  }

  .affine-html-options > div[hidden],
  icon-button[hidden] {
    display: none;
  }
`;
