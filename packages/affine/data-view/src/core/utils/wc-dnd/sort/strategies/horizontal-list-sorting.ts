import type { DndClientRect, SortingStrategy } from '../../types.js';

const defaultScale = {
  scaleX: 1,
  scaleY: 1,
};

export const horizontalListSortingStrategy: SortingStrategy = ({
  rects,
  activeNodeRect: fallbackActiveRect,
  activeIndex,
  overIndex,
}) => {
  const activeNodeRect = rects[activeIndex] ?? fallbackActiveRect;
  if (!activeNodeRect) return [];
  const strategy = (index: number) => {
    const itemGap = getItemGap(rects, index, activeIndex);

    if (index === activeIndex) {
      const newIndexRect = rects[overIndex];

      if (!newIndexRect) {
        return;
      }

      return {
        x:
          activeIndex < overIndex
            ? newIndexRect.left +
              newIndexRect.width -
              (activeNodeRect.left + activeNodeRect.width)
            : newIndexRect.left - activeNodeRect.left,
        y: 0,
        ...defaultScale,
      };
    }

    if (index > activeIndex && index <= overIndex) {
      return {
        x: -activeNodeRect.width - itemGap,
        y: 0,
        ...defaultScale,
      };
    }

    if (index < activeIndex && index >= overIndex) {
      return {
        x: activeNodeRect.width + itemGap,
        y: 0,
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
  rects: DndClientRect[],
  index: number,
  activeIndex: number
) {
  const currentRect: DndClientRect | undefined = rects[index];
  const previousRect: DndClientRect | undefined = rects[index - 1];
  const nextRect: DndClientRect | undefined = rects[index + 1];

  if (!currentRect || (!previousRect && !nextRect)) {
    return 0;
  }

  if (activeIndex < index) {
    if (previousRect) {
      return currentRect.left - (previousRect.left + previousRect.width);
    }
    if (nextRect) {
      return nextRect.left - (currentRect.left + currentRect.width);
    }
    return 0;
  }

  if (nextRect) {
    return nextRect.left - (currentRect.left + currentRect.width);
  }

  if (previousRect) {
    return currentRect.left - (previousRect.left + previousRect.width);
  }

  return 0;
}
