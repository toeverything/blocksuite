import { css } from 'lit';

import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';

export const styles = css`
  .affine-bookmark-card {
    margin: 0 auto;
    box-sizing: border-box;
    display: flex;
    width: 100%;
    height: ${EMBED_CARD_HEIGHT.horizontal}px;

    border-radius: 8px;
    border: 1px solid var(--affine-background-tertiary-color);

    opacity: var(--add, 1);
    background: var(--affine-background-primary-color);
    user-select: none;
  }

  .affine-bookmark-content {
    width: calc(100% - 204px);
    height: 100%;
    display: flex;
    flex-direction: column;
    align-self: stretch;
    gap: 4px;
    padding: 12px;
    border-radius: var(--1, 0px);
    opacity: var(--add, 1);
  }

  .affine-bookmark-content-title {
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;

    align-self: stretch;
    padding: var(--1, 0px);
    border-radius: var(--1, 0px);
    opacity: var(--add, 1);
  }

  .affine-bookmark-content-title-icon {
    display: flex;
    width: 16px;
    height: 16px;
    justify-content: center;
    align-items: center;
  }

  .affine-bookmark-content-title-icon img,
  .affine-bookmark-content-title-icon object,
  .affine-bookmark-content-title-icon svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-background-primary-color);
  }

  .affine-bookmark-content-title-text {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;

    word-break: break-word;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--affine-text-primary-color);

    font-family: var(--affine-font-family);
    font-size: var(--affine-font-sm);
    font-style: normal;
    font-weight: 600;
    line-height: 22px;
  }

  .affine-bookmark-content-description {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;

    flex-grow: 1;

    white-space: normal;
    word-break: break-word;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--affine-text-primary-color);

    font-family: var(--affine-font-family);
    font-size: var(--affine-font-xs);
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
  }

  .affine-bookmark-content-url {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    width: max-content;
    max-width: 100%;
    cursor: pointer;
  }

  .affine-bookmark-content-url > span {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;

    word-break: break-all;
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--affine-text-secondary-color);

    font-family: var(--affine-font-family);
    font-size: var(--affine-font-xs);
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
  }
  .affine-bookmark-content-url:hover > span {
    color: var(--affine-link-color);
  }
  .affine-bookmark-content-url:hover .open-icon {
    fill: var(--affine-link-color);
  }

  .affine-bookmark-content-url-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 20px;
  }
  .affine-bookmark-content-url-icon .open-icon {
    height: 12px;
    width: 12px;
    fill: var(--affine-text-secondary-color);
  }

  .affine-bookmark-banner {
    margin: 12px 12px 0px 0px;
    width: 204px;
    max-width: 100%;
    height: 102px;
    opacity: var(--add, 1);
  }

  .affine-bookmark-banner img,
  .affine-bookmark-banner object,
  .affine-bookmark-banner svg {
    width: 204px;
    max-width: 100%;
    height: 102px;
    object-fit: cover;
    border-radius: 4px 4px var(--1, 0px) var(--1, 0px);
  }

  .affine-bookmark-card.loading {
    .affine-bookmark-content-title-text {
      color: var(--affine-placeholder-color);
    }
  }

  .affine-bookmark-card.error {
    .affine-bookmark-content-description {
      color: var(--affine-placeholder-color);
    }
  }

  .affine-bookmark-card.selected {
    .affine-bookmark-content-url > span {
      color: var(--affine-link-color);
    }
    .affine-bookmark-content-url .open-icon {
      fill: var(--affine-link-color);
    }
  }

  .affine-bookmark-card.list {
    height: ${EMBED_CARD_HEIGHT.list}px;

    .affine-bookmark-content {
      width: 100%;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    .affine-bookmark-content-title {
      width: calc(100% - 204px);
    }

    .affine-bookmark-content-url {
      width: 204px;
      justify-content: flex-end;
    }

    .affine-bookmark-content-description {
      display: none;
    }

    .affine-bookmark-banner {
      display: none;
    }
  }

  .affine-bookmark-card.vertical {
    width: ${EMBED_CARD_WIDTH.vertical}px;
    height: ${EMBED_CARD_HEIGHT.vertical}px;
    flex-direction: column-reverse;

    .affine-bookmark-content {
      width: 100%;
    }

    .affine-bookmark-content-description {
      -webkit-line-clamp: 6;
      max-height: 120px;
    }

    .affine-bookmark-content-url {
      flex-grow: 1;
      align-items: flex-end;
    }

    .affine-bookmark-banner {
      width: 340px;
      height: 170px;
      margin-left: 12px;
    }

    .affine-bookmark-banner img,
    .affine-bookmark-banner object,
    .affine-bookmark-banner svg {
      width: 340px;
      height: 170px;
    }
  }

  .affine-bookmark-card.cube {
    width: ${EMBED_CARD_WIDTH.cube}px;
    height: ${EMBED_CARD_HEIGHT.cube}px;

    .affine-bookmark-content {
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
      justify-content: space-between;
    }

    .affine-bookmark-content-title {
      flex-direction: column;
      gap: 4px;
      align-items: flex-start;
    }

    .affine-bookmark-content-title-text {
      -webkit-line-clamp: 2;
    }

    .affine-bookmark-content-description {
      display: none;
    }

    .affine-bookmark-banner {
      display: none;
    }
  }
`;
