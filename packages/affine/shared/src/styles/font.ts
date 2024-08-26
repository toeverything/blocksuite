import { baseTheme } from '@toeverything/theme';
import { unsafeCSS } from 'lit';

export const FONT_BASE = unsafeCSS(`
  font-family: ${baseTheme.fontSansFamily};
  font-feature-settings:
    'clig' off,
    'liga' off;
  font-style: normal;
`);

export const FONT_SM = unsafeCSS(`
  ${FONT_BASE};
  font-size: var(--affine-font-sm);
  font-weight: 500;
  line-height: 22px;
`);

export const FONT_XS = unsafeCSS(`
  ${FONT_BASE};
  font-size: var(--affine-font-xs);
  font-weight: 500;
  line-height: 20px;
`);
