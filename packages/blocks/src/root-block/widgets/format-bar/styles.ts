import { css } from 'lit';

import { scrollbarStyle } from '../../../_common/components/utils.js';

const paragraphButtonStyle = css`
  .paragraph-button-icon > svg:nth-child(2) {
    transition-duration: 0.3s;
  }
  .paragraph-button-icon:is(:hover, :focus-visible, :active)
    > svg:nth-child(2) {
    transform: rotate(180deg);
  }

  .highlight-icon > svg:nth-child(2) {
    transition-duration: 0.3s;
  }
  .highlight-icon:is(:hover, :focus-visible, :active) > svg:nth-child(2) {
    transform: rotate(180deg);
  }

  .highlight-panel {
    max-height: 380px;
  }

  .highligh-panel-heading {
    display: flex;
    color: var(--affine-text-secondary-color);
    padding: 4px;
  }

  editor-menu-content {
    display: none;
    position: absolute;
    padding: 0;
    z-index: var(--affine-z-index-popover);
    --packed-height: 6px;
  }

  editor-menu-content > div[data-orientation='vertical'] {
    padding: 8px;
    overflow-y: auto;
  }

  ${scrollbarStyle('editor-menu-content > div[data-orientation="vertical"]')}
`;

export const formatBarStyle = css`
  .affine-format-bar-widget {
    position: absolute;
    display: none;
    z-index: var(--affine-z-index-popover);
    user-select: none;
  }

  ${paragraphButtonStyle}
`;
