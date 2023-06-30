export function getArrowPoints(
  [startX, startY]: number[],
  [endX, endY]: number[],
  arrowSize = 10
) {
  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx);
  const oneSide = [
    endX - arrowSize * Math.cos(angle - Math.PI / 10),
    endY - arrowSize * Math.sin(angle - Math.PI / 10),
  ];
  const anotherSide = [
    endX - arrowSize * Math.cos(angle + Math.PI / 10),
    endY - arrowSize * Math.sin(angle + Math.PI / 10),
  ];
  return {
    sides: [oneSide, anotherSide],
    start: [startX, startY],
    end: [endX, endY],
  };
}
