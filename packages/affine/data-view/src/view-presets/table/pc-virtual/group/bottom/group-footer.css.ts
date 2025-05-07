import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const groupFooter = style({
  display: 'block',
});
export const addRowWrapper = style({
  display: 'flex',
  width: '100%',
  height: '28px',
  position: 'relative',
  zIndex: 0,
  cursor: 'pointer',
  transition: 'opacity 0.2s ease-in-out',
  padding: '4px 8px',
  borderBottom: `1px solid ${cssVarV2.database.border}`,
});

export const addRowButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  position: 'sticky',
  left: '8px',
});

export const addRowText = style({
  userSelect: 'none',
  fontSize: '12px',
  lineHeight: '20px',
  color: cssVarV2.text.secondary,
});
