import { css } from 'lit';

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
    font-style: normal;
    line-height: 24px;
    font-size: var(--affine-font-sm);
    color: var(--affine-popover-color);
    z-index: var(--affine-z-index-popover);
  }

  .overlay-mask {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  input {
    box-sizing: border-box;
    padding: 6px 12px;
    width: 260px;
    height: 34px;
    color: inherit;

    // TODO dark mode
    /* background-color: #4d4c53; */
    border: 1px solid #e0e6eb;
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
    width: 316px;
    height: 34px;
    padding: 0 12px;

    background: var(--affine-popover-background);
    box-shadow: var(--affine-popover-shadow);
    border-radius: 0px 10px 10px 10px;
  }

  .affine-link-popover-input {
    flex: 1;
    border: none;
  }
  .affine-link-popover-input::placeholder {
    color: var(--affine-placeholder-color);
  }
  .affine-link-popover-input:focus {
    border: none;
  }

  .affine-link-popover-dividing-line {
    margin: 0 6px;
    width: 1px;
    height: 20px;
    // TODO dark mode
    /* background-color: #4d4c53; */
    background-color: #e0e6eb;
  }

  ${editLinkStyle}
`;
