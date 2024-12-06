import { cssVarV2 } from '@toeverything/theme/v2';
import { unsafeCSS } from 'lit';

import { FONT_SM } from './font.js';

export const PANEL_BASE_COLORS = unsafeCSS(`
  color: var(--affine-icon-color);
  box-shadow: var(--affine-overlay-shadow);
  background: ${cssVarV2('layer/background/overlayPanel')};
`);

export const PANEL_BASE = unsafeCSS(`
  display: flex;
  align-items: center;
  gap: 8px;
  width: max-content;
  padding: 0 6px;
  border-radius: 4px;
  border: 0.5px solid ${cssVarV2('layer/insideBorder/border')};

  ${PANEL_BASE_COLORS};
  ${FONT_SM};
`);
