import { css } from 'lit';

export const styles = css`
  .embed-block-container {
    border-radius: 8px;
    position: relative;
  }
  .embed-block-container.selected.light {
    box-shadow: 0px 0px 0px 1px var(--affine-brand-color);
  }
  .embed-block-container.selected.dark {
    box-shadow: 0px 0px 0px 1px var(--affine-brand-color);
  }
  @media print {
    .embed-block-container.selected.light,
    .embed-block-container.selected.dark {
      box-shadow: none;
    }
  }
`;
