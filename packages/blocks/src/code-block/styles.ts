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
    padding: 32px 24px;
    background: var(--affine-background-code-block);
    border-radius: 10px;
    margin: 24px 0px;
    box-sizing: border-box;
  }

  .affine-code-block-container .inline-editor {
    font-family: var(--affine-font-code-family);
    font-variant-ligatures: none;
  }

  .affine-code-block-container .lang-list-wrapper {
    position: absolute;
    font-size: var(--affine-font-sm);
    line-height: var(--affine-line-height);
    top: 5px;
    left: 5px;
  }

  .affine-code-block-container > .lang-list-wrapper,
  .affine-code-block-container > affine-code-toolbar-widget {
    visibility: hidden;
  }

  .affine-code-block-container:hover > .lang-list-wrapper,
  .affine-code-block-container:hover > affine-code-toolbar-widget {
    visibility: visible;
  }

  .affine-code-block-container > .lang-list-wrapper > .lang-button {
    background-color: var(--affine-background-primary-color);
    display: flex;
    justify-content: flex-start;
    gap: 4px;
    padding: 2px 4px;
    box-shadow: var(--affine-shadow-1);
  }

  .affine-code-block-container > .lang-list-wrapper > .lang-button:hover {
    background-color: var(--affine-hover-color);
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
