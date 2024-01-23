import { css } from 'lit';

import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';

export const styles = css`
  .affine-attachment-card {
    margin: 0 auto;
    box-sizing: border-box;
    display: flex;
    gap: 12px;

    width: 100%;
    max-width: ${EMBED_CARD_WIDTH.horizontalThin}px;
    height: ${EMBED_CARD_HEIGHT.horizontalThin}px;

    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--affine-background-tertiary-color);

    opacity: var(--add, 1);
    background: var(--affine-background-primary-color);
    box-shadow: var(--affine-shadow-1);
    user-select: none;
  }

  .affine-attachment-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    flex: 1 0 0;

    border-radius: var(--1, 0px);
    opacity: var(--add, 1);
  }

  .affine-attachment-content-title {
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;

    align-self: stretch;
    padding: var(--1, 0px);
    border-radius: var(--1, 0px);
    opacity: var(--add, 1);
  }

  .affine-attachment-content-title-icon {
    display: flex;
    width: 16px;
    height: 16px;
    align-items: center;
    justify-content: center;
  }

  .affine-attachment-content-title-icon svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-background-primary-color);
  }

  .affine-attachment-content-title-text {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;

    word-break: break-all;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--affine-text-primary-color);

    font-family: var(--affine-font-family);
    font-size: var(--affine-font-sm);
    font-style: normal;
    font-weight: 600;
    line-height: 22px;
  }

  .affine-attachment-content-info {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    flex: 1 0 0;

    word-break: break-all;
    overflow: hidden;
    color: var(--affine-text-secondary-color);
    text-overflow: ellipsis;

    font-family: var(--affine-font-family);
    font-size: var(--affine-font-xs);
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
  }

  .affine-attachment-banner {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .affine-attachment-banner svg {
    width: 40px;
    height: 40px;
  }

  .affine-attachment-card.loading {
    background: var(--affine-background-secondary-color);

    .affine-attachment-content-title-text {
      color: var(--affine-placeholder-color);
    }
  }

  .affine-attachment-card.error,
  .affine-attachment-card.unsynced {
    background: var(--affine-background-secondary-color);
  }

  .affine-attachment-card.cubeThick {
    width: ${EMBED_CARD_WIDTH.cubeThick}px;
    height: ${EMBED_CARD_HEIGHT.cubeThick}px;

    flex-direction: column-reverse;

    .affine-attachment-content {
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
      justify-content: space-between;
    }

    .affine-attachment-banner {
      justify-content: flex-start;
    }
  }
`;

// .affine-attachment-container {
//   position: relative;
//   display: flex;
//   flex-direction: column;
//   padding: 16px 24px;
//   margin-top: calc(var(--affine-paragraph-space) + 8px);

//   border-radius: 12px;
//   border: 3px solid var(--affine-background-overlay-panel-color);
//   background: var(--affine-card-background-blue);
//   box-shadow: var(--affine-shadow-1);
//   cursor: pointer;
// }

// .affine-attachment-embed-container {
//   position: relative;
//   display: flex;
//   justify-content: center;
//   margin-top: calc(var(--affine-paragraph-space) + 8px);
// }

// .affine-attachment-title {
//   display: flex;
//   gap: 8px;

//   color: var(--affine-text-primary-color);
//   font-size: var(--affine-font-sm);
//   font-weight: 600;
//   overflow: hidden;
//   text-overflow: ellipsis;
//   fill: var(--affine-icon-color);
//   user-select: none;
//   z-index: 1;
// }

// .affine-attachment-title > svg {
//   /* Align icon vertically to the center of the first line of text,  */
//   /* Assume the height of the icon is 16px */
//   margin-top: calc((var(--affine-line-height) - 16px) / 2);
// }

// .affine-attachment-name {
//   flex: 1;
//   word-wrap: break-word;
//   overflow: hidden;
// }

// .affine-attachment-desc {
//   color: var(--affine-text-secondary-color);
//   font-size: var(--affine-font-xs);
//   user-select: none;
// }

// .affine-attachment-banner {
//   position: absolute;
//   display: flex;
//   right: 24px;
//   bottom: 0;
// }

// .affine-attachment-loading {
//   display: flex;
//   align-items: center;
//   gap: 8px;

//   color: var(--affine-placeholder-color);
//   font-size: var(--affine-font-sm);
//   font-weight: 600;
//   fill: var(--affine-icon-color);
//   user-select: none;
// }

// .affine-attachment-caption {
//   width: 100%;
//   font-size: var(--affine-font-sm);
//   outline: none;
//   border: 0;
//   font-family: inherit;
//   text-align: center;
//   color: var(--affine-icon-color);
//   background: var(--affine-background-primary-color);
// }
// .affine-attachment-caption::placeholder {
//   color: var(--affine-placeholder-color);
// }

// .overlay-mask {
//   position: absolute;
//   top: 0;
//   left: 0;
//   width: 100%;
//   height: 100%;
// }
