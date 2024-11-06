import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';

import { scrollbarStyle } from '../../../_common/components/utils.js';

export const linkedDocPopoverStyles = css`
  :host {
    position: absolute;
  }

  .linked-doc-popover {
    position: fixed;
    left: 0;
    top: 0;
    box-sizing: border-box;
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    font-size: var(--affine-font-base);
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;

    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
    border-radius: 12px;
    z-index: var(--affine-z-index-popover);
  }

  .linked-doc-popover icon-button {
    padding: 8px;
    justify-content: flex-start;
    gap: 8px;
  }

  .linked-doc-popover .group-title {
    color: var(--affine-text-secondary-color);
    margin: 8px 12px;
  }

  .linked-doc-popover .divider {
    margin: 6px 12px;
    height: 1px;
    background: var(--affine-border-color);
  }

  .group icon-button svg {
    width: 20px;
    height: 20px;
  }

  ${scrollbarStyle('.linked-doc-popover .group')}
`;

export const mobileLinkedDocMenuStyles = css`
  .input-container {
    display: flex;
    position: fixed;
    /* TODO(@L-Sun): configurable this */
    top: 44px;
    margin: 0px 16px;
    width: calc(100% - 2 * 16px);
    padding: 2px 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    border-radius: 4px;
    background: ${unsafeCSSVarV2('layer/background/secondary')};

    > .prefix,
    input {
      background: inherit;

      /* MobileTypeface/base */
      color: ${unsafeCSSVarV2('text/primary')};
      font-family: 'SF Pro Text';
      font-size: 16px;
      line-height: 22px;
      font-style: normal;
      font-weight: 400;
    }

    > input {
      flex: 1;
      border: none;
    }

    > input:focus-visible {
      outline: none;
    }
  }

  .mobile-linked-doc-menu {
    height: 220px;
    width: 100%;
    position: fixed;
    bottom: 0;
    overflow-y: auto;

    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex-shrink: 0;

    --border-style: 1px solid ${unsafeCSSVarV2('layer/insideBorder/border')};

    border-radius: 12px 12px 0px 0px;
    border-top: var(--border-style);
    border-right: var(--border-style);
    border-left: var(--border-style);
    background: ${unsafeCSSVarV2('layer/background/primary')};
    box-shadow: 0px -3px 10px 0px rgba(0, 0, 0, 0.07);
  }

  ${scrollbarStyle('.mobile-linked-doc-menu')}

  .mobile-linked-doc-menu-item {
    display: flex;
    width: 100%;
    height: 44px;
    padding: 11px 20px;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    box-sizing: border-box;

    > svg {
      width: 20px;
      height: 20px;
    }

    .text {
      overflow: hidden;
      color: ${unsafeCSSVarV2('text/primary')};
      text-align: justify;
      text-overflow: ellipsis;

      font-family: 'SF Pro';
      font-size: 17px;
      font-style: normal;
      font-weight: 400;
      line-height: 22px;
      letter-spacing: -0.43px;
    }
  }
`;
