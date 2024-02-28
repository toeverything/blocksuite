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

  .affine-callout-block-title-container {
    font-size: calc(var(--affine-font-base) + 2px);
    margin-bottom: 8px;
  }

  .affine-paragraph-rich-text-wrapper {
    position: relative;
    font-size: var(--affine-font-base);
  }

  .affine-callout-placeholder {
    position: absolute;
    display: none;
    left: 0;
    bottom: 0;
    pointer-events: none;
    color: var(--affine-black-30);
    fill: var(--affine-black-30);
  }

  .affine-paragraph-placeholder.visible {
    display: block;
  }
`;
