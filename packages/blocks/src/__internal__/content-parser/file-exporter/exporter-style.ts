import { EDITOR_WIDTH } from '@blocksuite/global/config';
import { css } from 'lit';

export const globalCSS = css`
  :root {
    --affine-editor-width: ${EDITOR_WIDTH}px;

    --affine-theme-mode: light;
    --affine-editor-mode: page;
    /* --affine-palette-transparent: special values added for the sake of logical consistency. */
    --affine-palette-transparent: #00000000;

    --affine-popover-shadow: 0px 1px 10px -6px rgba(24, 39, 75, 0.08),
      0px 3px 16px -6px rgba(24, 39, 75, 0.04);
    --affine-font-family: Avenir Next, Poppins, apple-system, BlinkMacSystemFont,
      Helvetica Neue, Tahoma, PingFang SC, Microsoft Yahei, Arial,
      Hiragino Sans GB, sans-serif, Apple Color Emoji, Segoe UI Emoji,
      Segoe UI Symbol, Noto Color Emoji;
    --affine-font-number-family: Roboto Mono, apple-system, BlinkMacSystemFont,
      Helvetica Neue, Tahoma, PingFang SC, Microsoft Yahei, Arial,
      Hiragino Sans GB, sans-serif, Apple Color Emoji, Segoe UI Emoji,
      Segoe UI Symbol, Noto Color Emoji;
    --affine-font-code-family: Space Mono, Consolas, Menlo, Monaco, Courier,
      monospace, apple-system, BlinkMacSystemFont, Helvetica Neue, Tahoma,
      PingFang SC, Microsoft Yahei, Arial, Hiragino Sans GB, sans-serif,
      Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
    --affine-font-h-1: 28px;
    --affine-font-h-2: 26px;
    --affine-font-h-3: 24px;
    --affine-font-h-4: 22px;
    --affine-font-h-5: 20px;
    --affine-font-h-6: 18px;
    --affine-font-base: 16px;
    --affine-font-sm: 14px;
    --affine-font-xs: 12px;
    --affine-line-height: calc(1em + 8px);
    --affine-z-index-modal: 1000;
    --affine-z-index-popover: 1000;
    --affine-paragraph-space: 8px;
    --affine-popover-radius: 10px;
    --affine-zoom: 1;
    --affine-scale: calc(1 / var(--affine-zoom));

    --affine-brand-color: #5438ff;
    --affine-tertiary-color: #f3f0ff;
    --affine-primary-color: #5438ff;
    --affine-secondary-color: #7d91ff;
    --affine-background-success-color: #fff;
    --affine-background-error-color: hsla(0, 0%, 100%, 0.2);
    --affine-background-processing-color: #fff;
    --affine-background-warning-color: #fff;
    --affine-background-primary-color: #fff;
    --affine-background-overlay-panel-color: #fbfbfc;
    --affine-background-secondary-color: #fbfafc;
    --affine-background-tertiary-color: #e9e9ec;
    --affine-background-code-block: #fafbfd;
    --affine-background-modal-color: rgba(0, 0, 0, 0.6);
    --affine-text-primary-color: #424149;
    --affine-text-secondary-color: #8e8d91;
    --affine-text-disable-color: #a9a9ad;
    --affine-text-emphasis-color: #5438ff;
    --affine-hover-color: rgba(0, 0, 0, 0.04);
    --affine-link-color: #7d91ff;
    --affine-quote-color: #645f82;
    --affine-icon-color: #77757d;
    --affine-icon-secondary: hsla(255, 3%, 47%, 0.6);
    --affine-border-color: #e3e2e4;
    --affine-divider-color: #e3e2e4;
    --affine-placeholder-color: #c0bfc1;
    --affine-edgeless-grid-color: #e6e6e6;
    --affine-success-color: #10cb86;
    --affine-warning-color: #ff631f;
    --affine-error-color: #eb4335;
    --affine-processing-color: #2776ff;
    --affine-black-10: rgba(0, 0, 0, 0.1);
    --affine-black-30: rgba(0, 0, 0, 0.3);
    --affine-black-50: rgba(0, 0, 0, 0.5);
    --affine-black-60: rgba(0, 0, 0, 0.6);
    --affine-black-80: rgba(0, 0, 0, 0.8);
    --affine-black-90: rgba(0, 0, 0, 0.9);
    --affine-black: #000;
    --affine-white-10: hsla(0, 0%, 100%, 0.1);
    --affine-white-30: hsla(0, 0%, 100%, 0.3);
    --affine-white-50: hsla(0, 0%, 100%, 0.5);
    --affine-white-60: hsla(0, 0%, 100%, 0.6);
    --affine-white-80: hsla(0, 0%, 100%, 0.8);
    --affine-white-90: hsla(0, 0%, 100%, 0.9);
    --affine-white: #fff;
    --affine-tag-white: #f5f5f5;
    --affine-tag-gray: #e3e2e0;
    --affine-tag-red: #ffe1e1;
    --affine-tag-orange: #ffeaca;
    --affine-tag-yellow: #fff4d8;
    --affine-tag-green: #dff4e8;
    --affine-tag-teal: #dff4f3;
    --affine-tag-blue: #e1efff;
    --affine-tag-purple: #f3f0ff;
    --affine-tag-pink: #fce8ff;
    --affine-palette-line-yellow: #3874ff;
    --affine-palette-line-orange: #ffaf38;
    --affine-palette-line-tangerine: #ff631f;
    --affine-palette-line-red: #fc3f55;
    --affine-palette-line-magenta: #ff38b3;
    --affine-palette-line-purple: #b638ff;
    --affine-palette-line-navy: #3b25cc;
    --affine-palette-line-blue: #4f90ff;
    --affine-palette-line-green: #10cb86;
    --affine-palette-line-white: #fff;
    --affine-palette-line-black: #000;
    --affine-palette-line-grey: #999;
    --affine-palette-shape-yellow: #fff188;
    --affine-palette-shape-orange: #ffcf88;
    --affine-palette-shape-tangerine: #ffa179;
    --affine-palette-shape-red: #fd8c99;
    --affine-palette-shape-magenta: #ff88d1;
    --affine-palette-shape-purple: #d388ff;
    --affine-palette-shape-navy: #897ce0;
    --affine-palette-shape-blue: #95bcff;
    --affine-palette-shape-green: #70e0b6;
    --affine-palette-shape-white: #fff;
    --affine-palette-shape-black: #000;
    --affine-palette-shape-grey: #c2c2c2;
    --affine-tooltip: #424149;
    --affine-shadow-1: 0px 0px 4px 0px rgba(66, 65, 73, 0.14);
    --affine-card-background-blue: linear-gradient(
      180deg,
      #f0f3fd 0%,
      #fcfcfd 100%
    );
    --affine-background-secondary-color: rgba(244, 244, 245, 1);
  }
  body {
    font-family: var(--affine-font-family);
    color: var(--affine-text-primary-color);
  }

  .affine-bookmark-block-container {
    width: 100%;
    margin-top: 18px;
    margin-bottom: 18px;
    position: relative;
  }
  .affine-bookmark-block-container .affine-bookmark-link {
    height: 74px;
    box-shadow: var(--affine-shadow-1);
    background: var(--affine-card-background-blue);
    border: 3px solid var(--affine-background-secondary-color);
    border-radius: 12px;
    padding: 16px 24px;
    display: flex;
    cursor: pointer;
    text-decoration: none;
    color: var(--affine-text-primary-color);
    overflow: hidden;
    line-height: calc(1em + 4px);
    position: relative;
  }
  .affine-bookmark-block-container .affine-bookmark-banner {
    width: 140px;
    height: 93px;
    margin-left: 20px;
    border-radius: 8px 8px 0 0;
    overflow: hidden;
    flex-shrink: 0;
  }
  .affine-bookmark-block-container .affine-bookmark-banner img,
  .affine-bookmark-block-container .affine-bookmark-banner svg {
    width: 140px;
    height: 93px;
    object-fit: cover;
  }
  .affine-bookmark-block-container .affine-bookmark-content-wrapper {
    flex-grow: 1;
    overflow: hidden;
  }
  .affine-bookmark-block-container .affine-bookmark-title {
    height: 18px;
    display: flex;
    align-items: center;
    font-size: var(--affine-font-sm);
    font-weight: 600;
  }
  .affine-bookmark-block-container .affine-bookmark-title-content {
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-left: 8px;
  }
  .affine-bookmark-block-container .affine-bookmark-icon {
    width: 18px;
    height: 18px;
    color: var(--affine-text-secondary-color);
    flex-shrink: 0;
  }
  .affine-bookmark-block-container .affine-bookmark-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .affine-bookmark-block-container .affine-bookmark-description {
    height: 32px;
    line-height: 16px;
    margin-top: 4px;
    font-size: var(--affine-font-xs);

    display: -webkit-box;
    word-break: break-all;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .affine-bookmark-block-container .affine-bookmark-url {
    font-size: var(--affine-font-xs);
    color: var(--affine-text-secondary-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 2px;
  }
  .affine-bookmark-block-container .affine-bookmark-caption {
    width: 100%;
    font-size: var(--affine-font-sm);
    outline: none;
    border: 0;
    font-family: inherit;
    text-align: center;
    color: var(--affine-icon-color);
    background: var(--affine-background-primary-color);
  }
  .affine-bookmark-block-container .affine-bookmark-caption::placeholder {
    color: var(--affine-placeholder-color);
  }
  .affine-bookmark-block-container .affine-bookmark-caption.caption-show {
    display: inline-block;
  }

  .page-meta-data {
    padding: 10px 12px 24px;
    margin: 0 -24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: var(--affine-hover-color-filled);
    border-radius: 8px;
  }

  .page-meta-data .meta-data-expanded-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 12px;
    font-weight: 600;
    font-size: 14px;
    color: var(--affine-text-secondary-color);
    border-radius: 4px;
    cursor: pointer;
  }

  .page-meta-data .meta-data-expanded-item {
    display: flex;
    gap: 8px;
  }

  .page-meta-data .meta-data-expanded-item .type {
    display: flex;
    align-items: center;
  }

  .page-meta-data .meta-data-expanded-item .type svg {
    fill: var(--affine-icon-color);
  }

  .page-meta-data .meta-data-expanded-item .value {
    flex: 1;
  }

  .page-meta-data .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .page-meta-data .tag {
    padding: 4px 10px;
    border-radius: 8px;
    color: var(--affine-text-primary-color);
    font-size: 13px;
    line-height: 13px;
    display: flex;
    align-items: center;
    font-weight: 400;
    cursor: pointer;
  }
`;
