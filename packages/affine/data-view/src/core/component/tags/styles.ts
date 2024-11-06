import { unsafeCSSVar, unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';

export const styles = css`
  affine-multi-tag-select {
    position: absolute;
    z-index: 2;
    color: ${unsafeCSSVarV2('text/primary')};
    border: 0.5px solid ${unsafeCSSVarV2('layer/insideBorder/blackBorder')};
    border-radius: 8px;
    background: ${unsafeCSSVarV2('layer/background/primary')};
    box-shadow: ${unsafeCSSVar('overlayPanelShadow')};
    font-family: var(--affine-font-family);
    max-width: 400px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  @media print {
    affine-multi-tag-select {
      display: none;
    }
  }

  .tag-select-input-container {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px;
  }

  .tag-select-input {
    flex: 1 1 0;
    border: none;
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    color: ${unsafeCSSVarV2('text/primary')};
    background-color: transparent;
    line-height: 22px;
    font-size: 14px;
    outline: none;
  }

  .tag-select-input::placeholder {
    color: var(--affine-placeholder-color);
  }

  .select-options-tips {
    padding: 4px;
    color: ${unsafeCSSVarV2('text/secondary')};
    font-size: 14px;
    font-weight: 500;
    line-height: 22px;
    user-select: none;
  }

  .select-options-container {
    max-height: 400px;
    overflow-y: auto;
    user-select: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .select-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 4px 4px 0;
    border-radius: 4px;
    cursor: pointer;
  }

  .tag-container {
    display: flex;
    align-items: center;
    padding: 0 8px;
    gap: 4px;
    border-radius: 4px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    border: 1px solid ${unsafeCSSVarV2('database/border')};
    user-select: none;
  }

  .tag-text {
    font-size: 14px;
    line-height: 22px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tag-delete-icon {
    display: flex;
    align-items: center;
    color: ${unsafeCSSVarV2('chip/label/text')};
  }

  .select-option.selected {
    background: ${unsafeCSSVarV2('layer/background/hoverOverlay')};
  }
  .select-option-content {
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  .select-option-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    border-radius: 4px;
    cursor: pointer;
    visibility: hidden;
    color: ${unsafeCSSVarV2('icon/primary')};
    margin-left: 4px;
  }

  .select-option.selected .select-option-icon {
    visibility: visible;
  }

  .select-option-icon:hover {
    background: ${unsafeCSSVarV2('layer/background/hoverOverlay')};
  }

  .select-option-drag-handler {
    width: 4px;
    height: 12px;
    border-radius: 1px;
    background-color: ${unsafeCSSVarV2('button/grabber/default')};
    margin-right: 4px;
    cursor: -webkit-grab;
    flex-shrink: 0;
  }

  .select-option-new-icon {
    font-size: 14px;
    line-height: 22px;
    color: ${unsafeCSSVarV2('text/primary')};
    margin-right: 8px;
    margin-left: 4px;
  }

  // .select-selected-text {
  //   width: calc(100% - 16px);
  //   white-space: nowrap;
  //   text-overflow: ellipsis;
  //   overflow: hidden;
  // }
  //
  // .select-selected > .close-icon {
  //   display: flex;
  //   align-items: center;
  // }
  //
  // .select-selected > .close-icon:hover {
  //   cursor: pointer;
  // }
  //
  // .select-selected > .close-icon > svg {
  //   fill: var(--affine-black-90);
  // }
  //
  // .select-option-new {
  //   display: flex;
  //   flex-direction: row;
  //   align-items: center;
  //   height: 36px;
  //   padding: 4px;
  //   gap: 5px;
  //   border-radius: 4px;
  //   background: var(--affine-selected-color);
  // }
  //
  // .select-option-new-text {
  //   overflow: hidden;
  //   white-space: nowrap;
  //   text-overflow: ellipsis;
  //   height: 28px;
  //   padding: 2px 10px;
  //   border-radius: 4px;
  //   background: var(--affine-tag-red);
  // }
  //
  // .select-option-new-icon {
  //   display: flex;
  //   align-items: center;
  //   gap: 6px;
  //   height: 28px;
  //   color: var(--affine-text-primary-color);
  //   margin-right: 8px;
  // }
  //
  // .select-option-new-icon svg {
  //   width: 16px;
  //   height: 16px;
  // }
  //
  // .select-option {
  //   position: relative;
  //   display: flex;
  //   justify-content: space-between;
  //   align-items: center;
  //   padding: 4px;
  //   border-radius: 4px;
  //   margin-bottom: 4px;
  //   cursor: pointer;
  // }
  //
  // .select-option.selected {
  //   background: var(--affine-hover-color);
  // }
  //
  // .select-option-text-container {
  //   width: 100%;
  //   overflow: hidden;
  //   display: flex;
  // }
  //
  // .select-option-group-name {
  //   font-size: 9px;
  //   padding: 0 2px;
  //   border-radius: 2px;
  // }
  //
  // .select-option-name {
  //   padding: 4px 8px;
  //   border-radius: 4px;
  //   white-space: nowrap;
  //   text-overflow: ellipsis;
  //   overflow: hidden;
  // }
  //
  //
  // .select-option-icon:hover {
  //   background: var(--affine-hover-color);
  // }
  //
  // .select-option-icon svg {
  //   width: 16px;
  //   height: 16px;
  //   pointer-events: none;
  // }
`;
