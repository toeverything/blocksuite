import { css } from 'lit';

export const listPrefix = css`
  .affine-list-block__prefix {
    display: flex;
    color: var(--affine-blue-700);
    font-size: var(--affine-font-sm);
    user-select: none;
    position: relative;
  }

  .affine-list-block__numbered {
    min-width: 22px;
    height: 24px;
    margin-left: 2px;
  }

  .affine-list-block__todo-prefix {
    display: flex;
    align-items: center;
    cursor: pointer;
    width: 24px;
    height: 24px;
    color: var(--affine-icon-color);
  }

  .affine-list-block__todo-prefix > svg {
    width: 20px;
    height: 20px;
  }
`;

export const toggleStyles = css`
  .toggle-icon {
    display: flex;
    align-items: center;
    height: 16px;
    margin: 4px 0;
    position: absolute;
    left: 0;
    transform: translateX(-100%);
    border-radius: 4px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }
  .toggle-icon:hover {
    background: var(--affine-hover-color);
  }
  .affine-list-rich-text-wrapper:hover .toggle-icon {
    opacity: 1;
  }
  .toggle-icon__collapsed {
    opacity: 1;
  }

  .with-drag-handle .affine-list-rich-text-wrapper .toggle-icon {
    opacity: 1;
  }
  .with-drag-handle .affine-block-children-container .toggle-icon {
    opacity: 0;
  }
`;

export const listBlockStyles = css`
  affine-list {
    display: block;
    font-size: var(--affine-font-base);
  }

  .affine-list-block-container {
    box-sizing: border-box;
    border-radius: 4px;
    position: relative;
  }
  .affine-list-block-container .affine-list-block-container {
    margin-top: 0;
  }
  .affine-list-rich-text-wrapper {
    position: relative;
    display: flex;
  }
  .affine-list-rich-text-wrapper rich-text {
    flex: 1;
  }

  .affine-list--checked {
    color: var(--affine-text-secondary-color);
  }

  ${listPrefix}
  ${toggleStyles}
`;
