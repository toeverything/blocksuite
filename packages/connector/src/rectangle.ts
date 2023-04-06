export class Rectangle {
  readonly id = Math.random().toString(16).slice(2);
  x: number;
  y: number;
  w: number;
  h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  get minX() {
    return this.x;
  }

  get maxX() {
    return this.x + this.w;
  }

  get minY() {
    return this.y;
  }

  get maxY() {
    return this.y + this.h;
  }

  inflate(horizontal: number, vertical: number) {
    return new Rectangle(
      this.x - horizontal,
      this.y - vertical,
      this.w + horizontal * 2,
      this.h + vertical * 2
    );
  }

  contains(x: number, y: number) {
    return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY;
  }

  relativeDirection(x: number, y: number): 'left' | 'top' | 'right' | 'bottom' {
    const c = {
      left: Math.abs(x - this.x),
      right: Math.abs(x - this.x - this.w),
      top: Math.abs(y - this.y),
      bottom: Math.abs(y - this.y - this.h),
    };
    let min: number;
    let d = 'top';
    Object.entries(c).forEach(([k, v]) => {
      if (min === undefined) {
        min = v;
        d = k;
      } else {
        if (v < min) {
          min = v;
          d = k;
        }
      }
    });
    return d as 'left' | 'top' | 'right' | 'bottom';
  }
}
