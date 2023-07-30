import { css } from 'lit';

const listPrefix = css`
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

const toggleStyles = css`
  .toggle-icon {
    display: flex;
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
  .affine-list-block-container:hover .toggle-icon {
    opacity: 1;
  }
  .toggle-icon__collapsed {
    opacity: 1;
  }
`;

export const styles = css`
  .affine-list-block-container {
    box-sizing: border-box;
    border-radius: 4px;
    padding: 4px 0;
    position: relative;
  }
  .affine-list-block-container--first {
    margin-top: 14px;
  }
  .affine-list-block-container .affine-list-block-container {
    margin-top: 0;
  }
  .affine-list-rich-text-wrapper {
    display: flex;
    position: relative;
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
