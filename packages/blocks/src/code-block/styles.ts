import { css } from 'lit';

export const codeBlockStyles = css`
  code-block {
    position: relative;
    z-index: 1;
  }

  .affine-code-block-container {
    font-size: var(--affine-font-sm);
    line-height: var(--affine-line-height);
    position: relative;
    padding: 32px 0px 12px 0px;
    background: var(--affine-background-code-block);
    border-radius: 10px;
    margin-top: 24px;
    margin-bottom: 24px;
  }

  .affine-code-block-container .inline-editor {
    font-family: var(--affine-font-code-family);
    font-variant-ligatures: none;
  }

  .affine-code-block-container .lang-list-wrapper {
    position: absolute;
    font-size: var(--affine-font-sm);
    line-height: var(--affine-line-height);
    top: 12px;
    left: 12px;
  }

  .affine-code-block-container > .lang-list-wrapper {
    visibility: hidden;
  }
  .affine-code-block-container:hover > .lang-list-wrapper {
    visibility: visible;
  }

  .affine-code-block-container > .lang-list-wrapper > .lang-button {
    display: flex;
    justify-content: flex-start;
    padding: 0 8px;
  }

  .affine-code-block-container rich-text {
    /* to make sure the resize observer can be triggered as expected */
    display: block;
    position: relative;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 20px;
    width: 90%;
  }

  .affine-code-block-container .rich-text-container {
    position: relative;
    border-radius: 4px;
    padding: 4px 12px 4px 60px;
  }

  #line-numbers {
    position: absolute;
    text-align: right;
    left: 20px;
    line-height: var(--affine-line-height);
    color: var(--affine-text-secondary-color);
  }

  .affine-code-block-container.wrap #line-numbers {
    top: calc(var(--affine-line-height) + 4px);
  }

  .affine-code-block-container.wrap #line-numbers > div {
    margin-top: calc(var(--top, 0) / 1 - var(--affine-line-height));
  }

  .code-block-option {
    box-shadow: var(--affine-shadow-2);
    border-radius: 8px;
    list-style: none;
    padding: 4px;
    width: 40px;
    background-color: var(--affine-background-overlay-panel-color);
    margin: 0;
  }
`;
