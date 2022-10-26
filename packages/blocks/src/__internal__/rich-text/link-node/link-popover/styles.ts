import { css } from 'lit';

// Reference to https://web.dev/building-a-tooltip-component/
const toolTipStyle = css`
  tool-tip {
    position: absolute;
    left: 0;
    top: 0;
    inline-size: max-content;
    text-align: center;
    font-size: var(--affine-font-xs);
    padding: 4px 12px;
    border-radius: 10px 10px 10px 0px;
    color: var(--affine-tooltip-color);
    background: var(--affine-tooltip-background);
    box-shadow: var(--affine-tooltip-shadow);
    border-radius: 10px 10px 10px 0px;

    opacity: 0;
    transform: translateX(0) translateY(calc(-100% - 8px));
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
    user-select: none;
  }

  .has-tool-tip {
    position: relative;
  }
  .has-tool-tip:is(:hover, :focus-visible, :active) > tool-tip {
    opacity: 1;
    transition-delay: 200ms;
  }
`;

export const editLinkStyle = css`
  .affine-link-edit-popover {
    box-sizing: border-box;
    width: 382px;
    height: 128px;
    padding: 24px;
    box-shadow: var(--affine-popover-shadow);
    background: var(--affine-popover-background);
    border-radius: 0px 10px 10px 10px;

    display: grid;
    grid-template-columns: auto auto auto;
    grid-template-rows: repeat(2, 1fr);
    gap: 12px;
    grid-template-areas:
      'text text-input .'
      'link link-input btn';
    justify-items: center;
    align-items: center;
  }

  .affine-edit-text-text {
    grid-area: text;
  }

  .affine-edit-text-input {
    grid-area: text-input;
  }

  .affine-edit-link-text {
    grid-area: link;
  }

  .affine-edit-link-input {
    grid-area: link-input;
  }

  .affine-confirm-button {
    grid-area: btn;
  }
`;

export const linkPopoverStyle = css`
  .overlay-container {
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-base);
    font-style: normal;
    line-height: 24px;
    color: var(--affine-popover-color);
    z-index: var(--affine-z-index-popover);
    animation: affine-popover-fade-in 0.2s ease;
  }

  @keyframes affine-popover-fade-in {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .overlay-mask {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  input {
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-base);
    box-sizing: border-box;
    padding: 6px 12px;
    width: 260px;
    height: 34px;
    color: inherit;

    border: 1px solid var(--affine-border-color);
    outline: none;
    border-radius: 10px;
    background: transparent;
  }
  input::placeholder {
    color: var(--affine-placeholder-color);
  }
  input:focus {
    border: 1px solid var(--affine-primary-color);
  }

  .affine-link-popover {
    display: flex;
    align-items: center;
    height: 34px;
    padding: 0 12px;

    background: var(--affine-popover-background);
    box-shadow: var(--affine-popover-shadow);
    border-radius: 0px 10px 10px 10px;
  }

  .affine-link-popover-input {
    border: none;
  }
  .affine-link-popover-input::placeholder {
    color: var(--affine-placeholder-color);
  }
  .affine-link-popover-input:focus {
    border: none;
  }

  .affine-link-preview {
    width: 260px;
    height: 28px;
    display: flex;
    align-items: center;
    user-select: none;
    cursor: pointer;
  }

  .affine-link-popover-dividing-line {
    margin: 0 6px;
    width: 1px;
    height: 20px;
    background-color: var(--affine-border-color);
  }

  ${editLinkStyle}
  ${toolTipStyle}
`;
