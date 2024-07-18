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
  try {
    return JSON.parse(xywh) as XYWH;
  } catch (e) {
    console.error('Failed to deserialize xywh', xywh);
    console.error(e);

    return [0, 0, 0, 0];
  }
}
