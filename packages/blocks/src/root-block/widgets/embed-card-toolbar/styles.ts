import { css } from 'lit';

export const embedCardToolbarStyle = css`
  :host {
    position: absolute;
    top: 0;
    left: 0;
    z-index: var(--affine-z-index-popover);
  }

  .affine-link-preview {
    display: flex;
    justify-content: flex-start;
    min-width: 60px;
    max-width: 140px;
    padding: var(--1, 0px);
    border-radius: var(--1, 0px);
    opacity: var(--add, 1);
    user-select: none;
    cursor: pointer;

    color: var(--affine-link-color);
    font-feature-settings:
      'clig' off,
      'liga' off;
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-sm);
    font-style: normal;
    font-weight: 400;
    text-decoration: none;
    text-wrap: nowrap;
  }

  .affine-link-preview > span {
    display: inline-block;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;

    text-overflow: ellipsis;
    overflow: hidden;
    opacity: var(--add, 1);
  }

  .card-style-select icon-button.selected {
    border: 1px solid var(--affine-brand-color);
  }

  editor-icon-button.doc-title .label {
    max-width: 110px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: none;
    cursor: pointer;
    color: var(--affine-link-color);
    font-feature-settings:
      'clig' off,
      'liga' off;
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-sm);
    font-style: normal;
    font-weight: 400;
    text-decoration: none;
    text-wrap: nowrap;
  }
`;
