import type { GroupElementModel } from '../../../element-model/group.js';

import { FontFamily, FontWeight } from '../../../consts.js';
import { Bound } from '../../../utils/bound.js';
import {
  getFontString,
  getLineHeight,
  getLineWidth,
  truncateTextByWidth,
} from '../text/utils.js';

const TITLE_FONT = FontFamily.Inter;
const TITLE_FONT_SIZE = 16;
const TITLE_PADDING = [10, 4];

export function titleRenderParams(group: GroupElementModel, zoom: number) {
  let text = group.title.toJSON();
  const font = getGroupTitleFont(zoom);
  const lineWidth = getLineWidth(text, font);
  const lineHeight = getLineHeight(
    TITLE_FONT,
    TITLE_FONT_SIZE / zoom,
    'normal'
  );
  const bound = group.elementBound;
  const padding = [
    Math.min(TITLE_PADDING[0] / zoom, TITLE_PADDING[0]),
    Math.min(TITLE_PADDING[1] / zoom, TITLE_PADDING[1]),
  ];
  const offset = Math.max(4 / zoom, 2);
  const radius = Math.min(4, lineHeight / 2);

  let titleWidth = lineWidth + padding[0] * 2;
  const titleHeight = lineHeight + padding[1] * 2 + offset;

  if (titleWidth > bound.w) {
    text = truncateTextByWidth(text, font, bound.w - 10);
    text = text.slice(0, text.length - 1) + '..';
    titleWidth = bound.w;
  }

  return {
    bound,
    font,
    lineHeight,
    offset,
    padding,
    radius,
    text,
    titleBound: new Bound(
      bound.x,
      bound.y - titleHeight,
      titleWidth,
      titleHeight
    ),
    titleHeight,
    titleWidth,
  };
}

export function titleBound(group: GroupElementModel, zoom: number) {
  const { bound, titleHeight, titleWidth } = titleRenderParams(group, zoom);

  return new Bound(bound.x, bound.y - titleHeight, titleWidth, titleHeight);
}

function getGroupTitleFont(zoom: number) {
  const fontSize = 16 / zoom;
  const font = getFontString({
    fontFamily: TITLE_FONT,
    fontSize,
    fontStyle: 'normal',
    fontWeight: FontWeight.Regular,
  });

  return font;
}
