import { css } from 'lit';

export const cellBlockStyles = css`
  affine-cell {
    width: 100%;
  }
  .affine-cell-block-container {
    display: flow-root;
  }
  .affine-cell-block-container.selected {
    background-color: var(--affine-hover-color);
  }
`;
