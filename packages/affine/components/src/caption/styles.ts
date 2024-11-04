import { css } from 'lit';

export const styles = css`
  .affine-block-component.border.light .selected-style {
    border-radius: 8px;
    box-shadow: 0px 0px 0px 1px var(--affine-brand-color);
  }
  .affine-block-component.border.dark .selected-style {
    border-radius: 8px;
    box-shadow: 0px 0px 0px 1px var(--affine-brand-color);
  }
  @media print {
    .affine-block-component.border.light .selected-style,
    .affine-block-component.border.dark .selected-style {
      box-shadow: none;
    }
  }
`;
