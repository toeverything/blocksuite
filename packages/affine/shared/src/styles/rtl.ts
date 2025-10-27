import { css } from 'lit';

/**
 * RTL CSS utilities for BlockSuite
 * Provides CSS classes and utilities for RTL support
 */

/**
 * RTL-aware text alignment utilities
 */
export const rtlTextAlignStyles = css`
  .rtl-text-left {
    text-align: left;
  }

  .rtl-text-right {
    text-align: right;
  }

  .rtl-text-center {
    text-align: center;
  }

  .rtl-text-justify {
    text-align: justify;
  }

  /* RTL-specific overrides */
  [dir='rtl'] .rtl-text-left {
    text-align: right;
  }

  [dir='rtl'] .rtl-text-right {
    text-align: left;
  }

  [dir='rtl'] .rtl-text-center {
    text-align: center;
  }

  [dir='rtl'] .rtl-text-justify {
    text-align: justify;
  }
`;

/**
 * RTL-aware margin utilities
 */
export const rtlMarginStyles = css`
  .rtl-ml-auto {
    margin-left: auto;
  }

  .rtl-mr-auto {
    margin-right: auto;
  }

  .rtl-mx-auto {
    margin-left: auto;
    margin-right: auto;
  }

  /* RTL-specific overrides */
  [dir='rtl'] .rtl-ml-auto {
    margin-left: 0;
    margin-right: auto;
  }

  [dir='rtl'] .rtl-mr-auto {
    margin-right: 0;
    margin-left: auto;
  }

  [dir='rtl'] .rtl-mx-auto {
    margin-left: auto;
    margin-right: auto;
  }
`;

/**
 * RTL-aware padding utilities
 */
export const rtlPaddingStyles = css`
  .rtl-pl-0 {
    padding-left: 0;
  }

  .rtl-pr-0 {
    padding-right: 0;
  }

  .rtl-px-0 {
    padding-left: 0;
    padding-right: 0;
  }

  .rtl-pl-1 {
    padding-left: 4px;
  }

  .rtl-pr-1 {
    padding-right: 4px;
  }

  .rtl-px-1 {
    padding-left: 4px;
    padding-right: 4px;
  }

  .rtl-pl-2 {
    padding-left: 8px;
  }

  .rtl-pr-2 {
    padding-right: 8px;
  }

  .rtl-px-2 {
    padding-left: 8px;
    padding-right: 8px;
  }

  .rtl-pl-3 {
    padding-left: 12px;
  }

  .rtl-pr-3 {
    padding-right: 12px;
  }

  .rtl-px-3 {
    padding-left: 12px;
    padding-right: 12px;
  }

  .rtl-pl-4 {
    padding-left: 16px;
  }

  .rtl-pr-4 {
    padding-right: 16px;
  }

  .rtl-px-4 {
    padding-left: 16px;
    padding-right: 16px;
  }

  /* RTL-specific overrides */
  [dir='rtl'] .rtl-pl-0 {
    padding-left: 0;
    padding-right: 0;
  }

  [dir='rtl'] .rtl-pr-0 {
    padding-right: 0;
    padding-left: 0;
  }

  [dir='rtl'] .rtl-px-0 {
    padding-left: 0;
    padding-right: 0;
  }

  [dir='rtl'] .rtl-pl-1 {
    padding-left: 0;
    padding-right: 4px;
  }

  [dir='rtl'] .rtl-pr-1 {
    padding-right: 0;
    padding-left: 4px;
  }

  [dir='rtl'] .rtl-px-1 {
    padding-left: 4px;
    padding-right: 4px;
  }

  [dir='rtl'] .rtl-pl-2 {
    padding-left: 0;
    padding-right: 8px;
  }

  [dir='rtl'] .rtl-pr-2 {
    padding-right: 0;
    padding-left: 8px;
  }

  [dir='rtl'] .rtl-px-2 {
    padding-left: 8px;
    padding-right: 8px;
  }

  [dir='rtl'] .rtl-pl-3 {
    padding-left: 0;
    padding-right: 12px;
  }

  [dir='rtl'] .rtl-pr-3 {
    padding-right: 0;
    padding-left: 12px;
  }

  [dir='rtl'] .rtl-px-3 {
    padding-left: 12px;
    padding-right: 12px;
  }

  [dir='rtl'] .rtl-pl-4 {
    padding-left: 0;
    padding-right: 16px;
  }

  [dir='rtl'] .rtl-pr-4 {
    padding-right: 0;
    padding-left: 16px;
  }

  [dir='rtl'] .rtl-px-4 {
    padding-left: 16px;
    padding-right: 16px;
  }
`;

/**
 * RTL-aware border utilities
 */
