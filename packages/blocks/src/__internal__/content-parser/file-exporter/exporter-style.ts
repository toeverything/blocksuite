import { css } from 'lit';

export const globalCSS = css`
  :root {
    --affine-theme-mode: light;
    --affine-editor-mode: page;

    --affine-popover-shadow: 0px 0px 12px rgba(66, 65, 73, 0.14);
    --affine-font-h1: 28px;
    --affine-font-h2: 26px;
    --affine-font-h3: 24px;
    --affine-font-h4: 22px;
    --affine-font-h5: 20px;
    --affine-font-h6: 18px;
    --affine-font-base: 16px;
    --affine-font-sm: 14px;
    --affine-font-xs: 12px;
    --affine-line-height: calc(1em + 8px);
    --affine-z-index-modal: 1000;
    --affine-z-index-popover: 100;
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
    --affine-paragraph-space: 8px;
    --affine-popover-radius: 10px;
    --affine-editor-width: 720px;

    --affine-zoom: 1;
    --affine-scale: calc(1 / var(--affine-zoom));

    --affine-brand-color: rgb(84, 56, 255);
    --affine-tertiary-color: rgb(243, 240, 255);
    --affine-primary-color: rgb(84, 56, 255);
    --affine-secondary-color: rgb(125, 145, 255);
    --affine-background-success-color: rgb(255, 255, 255);
    --affine-background-error-color: rgba(255, 255, 255, 0.2);
    --affine-background-processing-color: rgb(255, 255, 255);
    --affine-background-warning-color: rgb(255, 255, 255);
    --affine-background-primary-color: rgb(255, 255, 255);
    --affine-background-overlay-panel-color: rgb(251, 251, 252);
    --affine-background-secondary-color: rgb(251, 250, 252);
    --affine-background-tertiary-color: rgb(233, 233, 236);
    --affine-background-code-block: rgb(250, 251, 253);
    --affine-background-modal-color: rgba(0, 0, 0, 0.6);
    --affine-text-primary-color: rgb(66, 65, 73);
    --affine-text-secondary-color: rgb(142, 141, 145);
    --affine-text-disable-color: rgb(169, 169, 173);
    --affine-text-emphasis-color: rgb(84, 56, 255);
    --affine-hover-color: rgba(0, 0, 0, 0.04);
    --affine-link-color: rgb(125, 145, 255);
    --affine-quote-color: rgb(100, 95, 130);
    --affine-icon-color: rgb(119, 117, 125);
    --affine-icon-secondary: rgba(119, 117, 125, 0.6);
    --affine-border-color: rgb(227, 226, 228);
    --affine-divider-color: rgb(227, 226, 228);
    --affine-placeholder-color: rgb(192, 191, 193);
    --affine-edgeless-grid-color: rgb(230, 230, 230);
    --affine-success-color: rgb(16, 203, 134);
    --affine-warning-color: rgb(255, 99, 31);
    --affine-error-color: rgb(235, 67, 53);
    --affine-processing-color: rgb(39, 118, 255);
    --affine-black-10: rgba(0, 0, 0, 0.1);
    --affine-black-30: rgba(0, 0, 0, 0.3);
    --affine-black-50: rgba(0, 0, 0, 0.5);
    --affine-black-60: rgba(0, 0, 0, 0.6);
    --affine-black-80: rgba(0, 0, 0, 0.8);
    --affine-black-90: rgba(0, 0, 0, 0.9);
    --affine-black: rgb(0, 0, 0);
    --affine-white-10: rgba(255, 255, 255, 0.1);
    --affine-white-30: rgba(255, 255, 255, 0.3);
    --affine-white-50: rgba(255, 255, 255, 0.5);
    --affine-white-60: rgba(255, 255, 255, 0.6);
    --affine-white-80: rgba(255, 255, 255, 0.8);
    --affine-white-90: rgba(255, 255, 255, 0.9);
    --affine-white: rgb(255, 255, 255);
    --affine-tag-white: rgb(245, 245, 245);
    --affine-tag-gray: rgb(227, 226, 224);
    --affine-tag-red: rgb(255, 225, 225);
    --affine-tag-orange: rgb(255, 234, 202);
    --affine-tag-yellow: rgb(255, 244, 216);
    --affine-tag-green: rgb(223, 244, 232);
    --affine-tag-teal: rgb(223, 244, 243);
    --affine-tag-blue: rgb(225, 239, 255);
    --affine-tag-purple: rgb(243, 240, 255);
    --affine-tag-pink: rgb(252, 232, 255);
    --affine-palette-yellow: rgb(255, 232, 56);
    --affine-palette-orange: rgb(255, 175, 56);
    --affine-palette-tangerine: rgb(255, 99, 31);
    --affine-palette-red: rgb(252, 63, 85);
    --affine-palette-magenta: rgb(255, 56, 179);
    --affine-palette-purple: rgb(182, 56, 255);
    --affine-palette-navy: rgb(59, 37, 204);
    --affine-palette-blue: rgb(79, 144, 255);
    --affine-palette-green: rgb(16, 203, 134);
    --affine-palette-grey: rgb(153, 153, 153);
    --affine-palette-white: rgb(255, 255, 255);
    --affine-palette-black: rgb(0, 0, 0);
  }
  body {
    font-family: var(--affine-font-family);
    color: var(--affine-text-primary-color);
  }
`;
