import { css } from 'lit';

export const styles = css`
  .affine-callout-block-container {
    position: relative;
    border-radius: 4px;
    margin-top: 10px;
    margin-bottom: 10px;
    display: flex;
    flex-direction: column;
    padding: 16px;
  }

  .affine-callout-block-header-container {
    font-size: var(--affine-font-base);
    margin-bottom: 8px;
    font-weight: 600;
  }

  .affine-paragraph-rich-text-wrapper {
    position: relative;
    font-size: var(--affine-font-base);
  }
`;