export const rtlBorderStyles = css`
  .rtl-border-l {
    border-left: 1px solid var(--affine-border-color);
  }

  .rtl-border-r {
    border-right: 1px solid var(--affine-border-color);
  }

  .rtl-border-x {
    border-left: 1px solid var(--affine-border-color);
    border-right: 1px solid var(--affine-border-color);
  }

  /* RTL-specific overrides */
  [dir='rtl'] .rtl-border-l {
    border-left: none;
    border-right: 1px solid var(--affine-border-color);
  }

  [dir='rtl'] .rtl-border-r {
    border-right: none;
    border-left: 1px solid var(--affine-border-color);
  }

  [dir='rtl'] .rtl-border-x {
    border-left: 1px solid var(--affine-border-color);
    border-right: 1px solid var(--affine-border-color);
  }
`;

/**
 * RTL-aware positioning utilities
 */
export const rtlPositionStyles = css`
  .rtl-left-0 {
    left: 0;
  }

  .rtl-right-0 {
    right: 0;
  }

  .rtl-inset-x-0 {
    left: 0;
    right: 0;
  }

  /* RTL-specific overrides */
  [dir='rtl'] .rtl-left-0 {
    left: auto;
    right: 0;
  }

  [dir='rtl'] .rtl-right-0 {
    right: auto;
    left: 0;
  }

  [dir='rtl'] .rtl-inset-x-0 {
    left: 0;
    right: 0;
  }
`;

/**
 * RTL-aware flexbox utilities
 */
export const rtlFlexStyles = css`
  .rtl-flex-row {
    flex-direction: row;
  }

  .rtl-flex-row-reverse {
    flex-direction: row-reverse;
  }

  .rtl-justify-start {
    justify-content: flex-start;
  }

  .rtl-justify-end {
    justify-content: flex-end;
  }

  .rtl-justify-center {
    justify-content: center;
  }

  .rtl-justify-between {
    justify-content: space-between;
  }

  .rtl-items-start {
    align-items: flex-start;
  }

  .rtl-items-end {
    align-items: flex-end;
  }

  .rtl-items-center {
    align-items: center;
  }

  /* RTL-specific overrides */
  [dir='rtl'] .rtl-flex-row {
    flex-direction: row-reverse;
  }

  [dir='rtl'] .rtl-flex-row-reverse {
    flex-direction: row;
  }

  [dir='rtl'] .rtl-justify-start {
    justify-content: flex-end;
  }

  [dir='rtl'] .rtl-justify-end {
    justify-content: flex-start;
  }

  [dir='rtl'] .rtl-justify-center {
    justify-content: center;
  }

  [dir='rtl'] .rtl-justify-between {
    justify-content: space-between;
  }
`;

/**
 * RTL-aware text direction utilities
 */
export const rtlDirectionStyles = css`
  .rtl-dir-ltr {
    direction: ltr;
  }

  .rtl-dir-rtl {
    direction: rtl;
  }

  .rtl-dir-auto {
    direction: auto;
  }
`;

/**
 * RTL-aware text overflow utilities
 */
export const rtlTextOverflowStyles = css`
  .rtl-text-ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rtl-text-ellipsis-start {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    direction: rtl;
    text-align: right;
  }

  .rtl-text-ellipsis-end {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    direction: ltr;
    text-align: left;
  }
`;

/**
 * Combined RTL styles
 */
export const rtlStyles = css`
  ${rtlTextAlignStyles}
  ${rtlMarginStyles}
  ${rtlPaddingStyles}
  ${rtlBorderStyles}
  ${rtlPositionStyles}
  ${rtlFlexStyles}
  ${rtlDirectionStyles}
  ${rtlTextOverflowStyles}
`;

/**
 * RTL CSS variables
 */
export const rtlCSSVariables = css`
  :root {
    /* RTL spacing variables */
    --rtl-spacing-xs: 2px;
    --rtl-spacing-sm: 4px;
    --rtl-spacing-md: 8px;
    --rtl-spacing-lg: 12px;
    --rtl-spacing-xl: 16px;
    --rtl-spacing-2xl: 24px;
    --rtl-spacing-3xl: 32px;

    /* RTL border radius variables */
    --rtl-border-radius-sm: 2px;
    --rtl-border-radius-md: 4px;
    --rtl-border-radius-lg: 8px;
    --rtl-border-radius-xl: 12px;

    /* RTL shadow variables */
    --rtl-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --rtl-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --rtl-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  /* RTL-specific CSS variables */
  [dir='rtl'] {
    --rtl-mirror-scale-x: -1;
  }

  [dir='ltr'] {
    --rtl-mirror-scale-x: 1;
  }
`;
