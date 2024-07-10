import { css } from 'lit';

export const styles = css`
  .embed-block-container {
    border-radius: 8px;
  }
  .embed-block-container.selected.light {
    box-shadow: 0px 0px 0px 1px var(--affine-brand-color);
  }
  .embed-block-container.selected.dark {
    box-shadow: 0px 0px 0px 1px var(--affine-brand-color);
  }
`;
