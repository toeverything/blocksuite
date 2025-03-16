import type { DndClientRect, SortingStrategy } from '../../types.js';

const defaultScale = {
  scaleX: 1,
  scaleY: 1,
};

export const verticalListSortingStrategy: SortingStrategy = ({
  activeIndex,
  activeNodeRect: fallbackActiveRect,
  rects,
  overIndex,
}) => {
  const activeNodeRect = rects[activeIndex] ?? fallbackActiveRect;
  if (!activeNodeRect) return [];
  const strategy = (index: number) => {
    if (index === activeIndex) {
      const overIndexRect = rects[overIndex];

      if (!overIndexRect) {
        return undefined;
      }

      return {
        x: 0,
        y:
          activeIndex < overIndex
            ? overIndexRect.top +
              overIndexRect.height -
              (activeNodeRect.top + activeNodeRect.height)
            : overIndexRect.top - activeNodeRect.top,
        ...defaultScale,
      };
    }

    const itemGap = getItemGap(rects, index, activeIndex);

    if (index > activeIndex && index <= overIndex) {
      return {
        x: 0,
        y: -activeNodeRect.height - itemGap,
        ...defaultScale,
      };
    }

    if (index < activeIndex && index >= overIndex) {
      return {
        x: 0,
        y: activeNodeRect.height + itemGap,
        ...defaultScale,
      };
    }

    return {
      x: 0,
      y: 0,
      ...defaultScale,
    };
  };
  return rects.map((_, index) => strategy(index));
};

function getItemGap(
  clientRects: DndClientRect[],
  index: number,
  activeIndex: number
) {
  const currentRect: DndClientRect | undefined = clientRects[index];
  const previousRect: DndClientRect | undefined = clientRects[index - 1];
  const nextRect: DndClientRect | undefined = clientRects[index + 1];

  if (!currentRect) {
    return 0;
  }

  if (activeIndex < index) {
    return previousRect
      ? currentRect.top - (previousRect.top + previousRect.height)
      : nextRect
        ? nextRect.top - (currentRect.top + currentRect.height)
        : 0;
  }

  return nextRect
    ? nextRect.top - (currentRect.top + currentRect.height)
    : previousRect
      ? currentRect.top - (previousRect.top + previousRect.height)
      : 0;
}
