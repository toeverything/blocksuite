import { css } from 'lit';

export const embedCardToolbarStyle = css`
  :host {
    position: absolute;
    top: 0;
    left: 0;
    z-index: var(--affine-z-index-popover);
  }

  .embed-card-toolbar {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    padding: 8px;
    gap: 8px;
    height: 40px;

    border-radius: 8px;
    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
    width: max-content;
  }

  .embed-card-toolbar .divider {
    width: 1px;
    height: 24px;
    background-color: var(--affine-border-color);
  }

  .embed-card-toolbar-button {
    color: var(--affine-icon-color);
  }

  .embed-card-toolbar-button > svg {
    flex-shrink: 0;
  }

  .embed-card-toolbar-button.url {
    display: flex;
    width: 180px;
    padding: var(--1, 0px);
    align-items: flex-start;
    gap: 10px;
    border-radius: var(--1, 0px);
    opacity: var(--add, 1);
    cursor: pointer;
  }

  .embed-card-toolbar-button.url > span {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;

    color: var(--affine-link-color);
    font-feature-settings:
      'clig' off,
      'liga' off;
    font-family: var(--affine-font-family);
    font-size: 15px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    text-overflow: ellipsis;
    overflow: hidden;
    opacity: var(--add, 1);
  }

  .embed-card-toolbar-button.doc-info {
    display: flex;
    align-items: center;
    width: max-content;
    max-width: 180px;

    gap: 4px;
    opacity: var(--add, 1);
    user-select: none;
    cursor: pointer;
  }

  .embed-card-toolbar-button.doc-info > svg {
    width: 20px;
    height: 20px;
  }

  .embed-card-toolbar-button.doc-info > span {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;

    color: var(--affine-text-primary-color);
    font-feature-settings:
      'clig' off,
      'liga' off;
    word-break: break-all;
    font-family: var(--affine-font-family);
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
    text-overflow: ellipsis;
    overflow: hidden;
    opacity: var(--add, 1);
  }

  .embed-card-toolbar-button.view-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 2px;
    border-radius: 6px;
    background: var(--affine-hover-color);
  }
  .embed-card-toolbar-button.view-selector > icon-button {
    padding: 0px;
  }
  .embed-card-toolbar-button.view-selector .current-view {
    background: var(--affine-background-overlay-panel-color);
    border-radius: 6px;
  }
`;
