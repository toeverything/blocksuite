export type XYWH = [number, number, number, number];

export type SerializedXYWH = `[${number},${number},${number},${number}]`;

export function serializeXYWH(
  x: number,
  y: number,
  w: number,
  h: number
): SerializedXYWH {
  return `[${x},${y},${w},${h}]`;
}

export function deserializeXYWH(xywh: string): XYWH {
  return JSON.parse(xywh) as XYWH;
}
