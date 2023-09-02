/**
 * The options object for `getStroke` or `getStrokePoints`.
 * @param points An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is optional in both cases.
 * @param options (optional) An object with options.
 * @param options.size	The base size (diameter) of the stroke.
 * @param options.thinning The effect of pressure on the stroke's size.
 * @param options.smoothing	How much to soften the stroke's edges.
 * @param options.easing	An easing function to apply to each point's pressure.
 * @param options.simulatePressure Whether to simulate pressure based on velocity.
 * @param options.start Cap, taper and easing for the start of the line.
 * @param options.end Cap, taper and easing for the end of the line.
 * @param options.last Whether to handle the points as a completed stroke.
 */
export interface StrokeOptions {
  size?: number;
  thinning?: number;
  smoothing?: number;
  streamline?: number;
  easing?: (pressure: number) => number;
  simulatePressure?: boolean;
  start?: {
    cap?: boolean;
    taper?: number | boolean;
    easing?: (distance: number) => number;
  };
  end?: {
    cap?: boolean;
    taper?: number | boolean;
    easing?: (distance: number) => number;
  };
  // Whether to handle the points as a completed stroke.
  last?: boolean;
}

/**
 * The points returned by `getStrokePoints`, and the input for `getStrokeOutlinePoints`.
 */
export interface StrokePoint {
  point: number[];
  pressure: number;
  distance: number;
  vector: number[];
  runningLength: number;
}
