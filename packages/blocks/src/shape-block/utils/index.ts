// eslint-disable-next-line @typescript-eslint/ban-types
import Vec from './vector'
import { getStroke } from 'perfect-freehand'

function average (a: number, b: number): number {
  return (a + b) / 2
}

/**
 * Turn an array of points into a path of quadradic curves.
 *
 * @param points The points returned from perfect-freehand
 * @param closed Whether the stroke is closed
 */
function getSvgPathFromStroke (points: number[][], closed = true): string {
  const len = points.length

  if (len < 4) {
    return ``
  }

  let a = points[0]
  let b = points[1]
  const c = points[2]

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(
    2)},${b[1].toFixed(
    2
  )} ${average(b[0], c[0]).toFixed(2)},${average(b[1], c[1]).toFixed(2)} T`

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i]
    b = points[i + 1]
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).
      toFixed(2)} `
  }

  if (closed) {
    result += 'Z'
  }

  return result
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type ShapeStyle = {};

export const stokeWidths = {
  'small': 2,
  'medium': 3.5,
  'large': 5
}

export type Size = [number, number] // [width, height]

function getRectangleDrawPoints (style: ShapeStyle, [w, h]: Size) {
  const sw = stokeWidths.small
  w = Math.max(0, w)
  h = Math.max(0, h)

  // Corners
  const tl = [sw / 2, sw / 2]
  const tr = [w - sw / 2, sw / 2]
  const br = [w - sw / 2, h - sw / 2]
  const bl = [sw / 2, h - sw / 2]

  // Corner radii
  const rx = Math.min(w / 4, sw * 2)
  const ry = Math.min(h / 4, sw * 2)

  // Number of points per side
  const px = Math.max(8, Math.floor(w / 16))
  const py = Math.max(8, Math.floor(h / 16))

  // Inset each line by the corner radii and let the freehand algo
  // interpolate points for the corners.
  const lines = [
    Vec.pointsBetween(Vec.add(tl, [rx, 0]), Vec.sub(tr, [rx, 0]), px),
    Vec.pointsBetween(Vec.add(tr, [0, ry]), Vec.sub(br, [0, ry]), py),
    Vec.pointsBetween(Vec.sub(br, [rx, 0]), Vec.add(bl, [rx, 0]), px),
    Vec.pointsBetween(Vec.sub(bl, [0, ry]), Vec.add(tl, [0, ry]), py)
  ]

  // For the final points, include the first half of the first line again,
  // so that the line wraps around and avoids ending on a sharp corner.
  // This has a bit of finesse and magic—if you change the points between
  // function, then you'll likely need to change this one too.

  const points = [...lines.flat(), ...lines[0]].slice(
    5,
    Math.floor(px / -2) + 3
  )

  return {
    points
  }
}

export function getRectanglePath (
  style: ShapeStyle,
  size: Size
): string {
  const { points } = getRectangleDrawPoints(style, size)
  const stoke = getStroke(points, {
    size: stokeWidths.small,
    thinning: 0.65,
    streamline: 0.3,
    smoothing: 1,
    simulatePressure: false,
    last: true
  })
  return getSvgPathFromStroke(stoke)
}
