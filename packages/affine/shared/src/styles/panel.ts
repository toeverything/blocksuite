import { unsafeCSS } from 'lit';

import { FONT_SM } from './font.js';

export const PANEL_BASE_COLORS = unsafeCSS(`
  color: var(--affine-icon-color);
  background: var(--affine-background-overlay-panel-color);
  box-shadow: var(--affine-overlay-shadow);
`);

export const PANEL_BASE = unsafeCSS(`
  display: flex;
  align-items: center;
  gap: 8px;
  width: max-content;
  padding: 0 6px;
  border-radius: 4px;
  border: 0.5px solid var(--affine-border-color);

  ${PANEL_BASE_COLORS};
  ${FONT_SM};
`);
