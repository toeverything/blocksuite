import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';

export const FONT_BASE = css`
  font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
  font-feature-settings:
    'clig' off,
    'liga' off;
  font-style: normal;
`;

// 12px
export const FONT_XS = css`
  ${FONT_BASE}
  font-size: var(--affine-font-xs);
  font-weight: 500;
  line-height: 20px;
`;

// 14px
export const FONT_SM = css`
  ${FONT_BASE}
  font-size: var(--affine-font-sm);
  font-weight: 400;
  line-height: 22px;
`;

export const PANEL_BASE_COLORS = css`
  color: var(--affine-icon-color);
  background: var(--affine-background-overlay-panel-color);
  box-shadow: var(--affine-shadow-4);
`;

export const PANEL_BASE = css`
  display: flex;
  align-items: center;
  gap: 8px;
  width: max-content;
  padding: 0 6px;
  border-radius: 4px;
  border: 0.5px solid var(--affine-border-color);

  ${PANEL_BASE_COLORS}

  ${FONT_SM}
`;
