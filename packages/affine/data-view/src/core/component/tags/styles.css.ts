import { baseTheme } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const tagSelectContainerStyle = style({
  position: 'absolute',
  zIndex: 2,
  color: cssVarV2('text/primary'),
  border: `0.5px solid ${cssVarV2('layer/insideBorder/blackBorder')}`,
  borderRadius: '8px',
  backgroundColor: cssVarV2.layer.background.overlayPanel,
  boxShadow: 'var(--affine-shadow-1)',
  fontFamily: 'var(--affine-font-family)',
  maxWidth: '400px',
  padding: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  '@media': {
    print: {
      display: 'none',
    },
  },
});

export const tagSelectInputContainerStyle = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '6px',
  padding: '4px',
});

export const tagSelectInputStyle = style({
  flex: '1 1 0',
  border: 'none',
  fontFamily: baseTheme.fontSansFamily,
  color: cssVarV2('text/primary'),
  backgroundColor: 'transparent',
  lineHeight: '22px',
  fontSize: '14px',
  outline: 'none',
  '::placeholder': {
    color: 'var(--affine-placeholder-color)',
  },
});

export const selectOptionsTipsStyle = style({
  padding: '4px',
  color: cssVarV2('text/secondary'),
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '22px',
  userSelect: 'none',
});

export const selectOptionsContainerStyle = style({
  maxHeight: '400px',
  overflowY: 'auto',
  userSelect: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

export const selectOptionStyle = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 4px 4px 0',
  borderRadius: '4px',
  cursor: 'pointer',
});

export const selectedStyle = style({
  background: cssVarV2('layer/background/hoverOverlay'),
});

export const tagContainerStyle = style({
  display: 'flex',
  alignItems: 'center',
  padding: '0 8px',
  gap: '4px',
  borderRadius: '4px',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  border: `1px solid ${cssVarV2('database/border')}`,
  userSelect: 'none',
});

export const tagTextStyle = style({
  fontSize: '14px',
  lineHeight: '22px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const tagDeleteIconStyle = style({
  display: 'flex',
  alignItems: 'center',
  color: cssVarV2('chip/label/text'),
});

export const selectOptionContentStyle = style({
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden',
});

export const selectOptionIconStyle = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '20px',
  borderRadius: '4px',
  cursor: 'pointer',
  visibility: 'hidden',
  color: cssVarV2('icon/primary'),
  marginLeft: '4px',
  ':hover': {
    background: cssVarV2('layer/background/hoverOverlay'),
  },
  selectors: {
    [`${selectedStyle} &`]: {
      visibility: 'visible',
    },
  },
});

export const selectOptionDragHandlerStyle = style({
  width: '4px',
  height: '12px',
  borderRadius: '1px',
  backgroundColor: cssVarV2('button/grabber/default'),
  marginRight: '4px',
  cursor: '-webkit-grab',
  flexShrink: 0,
});

export const selectOptionNewIconStyle = style({
  fontSize: '14px',
  lineHeight: '22px',
  color: cssVarV2('text/primary'),
  marginRight: '8px',
  marginLeft: '4px',
});
