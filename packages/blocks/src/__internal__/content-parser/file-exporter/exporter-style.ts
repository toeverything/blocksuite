import { lightCssVariables } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';

import { NOTE_WIDTH } from '../../consts.js';

const quoteCSSContent = `
  .quote {
    line-height: 26px;
    padding-left: 17px;
    margin-top: var(--affine-paragraph-space);
    padding-top: 10px;
    padding-bottom: 10px;
    position: relative;
    white-space: pre-wrap;
  }
`;

const quotePseudoElementContent = `
  .quote::after {
    content: '';
    width: 2px;
    height: calc(100% - 20px);
    margin-top: 10px;
    margin-bottom: 10px;
    position: absolute;
    left: 0;
    top: 0;
    background: var(--affine-quote-color);
    border-radius: 18px;
  }
`;

const cssVariables = Object.keys(lightCssVariables)
  .map(
    key => key + ': ' + (lightCssVariables as { [key: string]: string })[key]
  )
  .join(';\n');

export const globalCSS = css`
  :root {
    --affine-editor-width: ${NOTE_WIDTH}px;

    ${unsafeCSS(cssVariables)}
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

  blockquote {
    margin-inline-start: 0;
  }

  ${unsafeCSS(quoteCSSContent)}
  ${unsafeCSS(quotePseudoElementContent)}

  ul {
    padding-inline-start: 1rem;
  }
  li {
    padding-inline-start: 1rem;
  }

  .shiki {
    font-size: var(--affine-font-sm);
    line-height: var(--affine-line-height);
    position: relative;
    padding: 32px 0px 12px 60px;
    background: var(--affine-background-code-block);
    border-radius: 10px;
    margin-top: 24px;
    margin-bottom: 24px;
  }
`;
