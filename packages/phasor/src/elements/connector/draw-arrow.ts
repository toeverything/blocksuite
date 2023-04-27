export function drawArrow(
  path: Path2D,
  [startX, startY]: number[],
  [endX, endY]: number[],
  arrowSize = 100
) {
  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx);
  const headLength = Math.sqrt(arrowSize);

  path.moveTo(
    endX - headLength * Math.cos(angle - Math.PI / 4),
    endY - headLength * Math.sin(angle - Math.PI / 4)
  );
  path.lineTo(endX, endY);
  path.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 4),
    endY - headLength * Math.sin(angle + Math.PI / 4)
  );
}
