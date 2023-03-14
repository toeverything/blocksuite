import { css } from 'lit';

export const globalCSS = css`
  :root {
    --affine-primary-color: #3a4c5c;
    --affine-font-family: Avenir Next, Poppins, apple-system, BlinkMacSystemFont,
      Helvetica Neue, Tahoma, PingFang SC, Microsoft Yahei, Arial,
      Hiragino Sans GB, sans-serif, Apple Color Emoji, Segoe UI Emoji,
      Segoe UI Symbol, Noto Color Emoji;
    --affine-font-mono: Space Mono, Consolas, Menlo, Monaco, Courier, monospace;
  }
  body {
    font-family: var(--affine-font-family);
    color: var(--affine-primary-color);
  }
`;

export const highlightCSS = css`
  pre code.hljs {
    display: block;
    overflow-x: auto;
    padding: 1em;
  }

  code.hljs {
    padding: 3px 5px;
  }

  .hljs {
    color: #000;
    background: #fff;
  }

  .hljs-addition,
  .hljs-meta,
  .hljs-string,
  .hljs-symbol,
  .hljs-template-tag,
  .hljs-template-variable {
    color: #756bb1;
  }

  .hljs-comment,
  .hljs-quote {
    color: #636363;
  }

  .hljs-bullet,
  .hljs-link,
  .hljs-literal,
  .hljs-number,
  .hljs-regexp {
    color: #31a354;
  }

  .hljs-deletion,
  .hljs-variable {
    color: #88f;
  }

  .hljs-built_in,
  .hljs-doctag,
  .hljs-keyword,
  .hljs-name,
  .hljs-section,
  .hljs-selector-class,
  .hljs-selector-id,
  .hljs-selector-tag,
  .hljs-strong,
  .hljs-tag,
  .hljs-title,
  .hljs-type {
    color: #3182bd;
  }

  .hljs-emphasis {
    font-style: italic;
  }

  .hljs-attribute {
    color: #e6550d;
  }
`;
