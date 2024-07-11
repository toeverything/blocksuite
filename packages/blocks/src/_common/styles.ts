import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';

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

  font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
  font-feature-settings:
    'clig' off,
    'liga' off;
  font-size: var(--affine-font-sm);
  font-style: normal;
  font-weight: 500;
  line-height: 22px;

  ${PANEL_BASE_COLORS}
`;

export const INPUT_FONT_BASE = css`
  font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
  font-feature-settings:
    'clig' off,
    'liga' off;
  font-size: var(--affine-font-xs);
  font-style: normal;
  font-weight: 500;
  line-height: 20px;
`;
