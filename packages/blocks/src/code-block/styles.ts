import { css } from 'lit';

export const codeBlockStyles = css`
  affine-code {
    position: relative;
  }

  .affine-code-block-container {
    font-size: var(--affine-font-sm);
    line-height: var(--affine-line-height);
    position: relative;
    padding: 32px 24px;
    margin-bottom: 4px;
    background: var(--affine-background-code-block);
    border-radius: 10px;
    box-sizing: border-box;
  }

  .affine-code-block-container .inline-editor {
    font-family: var(--affine-font-code-family);
    font-variant-ligatures: none;
  }

  .affine-code-block-container rich-text {
    /* to make sure the resize observer can be triggered as expected */
    display: block;
    position: relative;
    overflow-x: auto;
    overflow-y: hidden;
    width: 90%;
  }

  .affine-code-block-container .rich-text-container {
    position: relative;
    border-radius: 4px;
    padding: 0px 24px 0px 30px;
  }

  #line-numbers {
    position: absolute;
    left: 0px;
    line-height: var(--affine-line-height);
    font-size: var(--affine-font-sm);
    color: var(--affine-text-secondary-color);
    font-family: var(--affine-font-code-family);
  }

  .affine-code-block-container.wrap #line-numbers {
    top: calc(var(--affine-line-height) + 4px);
  }

  .affine-code-block-container.wrap #line-numbers > div {
    margin-top: calc(var(--top, 0) / 1 - var(--affine-line-height));
  }
`;
